const express = require("express");
const router = express.Router();

const Race = require("./models/race");
const User = require("./models/user");
const Client = require("./models/client");
const axios = require("axios");
const crypto = require("crypto");
const getRaceDataFromDB = require("./apiProcessing").getRaceDataFromDB;
const updateRaceData = require("./apiProcessing").updateRaceData;
const makeBet = require("./apiProcessing").makeBet;

//grab all the client information for OAuth interaction with the Twitch API
//from mongoDB
let twitchClientData, twitchClientId, twitchClientSecret, twitchRedirect;
Client.findOne({ clientName: "Twitch" }).exec((err, data) => {
	if (err) {
		console.error(err);
	}
	twitchClientData = data;
	twitchClientId = twitchClientData.clientId;
	twitchClientSecret = twitchClientData.clientSecret;
	twitchRedirect = "http://localhost:3000";
});

//creates a hash from a string
const hash = x =>
	crypto
		.createHash("sha256")
		.update(x, "utf8")
		.digest("hex");

function getUserFromTwitch(req, code, state, callback) {
	if (state !== hash(req.session.id)) {
		console.error("request state does not match response state");
	} else {
		//gets oAuth tokens and user data from Twitch
		axios
			.post(
				`https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirect}`,
				{ withCredentials: true }
			)
			.then(token => {
				if (token.status !== 200) {
					console.error("error in access token request");
					handleTwitchError(token);
				} else {
					//gets the user information using the token information retrieved in the parent request
					axios
						.get("https://api.twitch.tv/helix/users", {
							headers: {
								Authorization: `Bearer ${
									token.data.access_token
								}`,
							},
							withCredentials: true,
						})
						//saves the user data into db session and user db
						.then(userData => {
							if (userData.status !== 200) {
								console.error("error in user request");
								handleTwitchError(userData);
							}
							userData.following = [];
							req.session.username = userData.data.data[0].login;
							req.session.access_token = token.data.access_token;
							req.session.refresh_token =
								token.data.refresh_token;
							req.session.token_type = token.data.token_type;
							req.session.twitchUserId = userData.data.data[0].id;
							req.session.save();
							getUserFollowsFromAPI(
								userData.data.data[0].id,
								"",
								[],
								followList => {
									return saveUser(
										userData,
										token,
										followList,
										callback
									);
								}
							);
						});
				}
			});
	}
}

function saveUser(userData, tokens, followList, callback) {
	//if the user doesnt already exists one is created
	getDoc(User, { twitchUsername: userData.data.data[0].login }, doc => {
		if (!doc) {
			User.create(
				{
					twitchUsername: userData.data.data[0].login,
					avatar: userData.data.data[0].profile_image_url,
					oAuth: tokens.data,
					following: followList,
				},
				(err, saved) => {
					if (err) {
						throw Error(err);
					} else {
						console.log("user was saved : ");
						console.log(saved);
						callback(saved);
					}
				}
			);
		} else {
			console.log("user already exists, updated data is being sent");
			User.updateOne(
				{
					avatar: userData.data.data[0].profile_image_url,
					oAuth: tokens.data,
					following: followList,
				},
				err => {
					if (err) {
						throw Error(err);
					} else {
						callback(doc);
					}
				}
			);
		}
	});
}

//gets the user ids for all twitch users followed by the signed in user
function getUserFollowsFromAPI(
	twitchId,
	lastPagination = "",
	followList = [],
	callback
) {
	//sets pagination string, get url, and updated follow list for recursive calls
	let follows = followList;
	let pagination = lastPagination;
	let getUrl = pagination
		? `https://api.twitch.tv/helix/users/follows?from_id=${twitchId}&after=${pagination}`
		: `https://api.twitch.tv/helix/users/follows?from_id=${twitchId}`;
	axios
		.get(getUrl, {
			headers: { "Client-ID": `${twitchClientId}` },
			withCredentials: true,
		})
		.then(response => {
			//sets the new pagination string for the next request
			pagination = response.data.pagination.cursor;
			response.data.data.forEach(follow => {
				follows.push(follow.to_id);
			});
			//continues to get more following ids until the total has been reached
			if (follows.length < response.data.total) {
				getUserFollowsFromAPI(twitchId, pagination, follows, callback);
			}
			//runs the callback to send the complete unpaginated data
			if (follows.length === response.data.total) {
				callback(follows);
			}
		})
		.catch(err => {
			throw Error(err);
		});
}

