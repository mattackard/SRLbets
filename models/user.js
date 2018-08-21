const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  twitchUsername: { type: String, required: true, trim: true },
  points : { type: Number, default: 100, required: true },
  betHistory : [
    {
      raceId : { type: String, required: true },
      amountBet : { type: Number, required: true },
      result : { type: String, required: true, default: 'Race is in progress' }
    }
  ]
});

const User = mongoose.model('user', UserSchema);

module.exports = User;
