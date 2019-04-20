const mongoose = require("mongoose");

const GameCategory = new mongoose.Schema({
	goal: { type: String, required: true },
	//needs implemented
	avgTime: { type: Number, required: true },
	//needs implemented
	mostWins: {
		srlName: String,
		twitchUsername: String,
		numWins: Number,
	},
	//needs implemented
	mostEntries: {
		srlName: String,
		twitchUsername: String,
		numEntries: Number,
	},
	//needs implemented
	bestTime: {
		srlName: String,
		twitchUsername: String,
		time: Number,
	},
});

const GameSchema = new mongoose.Schema({
	gameID: { type: Number, required: true },
	gameTitle: { type: String, required: true, trim: true },
	raceHistory: { type: Array, of: Number, default: new Array() },
	categories: { type: Map, of: GameCategory, default: new Map() },
});

module.exports = mongoose.model("game", GameSchema);
