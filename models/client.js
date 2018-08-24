const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  clientName : { type: String, required: true },
  clientId : String,
  clientSecret : String,
});

const Client = mongoose.model('client', ClientSchema);

module.exports = Client;
