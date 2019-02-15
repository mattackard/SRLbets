const User = require("./models/user");
const Client = require("./models/client");
const axios = require("axios");
const crypto = require("crypto");

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

//utility function to create a hash from a string
const hash = x =>
	crypto
		.createHash("sha256")
		.update(x, "utf8")
		.digest("hex");

const getUserFromTwitch = (req, code, state, callback) => {
	if (state !== hash(req.session.id)) {
		throw Error(
			"Returned OAuth state does not match state sent in initial request"
		);
	} else {
		//gets oAuth tokens and user data from Twitch
		axios
			.post(
				`https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirect}`,
				{ withCredentials: true }
			)
			.then(data => getUserData(data, req))
			.then(getUserFollowsFromAPI)
			// .then(getUsersFromId)
			.then(saveUser)
			.then(callback)
			.catch(err => {
				throw Error(err);
			});
	}
};

const getUserData = (tokenObj, req) => {
	//gets the user information using the token information retrieved initial auth request
	return new Promise((resolve, reject) => {
		axios
			.get("https://api.twitch.tv/helix/users", {
				headers: {
					Authorization: `Bearer ${tokenObj.data.access_token}`,
				},
				withCredentials: true,
			})
			.then(userData => {
				//saves user info into session store
				req.session.username = userData.data.data[0].login;
				req.session.access_token = tokenObj.data.access_token;
				req.session.refresh_token = tokenObj.data.refresh_token;
				req.session.token_type = tokenObj.data.token_type;
				req.session.twitchUserId = userData.data.data[0].id;
				req.session.save();
				resolve(userData.data.data[0]);
			})
			.catch(err => {
				reject(err);
			});
	});
};

//gets the user ids for all twitch users followed by the signed in user
const getUserFollowsFromAPI = (
	userData,
	lastPagination = "",
	followList = []
) => {
	return new Promise((resolve, reject) => {
		//sets pagination string, get url, and updated follow list for recursive calls
		let follows = followList;
		let twitchId = userData.id;
		let pagination = lastPagination;

		//adds the pagination string and adds it to the request URL if it exists
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
					//get user data from ID?
					follows.push(follow.to_id);
				});
				//continues to get more following ids until the total has been reached
				if (follows.length < response.data.total) {
					resolve(
						getUserFollowsFromAPI(userData, pagination, follows)
					);
				}
				//runs the callback to send the complete unpaginated data
				else if (follows.length === response.data.total) {
					userData.followList = follows;
					resolve(userData);
				} else {
					reject(
						"Something went wrong with getting user follows ... the generated list is longer than twitch's recorded follows for user"
					);
				}
			})
			.catch(err => {
				reject(err);
			});
	});
};

const saveUser = userData => {
	return new Promise((resolve, reject) => {
		//if the user doesnt already exists one is created
		User.findOne({ twitchUsername: userData.login }, (err, doc) => {
			if (err) {
				err.message = "Could not find user in DB for saveUser function";
				reject(err);
			}
			if (!doc) {
				User.create(
					{
						twitchUsername: userData.login,
						avatar: userData.profile_image_url,
						following: userData.followList,
					},
					(err, saved) => {
						if (err) {
							reject(err);
						} else {
							console.log("user was saved");
							resolve(saved);
						}
					}
				);
			} else {
				console.log("user already exists, updated data is being sent");
				User.updateOne(
					{
						avatar: userData.profile_image_url,
						following: userData.followList,
					},
					(err, saved) => {
						if (err) {
							reject(err);
						} else {
							resolve(saved);
						}
					}
				);
			}
		});
	});
};

const handleTwitchError = (req, res) => {
	switch (res.status) {
		//unauthorized
		case 401:
			handleUnauthorized(req);
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
};

const handleUnauthorized = req => {
	console.log("called unauthorized");
	User.find({ twitchUsername: req.session.username }, (err, user) => {
		if (err) {
			throw Error(err);
		}
		let res = tokenRefresh(req, user.oAuth.refresh_token);
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
};

//requests a new twitch access token using the session's refresh token
const tokenRefresh = (req, refresh) => {
	console.log("attempting to refresh token");
	const state = hash(req.session.id);
	axios
		.post(
			`https://id.twitch.tv/oauth2/token--data-urlencode?grant_type=refresh_token&refresh_token=${encodeURIComponent(
				refresh
			)}&client_id=${twitchClientId}&client_secret=${twitchClientSecret}&state=${state}`,
			{ withCredentials: true }
		)
		.then((err, res) => {
			if (err) throw Error("Error in token refresh request");
			return res;
		})
		.catch(err => {
			throw Error(err);
		});
};

module.exports.getUserFromTwitch = getUserFromTwitch;
module.exports.hash = hash;
