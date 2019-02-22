const mongoose = require("mongoose");

const RaceHistory = new mongoose.Schema({
	raceID: { type: String, required: true },
	game: { type: String, required: true },
	goal: String,
	status: { type: String, required: true },
	place: Number,
	time: Number,
});

const BetHistory = new mongoose.Schema({
	raceID: { type: String, required: true },
	entrant: { type: String, required: true },
	amountBet: { type: Number, required: true },
	result: {
		type: String,
		required: true,
		default: "Race has not finished",
	},
});

const UserSchema = new mongoose.Schema({
	srlName: { type: String, trim: true },
	points: { type: Number, default: 100, required: true },
	twitchID: { type: String, trim: true },
	twitchUsername: { type: String, trim: true },
	twitchProfileImg: String,
	following: { type: Map, of: Object, default: new Map() },
	betHistory: [BetHistory],
	raceHistory: [RaceHistory],
});

module.exports = mongoose.model("user", UserSchema);
