const axios = require("axios");
const Race = require("./models/race");
const User = require("./models/user");

function getRaceDataFromSRL() {
	//gets the current race json data from the SRL API
	//and saves/updates it in the local database
	axios
		.get("http://api.speedrunslive.com/races", { withCredentails: true })
		.then(response => {
			updateRaceData(response.data.races);
		})
		.catch(err => {
			throw Error(err);
		});
}

function getRaceDataFromDB(search, limit) {
	return new Promise((resolve, reject) => {
		Race.find(search)
			.sort({ timeStarted: -1 })
			.limit(limit)
			.exec((err, data) => {
				if (err) {
					err.message =
						"Error getting race data from db (getRaceDataFromDB)";
					reject(err);
				} else {
					resolve(data);
				}
			});
	});
}

function createEntrantObj(entrantObj, race) {
	//fills in data for the race entrant schema
	return new Promise((resolve, reject) => {
		for (let i in race.entrants) {
			//fills in data for the race entrant schema
			entrantObj.set(race.entrants[i].displayname, {
				name: race.entrants[i].displayname,
				status: race.entrants[i].statetext,
				place: race.entrants[i].place,
				time: convertRunTime(race.entrants[i].time),
				twitch: race.entrants[i].twitch,
				betUser: 0,
			});
		}
		if (Object.keys(race.entrants).length === entrantObj.size) {
			resolve(entrantObj);
		} else {
			reject("entrant obj did not fully populate");
		}
	});
}

function restoreUserBets(entrantObj, doc) {
	//checks if entrant is already in the db and uses previous bet amount if so, otherwise set at 0
	for (let entrant of entrantObj.keys()) {
		const oldEntrant = doc.entrants.get(entrant);
		if (oldEntrant) {
			entrantObj.set(entrant, {
				...entrantObj.get(entrant),
				betUser: oldEntrant.betUser,
			});
		}
	}
	return entrantObj;
}

function updateRaceData(races) {
	races.forEach(async race => {
		//build the object of entrants
		let entrantObj = new Map();
		entrantObj = await createEntrantObj(entrantObj, race);

		//get the race from the database if it already exists
		Race.findOne({ raceID: race.id }, async (err, doc) => {
			if (err) {
				throw Error(err);
			}
			if (doc) {
				//checks if race status has changed
				if (doc.status !== race.statetext) {
					handleRaceStatusChange(race.id, doc.status, race.statetext);
				}
				doc.raceID = race.id;
				doc.gameID = race.game.id;
				doc.gameTitle = race.game.name;
				doc.goal = race.goal;
				doc.status = race.statetext;
				doc.timeStarted = convertRaceStartTime(race.time);
				doc.simpleTime = simplifyDate(convertRaceStartTime(race.time));
				doc.entrants = await restoreUserBets(entrantObj, doc);
				doc.save(err => {
					if (err) {
						err.message("error on race update save");
						throw Error(err);
					}
				});
			} else {
				//create a new race document if it can't already be found in the database
				let raceDoc = new Race({
					raceID: race.id,
					gameID: race.game.id,
					gameTitle: race.game.name,
					goal: race.goal,
					status: race.statetext,
					timeStarted: convertRaceStartTime(race.time),
					simpleTime: simplifyDate(convertRaceStartTime(race.time)),
					entrants: entrantObj,
				});
				Race.create(raceDoc);
			}
		});
	});
	console.log("races retrieved from SRL");
}

function handleRaceStatusChange(raceId, oldStatus, newStatus) {
	console.log(`Race ${raceId} is changing from ${oldStatus} to ${newStatus}`);
	if (newStatus === "Complete") {
		Race.findOne({ raceID: raceId }, (err, doc) => {
			if (err) {
				err.message = "Error in finding race on status change";
				throw Error(err);
			} else if (!doc) {
				throw Error(
					"Could not find the race in the database with the provided race id"
				);
			} else {
				doc.entrants.forEach(entrant => {
					if (entrant.place === 1) {
						console.log(`${entrant.name} finished first!`);
					}
					console.log(
						entrant.status === "Finished" ||
							entrant.status === "Forfeit"
					);
				});
			}
		});
	}
}

function convertRaceStartTime(sec) {
	//converts seconds back into a Date
	let ms = sec * 1000;
	let date = new Date();
	date.setTime(ms);
	return date;
}

