const mongoose = require('mongoose');

const RaceSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  }
});

const Race = mongoose.model('Race', RaceSchema);
module.exports = Race;
