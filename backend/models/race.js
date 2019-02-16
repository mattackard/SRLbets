const mongoose = require("mongoose");

const EntrantSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	status: { type: String, required: true },
	place: { type: Number, required: true },
	time: String,
	twitch: String,
	betUser: { type: Number, required: true, default: 0 },
});

const RaceSchema = new mongoose.Schema({
	raceID: { type: String, required: true },
	gameID: { type: Number, required: true },
	gameTitle: { type: String, required: true, trim: true },
	goal: String,
	status: { type: String, required: true },
	timeStarted: { type: Date, required: true },
	simpleTime: String,
	betTotal: { type: Number, required: true, default: 0 },
	entrants: { type: Map, of: EntrantSchema },
});

module.exports = mongoose.model("race", RaceSchema);
