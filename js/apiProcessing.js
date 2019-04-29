const axios = require("axios");
const updateGameData = require("./game").updateGameData;
const updateUserData = require("./user").updateUserData;
const updateRaceData = require("./race").updateRaceData;
const handleCancelledRaces = require("./race").handleCancelledRaces;

function getRaceDataFromSRL() {
	//gets the current race json data from the SRL API
	//and saves/updates it in the local database
	axios
		.get("http://api.speedrunslive.com/races", { withCredentails: true })
		.then(response => {
			updateRaceData(response.data.races);
			updateGameData(response.data.races);
			updateUserData(response.data.races);
			handleCancelledRaces(response.data.races);
		})
		.catch(err => {
			throw Error(err);
		});
}

module.exports.getRaceDataFromSRL = getRaceDataFromSRL;
