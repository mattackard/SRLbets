const mongoose = require("mongoose");

const BetSchema = new mongoose.Schema({
	twitchUsername: { type: String, required: true, trim: true },
	betAmount: { type: Number, required: true },
	isPaid: { type: Boolean, required: true, default: false },
});

const EntrantSchema = new mongoose.Schema({
	name: { type: String, required: true, trim: true },
	status: { type: String, required: true }, //Entered, Ready, In Progress, Finished, Forfeit
	place: { type: Number, required: true },
	time: String,
	twitch: String,
	payRatio: { type: Number, required: true, default: 2 }, //needs implemented
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
	winner: {
		//needs implemented
		srlName: String,
		twitchUsername: String,
		betTotal: { type: Number, default: 0 },
	},
	allBetsPaid: { type: Boolean, default: false },
});

module.exports = mongoose.model("race", RaceSchema);
