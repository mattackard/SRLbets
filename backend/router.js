const express = require("express");
const router = express.Router();

const User = require("./models/user");
const Client = require("./models/client");
const axios = require("axios");
const getRaceDataFromDB = require("./apiProcessing").getRaceDataFromDB;
const makeBet = require("./apiProcessing").makeBet;
const getUserFromTwitch = require("./twitch").getUserFromTwitch;
const hash = require("./twitch").hash;

//grab all the client information for OAuth interaction with the Twitch API
//from mongoDB
let twitchClientData, twitchClientId, twitchRedirect;
Client.findOne({ clientName: "Twitch" }).exec((err, data) => {
	if (err) {
		console.error(err);
	}
	twitchClientData = data;
	twitchClientId = twitchClientData.clientId;
	twitchRedirect = "http://localhost:3000";
});

//GET race data and send to client
router.get("/getRaces", async (req, res) => {
	let open = await getRaceDataFromDB(
		{ status: { $in: ["Entry Open", "Entry Closed"] } },
		null
	);
	let ongoing = await getRaceDataFromDB({ status: "In Progress" }, null);
	let finished = await getRaceDataFromDB({ status: "Complete" }, 10);
	return res.json({
		races: {
			open: open,
			ongoing: ongoing,
			finished: finished,
		},
	});
});

//GET Twitch authorization url
router.get("/twitchLoginUrl", (req, res) => {
	let authState = hash(req.session.id);
	return res.json({
		twitchUrl: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${twitchClientId}&redirect_uri=${twitchRedirect}&scope=user:read:email&state=${authState}`,
	});
});

//GET twitch client data and send to client
router.get("/twitchAuth", (req, res) => {
	getUserFromTwitch(req, req.query.code, req.query.state, data => {
		res.json(data);
	});
});

//route for twitch auth revoke / logout
router.get("/twitchLogout", (req, res, next) => {
	axios
		.post(
			`https://id.twitch.tv/oauth2/revoke?client_id=${twitchClientId}&token=${
				req.session.access_token
			}`,
			{ withCredentials: true }
		)
		.then(() => {
			req.session.username = "";
			req.session.access_token = "";
			req.session.refresh_token = "";
			req.session.token_type = "";
			req.session.twitchUserId = "";
			req.session.save();
		})
		.catch(err => next(err));
	return res.send("success");
});

//GET currently logged in user's information
router.get("/getLoggedInUser", (req, res, next) => {
	User.findOne({ twitchUsername: req.session.username }).exec((err, data) => {
		if (err) {
			err.message = "error in getLoggedInUserRoute";
			return next(err);
		} else {
			return data ? res.json({ user: data }) : res.send("no user");
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
		res.message = "You must be logged in to make a bet";
	} else if (!req.body.entrant) {
		res.message = "Race user can not be blank";
	} else if (!req.body.betAmount) {
		res.message = "No bet amount entered";
	} else {
		req.message = makeBet(
			req.session.username,
			req.body.raceID,
			req.body.entrant,
			req.body.betAmount
		);
	}
	res.send(res.message || "success");
});

module.exports = router;
