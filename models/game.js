const mongoose = require("mongoose");

const RaceHistory = new mongoose.Schema({
	//needs implemented
	raceID: { type: String, required: true },
	goal: String,
	status: { type: String, required: true },
	time: Number,
	timeStarted: { type: Date, required: true },
	simpleTime: String,
	betTotal: { type: Number, required: true, default: 0 },
});

const GameSchema = new mongoose.Schema({
	//needs implemented
	gameID: { type: Number, required: true },
	gameTitle: { type: String, required: true, trim: true },
	raceHistory: [RaceHistory],
	status: { type: String, required: true },
	betTotal: { type: Number, required: true, default: 0 },
	avgTime: Number,
	mostWins: {
		srlName: String,
		twitcUsername: String,
		numWins: Number,
	},
	mostEntries: {
		srlName: String,
		twitcUsername: String,
		numEntries: Number,
	},
	bestTime: {
		srlName: String,
		twitcUsername: String,
		time: Number,
	},
});

module.exports = mongoose.model("game", GameSchema);
