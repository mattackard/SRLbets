const mongoose = require("mongoose");

const RaceHistory = new mongoose.Schema({
	raceID: { type: String, required: true },
	game: { type: String, required: true },
	goal: String,
	status: { type: String, required: true },
	place: { type: Number, required: true },
	time: { type: Number, required: true },
	date: { type: Date, required: true },
	isBestTime: { type: Boolean, required: true, default: false },
});

const BetHistory = new mongoose.Schema({
	raceID: { type: String, required: true },
	game: { type: String, required: true },
	goal: String,
	entrant: { type: String, required: true },
	amountBet: { type: Number, required: true },
	date: { type: Date, required: true, default: new Date() },
	result: {
		type: String,
		required: true,
		default: "Race In Progress",
	},
});

const GameCategory = new mongoose.Schema({
	//needs implemented
	goal: { type: String, required: true },
	avgTime: { type: Number, required: true },
	bestTime: { type: Number, required: true },
	winRatio: { type: Number, required: true },
	numWins: { type: Number, required: true },
	numEntries: { type: Number, required: true },
});

const GameHistory = new mongoose.Schema({
	gameID: { type: String, required: true },
	gameTitle: { type: String, required: true },
	categories: { type: Map, of: GameCategory, default: new Map() },
});

const UserSchema = new mongoose.Schema({
	srlName: { type: String, trim: true },
	points: { type: Number, default: 100, required: true },
	twitchID: { type: String, trim: true },
	twitchUsername: { type: String, trim: true },
	twitchProfileImg: String,
	following: { type: Map, of: Object, default: new Map() },
	betHistory: [BetHistory],
	betRatio: { type: Number, default: 0, required: true }, //needs implemented
	betTotal: { type: Number, default: 0, required: true }, //needs implemented
	raceHistory: [RaceHistory],
	raceRatio: { type: Number, default: 0, required: true }, //needs implemented
	gameHistory: { type: Map, of: GameHistory, default: new Map() },
});

module.exports = mongoose.model("user", UserSchema);
