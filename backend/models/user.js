const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
	id: { type: String, required: true, trim: true },
	twitchUsername: { type: String, required: true, trim: true },
	srlUserName: { type: String, trim: true },
	points: { type: Number, default: 100, required: true },
	profileImg: String,
	following: { type: Map, of: Object },
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
	raceHistory: [],
});

module.exports = mongoose.model("user", UserSchema);