function simplifyDate(date) {
	let pretty = date;
	pretty = pretty.toString().split(" "); //["Sun", "Feb", "05", "2322", "12:08:10", "GMT-0800", "(Pacific", "Standard", "Time)"]
	pretty[1] = numberedMonth(pretty[1]);
	pretty[3] = pretty[3].substring(2); //assumes 21st century
	pretty[4] = twelveHour(pretty[4]);
	pretty.pop(); //removes time zone information
	pretty.pop();
	return `${pretty[0]} ${pretty[1]}/${pretty[2]}/${pretty[3]} ${pretty[4]}`;
}

//converts from 24 hour clock to 12 hour clock with am and pm
function twelveHour(time) {
	let amPm = "am";
	let pretty = time.split(":");
	pretty.pop(); //remove seconds from time
	pretty.forEach(x => {
		return parseInt(x);
	});
	if (pretty[0] > 12) {
		pretty[0] -= 12;
		amPm = "pm";
	}
	if (pretty[0] == 12) {
		amPm = "pm";
	}
	if (pretty[0] == 0) {
		pretty[0] = 12;
	}
	return `${pretty.join(":")} ${amPm}`;
}

//takes an abbreviated month string and returns the number of the month
function numberedMonth(month) {
	switch (month) {
		case "Jan":
			return 1;
		case "Feb":
			return 2;
		case "Mar":
			return 3;
		case "Apr":
			return 4;
		case "May":
			return 5;
		case "Jun":
			return 6;
		case "Jul":
			return 7;
		case "Aug":
			return 8;
		case "Sep":
			return 9;
		case "Oct":
			return 10;
		case "Nov":
			return 11;
		case "Dec":
			return 12;
	}
}

//takes entrant's time from the API and returns a string
function convertRunTime(apiTime) {
	if (apiTime === 0) {
		//with standard HH:MM:SS, "In Progress", or "Race not started"
		return "Race has not started";
	} else if (apiTime === -3) {
		return "Race in progress";
	} else if (apiTime === -1) {
		return "Forfeit";
	} else if (apiTime > 0) {
		let hours = Math.floor(apiTime / 3600);

		let minutes = Math.floor((apiTime % 3600) / 60);
		if (minutes < 10) {
			minutes = `0${minutes}`;
		}

		let seconds = Math.floor((apiTime % 3600) % 60);
		if (seconds < 10) {
			seconds = `0${seconds}`;
		}
		return `${hours}:${minutes}:${seconds}`;
	}
}

//searches for the race entrant and returns the current
function getBetUser(race, entrantName) {
	Race.findOne({ raceID: race.id }, (err, doc) => {
		//bet total on user if present
		if (err) {
			throw Error(err);
		} else if (doc) {
			let bet = 0;
			doc.entrants.forEach(entrant => {
				if (entrant.name === entrantName) {
					bet = entrant.betUser;
				}
			});
			return bet;
		} else {
			return 0;
		}
	});
}

function makeBet(username, raceID, entrant, amount) {
	User.findOne({ twitchUsername: username }, (err, user) => {
		if (user.points >= amount) {
			Race.findOne(
				{
					raceID: raceID,
					status: { $in: ["Entry Open", "Entry Closed"] },
				},
				(err, race) => {
					if (err) {
						throw Error(
							"There was a problem getting the race requested for the bet"
						);
					}
					if (!race) {
						return `Could not find any races that ${entrant} is entered in. They could be in a race that has already started, or they might not have their twitch username linked to SRL.`;
					} else {
						//finds the entrant that was bet on within the race document
						let previousEntrant = race.entrants.get(entrant);
						race.entrants.set(entrant, {
							...previousEntrant,
							betUser: previousEntrant.betUser + parseInt(amount),
						});
						race.betTotal += parseInt(amount);
						user.betHistory.push({
							raceId: race.raceID,
							entrant: entrant,
							amountBet: amount,
						});
						user.points -= amount;

						user.save(err => {
							if (err) {
								err.message =
									"User changes from bet could not be saved";
								throw Error(err);
							}
						});
						race.save(err => {
							if (err) {
								err.message =
									"Race changes from bet could not be saved";
								throw Error(err);
							}
						});
					}
				}
			);
		} else {
			return `@${username} can't bet ${amount}. You only have ${
				user.points
			} points!`;
		}
	});
}

module.exports.getRaceDataFromSRL = getRaceDataFromSRL;
module.exports.getRaceDataFromDB = getRaceDataFromDB;
module.exports.updateRaceData = updateRaceData;
module.exports.makeBet = makeBet;
