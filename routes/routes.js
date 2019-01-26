const express = require("express");
const router = express.Router();
const Race = require("../models/race");
const User = require("../models/user");
const Client = require("../models/client");
const axios = require("axios");
const getRaceDataFromDB = require("../public/js/apiProcessing")
	.getRaceDataFromDB;
const updateRaceData = require("../public/js/apiProcessing").updateRaceData;
const makeBet = require("../public/js/apiProcessing").makeBet;

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

function getUserFromTwitch(req, code, callback) {
	//gets oAuth tokens and user data from Twitch
	axios
		.post(
			`https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirect}`
		)
		.then(token => {
			if (token.status !== 200) {
				console.log("error in access token request");
				handleTwitchError(token);
			} else {
				//gets the user information using the token information retrieved in the parent request
				axios
					.get("https://api.twitch.tv/helix/users", {
						headers: {
							Authorization: `Bearer ${token.data.access_token}`,
						},
					})
					.then(userData => {
						if (userData.status !== 200) {
							console.log("error in user request");
							handleTwitchError(userData);
						}
						userData.following = [];
						req.session.username = userData.data.data[0].login;
						req.session.access_token = token.data.access_token;
						req.session.refresh_token = token.data.refresh_token;
						req.session.token_type = token.data.token_type;
						req.session.twitchUserId = userData.data.data[0].id;
						req.session.save();
						getUserFollowsFromAPI(req, "", [], followList => {
							callback(userData, token, followList);
						});
					});
			}
		});
}

function saveUser(userData, tokens, followList) {
	//if the user doesnt already exists one is created
	checkForDoc(User, { twitchUsername: userData.data.data[0].login }, doc => {
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
					}
				}
			);
		} else {
			console.log("user already exists, updated data is being sent");
			User.update({
				avatar: userData.data.data[0].profile_image_url,
				oAuth: tokens.data,
				following: followList,
			});
		}
	});
}

//gets the user ids for all twitch users followed by the signed in user
function getUserFollowsFromAPI(
	req,
	lastPagination = "",
	followList = [],
	callback
) {
	//sets pagination string, get url, and updated follow list for recursive calls
	let follows = followList;
	let pagination = lastPagination;
	let getUrl = pagination
		? `https://api.twitch.tv/helix/users/follows?from_id=${
				req.session.twitchUserId
		  }&after=${pagination}`
		: `https://api.twitch.tv/helix/users/follows?from_id=${
				req.session.twitchUserId
		  }`;
	axios
		.get(getUrl, { headers: { "Client-ID": `${twitchClientId}` } })
		.then(response => {
			//sets the new pagination string for the next request
			pagination = response.data.pagination.cursor;
			response.data.data.forEach(follow => {
				follows.push(follow.to_id);
			});
			//continues to get more following ids until the total has been reached
			if (follows.length < response.data.total) {
				getUserFollowsFromAPI(req, pagination, follows, callback);
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

function checkForDoc(Collection, search, callback) {
	//checks for a document in the database and runs a callback
	Collection.find(search).exec((err, docs) => {
		//passing in a boolean depeneding on if the document exists
		if (err) {
			console.error(err);
		}
		if (docs.length > 0) {
			callback(true);
		} else {
			callback(false);
		}
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

function tokenRefresh(refresh) {
	console.log("attempting to refresh token");
	axios
		.post(
			`https://id.twitch.tv/oauth2/token--data-urlencode?grant_type=refresh_token&refresh_token=${encodeURIComponent(
				refresh
			)}&client_id=${twitchClientId}&client_secret=${twitchClientSecret}`
		)
		.then((err, res) => {
			if (err) throw Error("Error in token refresh request");
			return res;
		});
}

//GET home route
router.get("/", (req, res, next) => {
	if (req.query.code) {
		//checks if twitch has redirected to home with an access code and gets the user information
		getUserFromTwitch(req, req.query.code, saveUser);
		res.redirect("/");
	} else {
		//if no code is present, show homepage
		let open, ongoing, finished;
		getRaceDataFromDB({ status: "Entry Open" }, null, data => {
			open = data;
			getRaceDataFromDB({ status: "In Progress" }, null, data => {
				ongoing = data;
				getRaceDataFromDB({ status: "Complete" }, 10, data => {
					finished = data;
					return res.render("index", {
						title: "SRL Bets",
						openRaceData: open,
						ongoingRaceData: ongoing,
						finishedRaceData: finished,
					});
				});
			});
		});
	}
});

//route for twitch auth redirect / login
router.get("/twitchLogin", (req, res, next) => {
	res.redirect(
		`https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${twitchRedirect}&response_type=code&scope=user:read:email`
	);
});

//route for twitch auth revoke / logout
router.get("/twitchLogout", (req, res, next) => {
	axios
		.post(
			`https://id.twitch.tv/oauth2/revoke?client_id=${twitchClientId}&token=${
				req.session.access_token
			}`
		)
		.then(() => {
			req.session.destroy(err => {
				if (err) {
					throw Error("Error on session destroy");
				}
			});
		});
	res.redirect("/");
});

//route for checking if username is stored in session
router.get("/username", (req, res, next) => {
	console.log(req.session.username);
	res.redirect("/");
});

//get follows for twitch user
router.get("/follows", (req, res, next) => {
	getUserFollowsFromAPI(req, "", [], follows => {
		res.render("follows", {
			username: req.session.username,
			followingData: follows,
		});
	});
});

router.get("/profile", (req, res, next) => {
	User.findOne({ twitchUsername: req.session.username }).exec((err, data) => {
		if (err) {
			return next(err);
		} else {
			res.render("profile", { user: data });
		}
	});
});

router.get("/makeBet", (req, res, next) => {
	res.render("makeBet");
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
