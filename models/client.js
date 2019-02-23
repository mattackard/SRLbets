const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
	clientName: { type: String, required: true },
	clientID: String,
	clientSecret: String,
});

module.exports = mongoose.model("client", ClientSchema);
