const axios = require("axios");
const Race = require("../models/race");
const User = require("../models/user");
const resolveBets = require("./db").resolveBets;

function getRaceDataFromSRL() {
	//gets the current race json data from the SRL API
	//and saves/updates it in the local database
	axios
		.get("http://api.speedrunslive.com/races", { withCredentails: true })
		.then(response => {
			updateRaceData(response.data.races);
			recordRaceEntrants(response.data.races);
		})
		.catch(err => {
			throw Error(err);
		});
}

function createEntrantObj(race) {
	let entrantObj = new Map();
	return new Promise((resolve, reject) => {
		for (let i in race.entrants) {
			//adds each entrant from the API response to the map
			entrantObj.set(race.entrants[i].displayname, {
				name: race.entrants[i].displayname,
				status: race.entrants[i].statetext,
				place: race.entrants[i].place,
				time: convertRunTime(race.entrants[i].time),
				twitch: race.entrants[i].twitch,
				betTotal: 0,
			});
		}
		if (Object.keys(race.entrants).length === entrantObj.size) {
			if (entrantObj.has("JOPEBUSTER") || entrantObj.has("fc")) {
				console.log(
					"jopebuster or fc are in the entrant object -- race status is " +
						race.statetext
				);
			}
			resolve(entrantObj);
		} else {
			reject("entrant obj did not fully populate");
		}
	});
}

function restoreUserBets(entrantObj, doc) {
	//checks if entrant is already in the db and uses previous bet amount if so, otherwise set at 0
	let promises = [];
	for (let entrant of entrantObj.keys()) {
		promises.push(
			new Promise(resolve => {
				const oldEntrant = doc.entrants.get(entrant);
				if (oldEntrant) {
					resolve([
						entrant,
						{
							...entrantObj.get(entrant),
							betTotal: oldEntrant.betTotal,
							bets: oldEntrant.bets,
						},
					]);
				} else {
					reject("oldEntrant could not be found");
				}
			})
		);
	}
	return Promise.all(promises).then(newEntrantObj => {
		return new Map([...newEntrantObj]);
	});
}

function sortEntrants(entrantMap) {
	return new Promise((resolve, reject) => {
		let sortedMap = [...entrantMap];
		sortedMap.sort(([k, v], [k2, v2]) => {
			if (v.place === v2.place) {
				return v2.betTotal - v.betTotal;
			}
			return v.place - v2.place;
		});
		console.log(new Map(sortedMap));
		resolve(new Map(sortedMap));
	});
}