//checks for a document in the database and runs a callback
function getDoc(Collection, search, callback) {
	Collection.findOne(search).exec((err, doc) => {
		//returns the found document if it exists
		if (err) {
			console.error(err);
		}
		callback(doc);
	});
}

function handleTwitchError(res) {
	switch (res.status) {
		//unauthorized
		case 401:
			handleUnauthorized();
		//ok
		case 200:
			return res;
		//bad request
		case 400:
			throw Error(res);
		//forbidden
		case 403:
			throw Error(res);
	}
	throw Error(res);
}

function handleUnauthorized() {
	console.log("called unauthorized");
	User.find({ twitchUsername: req.session.username }, (err, user) => {
		let res = tokenRefresh(
			user.oAuth.access_token,
			user.oAuth.refresh_token,
			twitchClientId,
			twitchClientSecret
		);
		if (res.status === 200) {
			user.oAuth.access_token = res.access_token;
			user.oAuth.refresh_token = res.refresh_token;
			user.save((err, saved) => {
				if (err) throw Error(err);
				console.log("tokens refreshed and saved in db");
				return saved;
			});
		}
		if (res.status === 400) {
			//redirect to twitch auth page
		}
	});
}

//needs state added for request
function tokenRefresh(refresh) {
	console.log("attempting to refresh token");
	axios
		.post(
			`https://id.twitch.tv/oauth2/token--data-urlencode?grant_type=refresh_token&refresh_token=${encodeURIComponent(
				refresh
			)}&client_id=${twitchClientId}&client_secret=${twitchClientSecret}`,
			{ withCredentials: true }
		)
		.then((err, res) => {
			if (err) throw Error("Error in token refresh request");
			return res;
		});
}

//GET race data and send to client
router.get("/getRaces", (req, res) => {
	let open, ongoing, finished;
	getRaceDataFromDB({ status: "Entry Open" }, null, data => {
		open = data;
		getRaceDataFromDB({ status: "In Progress" }, null, data => {
			ongoing = data;
			getRaceDataFromDB({ status: "Complete" }, 10, data => {
				finished = data;
				return res.json({
					races: {
						open: open,
						ongoing: ongoing,
						finished: finished,
					},
				});
			});
		});
	});
});

//GET Twitch authorization url
router.get("/twitchLoginUrl", (req, res) => {
	console.log(req.session.id);
	let authState = hash(req.session.id);
	return res.json({
		twitchUrl: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${twitchClientId}&redirect_uri=${twitchRedirect}&scope=user:read:email&state=${authState}`,
	});
});

//GET twitch client data and send to client
router.get("/twitchAuth", (req, res) => {
	console.log(req.session.id);
	getUserFromTwitch(req, req.query.code, req.query.state, data => {
		res.json(data);
	});
});

//route for twitch auth revoke / logout
router.get("/twitchLogout", (req, res, next) => {
	//req.session.access_token is undefined
	console.log(req.session.access_token);
	axios
		.post(
			`https://id.twitch.tv/oauth2/revoke?client_id=${twitchClientId}&token=${
				req.session.access_token
			}`,
			{ withCredentials: true }
		)
		.then(() => {
			req.session.destroy(err => {
				if (err) {
					throw Error("Error on session destroy");
				}
			});
		})
		.catch(err => next(err));

	return res.send("success");
});

//GET currently logged in user's information
router.get("/getLoggedInUser", (req, res, next) => {
	console.log(req.session.access_token, req.session.username);
	User.findOne({ twitchUsername: req.session.username }).exec((err, data) => {
		if (err) {
			err.message = "error in getLoggedInUserRoute";
			return next(err);
		} else {
			return res.json({ user: data });
		}
	});
});

//GET recently finished races with a race return limit
router.get("/getFinishedRaces", (req, res, next) => {
	let finished;
	let limit = 10;
	getRaceDataFromDB({ status: "Complete" }, limit, data => {
		finished = data;
		return res.json({
			finishedRaceData: finished,
		});
	});
});

router.post("/makeBet", (req, res, next) => {
	if (!req.session.username) {
		res.message = "User is not logged in";
	} else if (!req.body.entrant) {
		res.message = "No race user entered";
	} else if (!req.body.betAmount) {
		res.message = "No bet amount entered";
	} else {
		makeBet(req.session.username, req.body.entrant, req.body.betAmount);
	}
	res.send(res.message);
});

module.exports = router;
