const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema({
	twitchUsername: { type: String, required: true, trim: true },
	betAmount: { type: Number, required: true },
	isPaid: { type: Boolean, required: true, default: false },
});

const EntrantSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	status: { type: String, required: true }, //Entered, Ready, In Progress, Finished, Forfiet
	place: { type: Number, required: true },
	time: String,
	twitch: String,
	betTotal: { type: Number, required: true, default: 0 },
	bets: { type: Map, of: BetSchema, default: {} },
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
	entrants: { type: Map, of: EntrantSchema, default: new Map() },
});

module.exports = mongoose.model("race", RaceSchema);
