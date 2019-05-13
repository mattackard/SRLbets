const Race = require("../models/race");
const resolveBets = require("./bet").resolveBets;
const refundBetsForEntrant = require("./bet").refundBetsForEntrant;
const refundBets = require("./bet").refundBets;

// does all processing for race database entries

function updateRaceData(race) {
	//looks for all races retrieved from API in the database
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
						//markModified tells mongo that the contents were modified in an indexed variable
						doc.markModified("entrants");
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
				payRatio: getPayRatio(race.entrants[i]),
			});
		}
		if (Object.keys(race.entrants).length === entrantObj.size) {
			handleEntrantChange(race, entrantObj);
			resolve(entrantObj);
		} else {
			reject("entrant obj did not fully populate");
		}
	});
}

//checks if entrant is already in the db and uses previous bet amount if so, otherwise set at 0
function restoreUserBets(entrantObj, doc) {
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
					resolve([
						entrant,
						{
							...entrantObj.get(entrant),
						},
					]);
				}
			})
		);
	}
	return Promise.all(promises).then(newEntrantObj => {
		return new Map([...newEntrantObj]);
	});
}

//sorts the entrants by finish position first, and betTotal the finish
//positions are equal
function sortEntrants(entrantMap) {
	return new Promise((resolve, reject) => {
		//maps can't be sorted directly so you need to convert
		//the map into an array of arrays for sorting
		let sortedMap = [...entrantMap];
		sortedMap.sort(([k, v], [k2, v2]) => {
			if (v.place === v2.place) {
				return v2.betTotal - v.betTotal;
			}
			return v.place - v2.place;
		});
		resolve(new Map(sortedMap));
	});
}

function handleEntrantChange(race, newEntrantObj) {
	let oldEntrants;
	Race.findOne({ raceID: race.id }, (err, doc) => {
		if (err) {
			throw Error(err);
		}
		if (doc) {
			oldEntrants = doc.entrants;
			oldEntrants.forEach(entrant => {
				if (!newEntrantObj.has(entrant.name)) {
					console.log(`${entrant.name} has left race ${race.goal}`);
					refundBetsForEntrant(entrant, race.id);
				}
			});
		}
	});
}

function getPayRatio(raceEntrant) {
	//get entrants raceHistory and check how many races of the same
	//game the entrant has won or placed near top
	return 2;
}

//checks if entrant is already in the db and uses previous bet amount if so, otherwise set at 0
function restoreUserBets(entrantObj, doc) {
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
					resolve([
						entrant,
						{
							...entrantObj.get(entrant),
						},
					]);
				}
			})
		);
	}
	return Promise.all(promises).then(newEntrantObj => {
		return new Map([...newEntrantObj]);
	});
}

//runs any time a race's status has changed from the last api call
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

//removes races that were cancelled after being saved to the database
//also triggers function to return bets made on cancelled races
function handleCancelledRaces(srlRaces) {
	let raceIDsToRemove = [];
	let srlIDs = [];
	Race.find(
		{ status: { $in: ["Entry Open", "Entry Closed"] } },
		(err, dbRaces) => {
			if (err) {
				throw Error(err);
			} else {
				//remove races that have already begun, those cannot be cancelled
				let filteredRaces = srlRaces.filter(
					srlRace =>
						srlRace.statetext === "Entry Open" ||
						srlRace.statetext === "Entry Closed"
				);
				//dont bother iterating if no races need to be removed
				if (dbRaces.length !== filteredRaces.length) {
					//look for races in database that aren't in srlAPI response
					srlRaces.forEach(srlRace => {
						srlIDs.push(srlRace.id);
					});
					dbRaces.forEach(dbRace => {
						if (!srlIDs.includes(dbRace.raceID)) {
							raceIDsToRemove.push(dbRace.raceID);
						}
					});
					console.log(raceIDsToRemove);
					refundBets(raceIDsToRemove).then(() => {
						Race.deleteMany(
							{ raceID: { $in: raceIDsToRemove } },
							err => {
								if (err) {
									throw Error(err);
								}
							}
						);
					});
				}
			}
		}
	);
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

module.exports.updateRaceData = updateRaceData;
module.exports.handleCancelledRaces = handleCancelledRaces;
module.exports.sortEntrants = sortEntrants;
module.exports.createEntrantObj = createEntrantObj;
