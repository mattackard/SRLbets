const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	twitchUsername: { type: String, required: true, trim: true },
	points: { type: Number, default: 100, required: true },
	avatar: String,
	oAuth: {},
	betHistory: [
		{
			raceId: { type: String, required: true },
			entrant: { type: String, required: true },
			amountBet: { type: Number, required: true },
			result: {
				type: String,
				required: true,
				default: "Race has not finished",
			},
		},
	],
	following: [],
});

module.exports = mongoose.model("user", UserSchema);