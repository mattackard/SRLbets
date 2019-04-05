const mongoose = require("mongoose");

const GameCategory = new mongoose.Schema({
	//needs implemented
	goal: { type: String, required: true },
	avgTime: { type: Number, required: true },
	mostWins: {
		srlName: String,
		twitchUsername: String,
		numWins: Number,
	},
	mostEntries: {
		srlName: String,
		twitchUsername: String,
		numEntries: Number,
	},
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
	categories: { type: Map, of: GameCategory, default: new Map() }, //goal as map key
});

module.exports = mongoose.model("game", GameSchema);
