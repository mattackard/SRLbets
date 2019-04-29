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
			//need to build an object that has all races for a given entrant
			//since some entrants are in more than one race at a time
			//i should probably do the same with games because the same game can be raced
			//multiple times simultaneously
			response.data.races.forEach(race => {
				updateRaceData(race);
				updateGameData(race);
				updateUserData(race);
			});
			handleCancelledRaces(response.data.races);
		})
		.catch(err => {
			throw Error(err);
		});
}

module.exports.getRaceDataFromSRL = getRaceDataFromSRL;
