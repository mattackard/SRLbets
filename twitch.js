const User = require("./models/user");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();

//sets twitch client info from env variables
let twitchClientID = process.env.TWITCH_CLINET_ID;
let twitchRedirect = process.env.REDIRECT;
let twitchClientSecret = process.env.TWITCH_CLIENT_SECRET;

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
				`https://id.twitch.tv/oauth2/token?client_id=${twitchClientID}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirect}`,
				{ withCredentials: true }
			)
			.then(data => getUserData(data, req))
			.then(getUserFollowsFromAPI)
			.then(getUsersFromID)
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
				req.session.twitchUserID = userData.data.data[0].id;
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
		let twitchID = userData.id;
		let pagination = lastPagination;

		//adds the pagination string and adds it to the request URL if it exists
		let getUrl = pagination
			? `https://api.twitch.tv/helix/users/follows?from_id=${twitchID}&after=${pagination}`
			: `https://api.twitch.tv/helix/users/follows?from_id=${twitchID}`;

		axios
			.get(getUrl, {
				headers: { "Client-ID": `${twitchClientID}` },
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
					userData.following = follows;
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

//gets the user data from the user IDs provided in the getUserFollowsFromAPI function
const getUsersFromID = userData => {
	return new Promise((resolve, reject) => {
		//generates a query string to attach to the get request url
		let idString = "";
		let count = 0;
		for (count; count < 100; count++) {
			idString += `id=${userData.following[count]}&`;
			count++;
		}
		//the request query is limited to 100 IDs, still need to allow for all user follows to be retrieved
		if (count === 100) {
			console.log(
				"100 user retrieved, there are probably more past the request limit"
			);
		}
		axios
			.get(`https://api.twitch.tv/helix/users?${idString}`, {
				headers: { "Client-ID": `${twitchClientID}` },
			})
			.then(data => {
				//user data is then placed into a map for easier searching functionality
				let followMap = new Map();
				data.data.data.forEach(user => {
					followMap.set(user.login, {
						twitchID: user.id,
						twitchUsername: user.login,
						twitchProfileImg: user.profile_image_url,
					});
				});
				//the map is added to the user object and returned
				userData.following = followMap;
				resolve(userData);
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
				//no user found in DB, create new one
				User.create(
					{
						twitchID: userData.id,
						twitchUsername: userData.login,
						twitchProfileImg: userData.profile_image_url,
						following: userData.following,
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
				//user found in DB, just need to update follows and profile img
				User.updateOne(
					{
						profileImg: userData.profile_image_url,
						following: userData.following,
					},
					(err, saved) => {
						if (err) {
							reject(err);
						} else {
							console.log(
								"user already exists, data was updated"
							);
							resolve(saved);
						}
					}
				);
			}
		});
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
			)}&client_id=${twitchClientID}&client_secret=${twitchClientSecret}&state=${state}`,
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