function updateRaceData(races) {
	races.forEach(async race => {
		//get the race from the database if it already exists
		Race.findOne({ raceID: race.id }, async (err, doc) => {
			if (err) {
				throw Error(err);
			}
			if (doc) {
				//checks if race status has changed
				const oldStatus = doc.status;
				doc.raceID = race.id;
				doc.gameID = race.game.id;
				doc.gameTitle = race.game.name;
				doc.goal = race.goal;
				doc.status = race.statetext;
				doc.timeStarted = convertRaceStartTime(race.time);
				doc.simpleTime = simplifyDate(convertRaceStartTime(race.time));

				//build the object of entrants
				createEntrantObj(race)
					.then(entrantObj => restoreUserBets(entrantObj, doc))
					.then(objWithBets => sortEntrants(objWithBets))
					.then(sortedEntrants => {
						if (sortedEntrants.size === race.numentrants) {
							doc.entrants = sortedEntrants;
							doc.save((err, saved) => {
								if (err) {
									err.message =
										"Error when updating existing race";
									throw Error(err);
								}
								if (saved.status !== oldStatus) {
									handleRaceStatusChange(
										race,
										saved.status,
										oldStatus
									);
								} else if (
									saved.status === "In Progress" &&
									!saved.allBetsPaid
								) {
									resolveBets(saved);
								}
							});
						} else {
							throw Error(
								"the new entrant object does not match the api response"
							);
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
					entrants: await createEntrantObj(race),
				});
				Race.create(raceDoc);
			}
		});
	});
	console.log("races retrieved from SRL");
}

//takes SRL API formatted race and adds or updates all the race entrants into the user db
function recordRaceEntrants(races) {
	console.log("recording race entrants");
	races.forEach(race => {
		for (let entrant in race.entrants) {
			User.findOne(
				{
					$or: [
						{ srlName: race.entrants[entrant].displayname },
						{ twitchUsername: race.entrants[entrant].twitch },
					],
				},
				async (err, doc) => {
					if (err) {
						throw Error(err);
					}
					if (doc) {
						doc.game = race.game.name;
						doc.goal = race.goal;
						doc.status = race.statetext;
						if (
							doc.status !== "Entry Open" &&
							doc.status !== "Entry Closed"
						) {
							doc.raceHistory = await updateUserRaceHistory(
								doc.raceHistory,
								race,
								entrant
							);
						}

						//if the race entrant has a finish position, record place and time
						if (race.place < 1000) {
							doc.place = race.entrants[entrant].place;
							doc.time = convertRunTime(
								race.entrants[entrant].time
							);
						}
						doc.save(err => {
							if (err) {
								err.message =
									"Eror when updating user from race entrants";
								throw Error(err);
							}
						});
					} else {
						User.create(
							{
								srlName: race.entrants[entrant].displayname,
								twitchUsername: race.entrants[entrant].twitch,
								raceHistory: [
									{
										raceID: race.id,
										game: race.game.name,
										goal: race.goal,
										status: race.statetext,
									},
								],
							},
							(err, saved) => {
								if (err) {
									err.message =
										"Error in creating new user from race entrant";
									throw Error(err);
								}
							}
						);
					}
				}
			);
		}
	});
}

function updateUserRaceHistory(raceHistory, race, entrant) {
	return new Promise((resolve, reject) => {
		let count = 0;
		raceHistory.forEach(recordedRace => {
			//if the race is already in history, update it
			if (recordedRace.raceID === race.id) {
				recordedRace.status = race.statetext;
				recordedRace.place = entrant.place;
				recordedRace.time = entrant.time;
			}
			//otherwise, add the race to history
			else {
				raceHistory.push({
					raceID: race.id,
					game: race.game.name,
					goal: race.goal,
					status: race.statetext,
					place: entrant.place,
					time: entrant.time,
				});
			}
			count++;
		});
		//makes sure all races in history have been iterated before resolving
		if (count === raceHistory.length) {
			resolve(raceHistory);
		}
	});
}

function handleRaceStatusChange(currentRace, newStatus, oldStatus) {
	console.log(
		`Race ${currentRace.id} is changing from ${oldStatus} to ${newStatus}`
	);
	if (newStatus === "Complete" || newStatus === "Race Over") {
		Race.findOne({ raceID: currentRace.id }, (err, doc) => {
			if (err) {
				err.message = "Error in finding race on status change";
				throw Error(err);
			} else if (!doc) {
				throw Error(
					"Could not find the race in the database with the provided race id"
				);
			} else if (!doc.allBetsPaid) {
				resolveBets(doc);
			}
		});
	}
}

//converts seconds back into a Date
function convertRaceStartTime(sec) {
	let ms = sec * 1000;
	let date = new Date();
	date.setTime(ms);
	return date;
}

//converts date to a string without timezone information
function simplifyDate(date) {
	let pretty = date;
	pretty = pretty.toString().split(" ");
	//["Sun", "Feb", "05", "2322", "12:08:10", "GMT-0800", "(Pacific", "Standard", "Time)"]

	pretty[1] = numberedMonth(pretty[1]);

	//assumes 21st century
	pretty[3] = pretty[3].substring(2);
	pretty[4] = twelveHour(pretty[4]);

	//removes time zone information
	pretty.pop();
	pretty.pop();
	return `${pretty[0]} ${pretty[1]}/${pretty[2]}/${pretty[3]} ${pretty[4]}`;
}

//converts from 24 hour clock to 12 hour clock with am and pm
function twelveHour(time) {
	let amPm = "am";
	let pretty = time.split(":");

	//remove seconds from time
	pretty.pop();

	//checks for am vs pm and sets hour 24 to 12
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

module.exports.getRaceDataFromSRL = getRaceDataFromSRL;
module.exports.updateRaceData = updateRaceData;
module.exports.handleRaceStatusChange = handleRaceStatusChange;
module.exports.updateUserRaceHistory = updateUserRaceHistory;
module.exports.recordRaceEntrants = recordRaceEntrants;
module.exports.restoreUserBets = restoreUserBets;
module.exports.createEntrantObj = createEntrantObj;
module.exports.sortEntrants = sortEntrants;
