const express = require("express");
const router = express.Router();
const User = require("./models/user");
const Race = require("./models/race");
const axios = require("axios");
const getRaceDataFromDB = require("./js/db").getRaceDataFromDB;
const makeBet = require("./js/db").makeBet;
const getUserFromTwitch = require("./js/twitch").getUserFromTwitch;
const hash = require("./js/twitch").hash;
require("dotenv").config();

//sets twitch client info from env variables
let twitchClientID = process.env.TWITCH_CLIENT_ID;
let twitchRedirect = process.env.TWITCH_REDIRECT;

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
		twitchUrl: `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${twitchClientID}&redirect_uri=${twitchRedirect}&scope=user:read:email&state=${authState}`,
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
			`https://id.twitch.tv/oauth2/revoke?client_id=${twitchClientID}&token=${
				req.session.access_token
			}`,
			{ withCredentials: true }
		)
		.then(() => {
			req.session.username = "";
			req.session.access_token = "";
			req.session.refresh_token = "";
			req.session.token_type = "";
			req.session.twitchUserID = "";
			req.session.save();
		})
		.catch(err => next(err));
	return res.send("success");
});

//GET currently logged in user's information
router.get("/getLoggedInUser", (req, res, next) => {
	console.log(req.session.username);
	User.findOne({
		twitchUsername: req.session.username,
		twitchID: req.session.twitchUserID,
	}).exec((err, data) => {
		if (err) {
			err.message = "error in getLoggedInUserRoute";
			return next(err);
		} else {
			return data ? res.json({ user: data }) : res.send("no user");
		}
	});
});

//GET any user's information
router.get("/getUser", (req, res, next) => {
	User.findOne({ srlName: req.query.username }).exec((err, data) => {
		if (err) {
			err.message = "error in getUser route";
			return next(err);
		} else {
			return data ? res.json({ user: data }) : res.send("no user");
		}
	});
});

//GET a game's race sumary
router.get("/getGameSummary", (req, res, next) => {
	Race.find({ gameTitle: req.query.gameTitle }, (err, data) => {
		if (err) {
			err.message = "error in getGameSummary route";
			return next(err);
		} else {
			return data ? res.json({ game: data }) : res.send("no game found");
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
