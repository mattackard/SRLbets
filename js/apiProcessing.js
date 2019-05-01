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
			let userObj = {};
			let gameObj = {};
			response.data.races.forEach(race => {
				updateRaceData(race);
				//makes an object all races
				//for each game
				if (!gameObj[race.game.name]) {
					gameObj[race.game.name] = {
						races: [race],
					};
				} else {
					gameObj[race.game.name].races.push(race);
				}
				for (let i in race.entrants) {
					//makes an object with all races each user
					//is currently in
					if (!userObj[race.entrants[i].displayname]) {
						userObj[race.entrants[i].displayname] = {
							twitch: race.entrants[i].twitch,
							races: [race],
						};
					} else {
						userObj[race.entrants[i].displayname].races.push(race);
					}
				}
			});
			updateGameData(gameObj);
			updateUserData(userObj);
			handleCancelledRaces(response.data.races);
		})
		.catch(err => {
			throw Error(err);
		});
}

module.exports.getRaceDataFromSRL = getRaceDataFromSRL;
