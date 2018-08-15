const mongoose = require('mongoose');

const RaceSchema = new mongoose.Schema({
  raceID: { type: String, required: true },
  gameID: { type: Number, required: true },
  gameTitle: { type: String, required: true, trim: true },
  goal: String,
  status: { type: String, required: true },
  timeStarted: Date,
  entrants: [
    {
      name: { type: String, required: true, trim: true },
      status: { type: String, required: true },
      place: { type: Number, required: true },
      time: String,
      twitch: String
    }
  ]
});

const Race = mongoose.model('race', RaceSchema);

module.exports = Race;
