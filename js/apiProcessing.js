const axios = require("axios");
const Race = require("../models/race");
const User = require("../models/user");
const Game = require("../models/game");
const resolveBets = require("./db").resolveBets;
const handleCancelledRaces = require("./db").handleCancelledRaces;
const refundBetsForEntrant = require("./db").refundBetsForEntrant;

function getRaceDataFromSRL() {
	//gets the current race json data from the SRL API
	//and saves/updates it in the local database
	axios
		.get("http://api.speedrunslive.com/races", { withCredentails: true })
		.then(response => {
			updateRaceData(response.data.races);
			recordRaceEntrants(response.data.races);
			handleCancelledRaces(response.data.races);
		})
		.catch(err => {
			throw Error(err);
		});
}

function getPayRatio(raceEntrant) {
	//get entrants raceHistory and check how many races of the same
	//game the entrant has won or placed near top
	return 2;
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
					console.log("found entrant that has left race");
					refundBetsForEntrant(entrant, race.id);
				}
			});
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

function updateRaceData(races) {
	races.forEach(async race => {
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
		Game.findOne({ gameID: race.game.id }, async (err, doc) => {
			if (err) {
				throw Error(err);
			}
			if (doc) {
				let editedGoal = race.goal.replace(/[.]/g, "_");
				//check if race is recorded in game history
				if (!doc.raceHistory.includes(race.id)) {
					doc.raceHistory.push(race.id);
				}
				//checks if category already exists and updates it
				let newCat = {
					goal: "",
					avgTime: 0,
					mostWins: {
						srlName: "",
						twitchUsername: "",
						numWins: 0,
					},
					mostEntries: {
						srlName: "",
						twitchUsername: "",
						numEntries: 0,
					},
					bestTime: {
						srlName: "",
						twitchUsername: "",
						time: 0,
					},
				};
				if (doc.categories.has(editedGoal)) {
					let previous = doc.categories.get(editedGoal);
					newCat.goal = previous.goal;
					newCat.avgTime = previous.avgTime;
				} else {
					//create a new category object
					newCat.goal = editedGoal;
				}
				doc.categories.set(editedGoal, newCat);
				doc.markModified("categories");
				doc.save(err => {
					if (err) {
						throw Error(err);
					}
				});
			} else {
				//create a new game if it can't already be found in the database
				let editedGoal = race.goal.replace(/[.]/g, "_");
				let gameDoc = new Game({
					gameID: race.game.id,
					gameTitle: race.game.name,
					raceHistory: [race.id],
					categories: new Map([
						[
							editedGoal,
							{
								goal: race.goal,
								avgTime: 0,
								mostWins: {
									srlName: "",
									twitchUsername: "",
									numWins: 0,
								},
								mostEntries: {
									srlName: "",
									twitchUsername: "",
									numEntries: 0,
								},
								bestTime: {
									srlName: "",
									twitchUsername: "",
									time: 0,
								},
							},
						],
					]),
				});
				Game.create(gameDoc);
			}
		});
	});
}

//takes SRL API formatted race and adds or updates all the race entrants into the user db
function recordRaceEntrants(races) {
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
						//update user race and game history
						if (
							doc.status !== "Entry Open" &&
							doc.status !== "Entry Closed"
						) {
							updateUserRaceHistory(
								doc.raceHistory,
								race,
								race.entrants[entrant]
							).then(newHistory => {
								doc.raceHistory = newHistory;
								doc.markModified("raceHistory");
							});
							updateUserGameHistory(
								doc.gameHistory,
								race,
								race.entrants[entrant]
							).then(newHistory => {
								doc.gameHistory = newHistory;
								doc.markModified("gameHistory");
							});
							doc.save(err => {
								if (err) {
									throw Error(err);
								}
							});
						}
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
								gameHistory: new Map([
									[
										race.game.name.replace(/[.]/g, "_"),
										{
											gameID: race.game.id,
											gameTitle: race.game.name,
											categories: new Map([
												[
													race.goal.replace(
														/[.]/g,
														"_"
													),
													{
														goal: race.goal,
														avgTime: 0,
														bestTime: 0,
														winRatio: 0,
														numWins: 0,
														numEntries: 1,
													},
												],
											]),
										},
									],
								]),
							},
							err => {
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

//updates a user's race history or adds a new entry to the
//history if the race isn't already present
function updateUserRaceHistory(raceHistory, race, entrant) {
	return new Promise((resolve, reject) => {
		let updated = false;
		raceHistory.forEach(recordedRace => {
			//if the race is already in history, update it
			if (recordedRace.raceID === race.id) {
				recordedRace.status = entrant.statetext;
				recordedRace.place = entrant.place;
				recordedRace.time = entrant.time;
				recordedRace.bestTime =
					recordedRace.bestTime > race.time
						? race.time
						: recordedRace.bestTime;
				updated = true;
			}
		});
		//if the race isn't in the current user's raceHistory, add a new race object to the raceHistory
		if (!updated) {
			raceHistory.push({
				raceID: race.id,
				game: race.game.name,
				goal: race.goal,
				status: entrant.statetext,
				place: entrant.place,
				time: entrant.time,
				bestTime: entrant.time,
			});
		}
		//resolve raceHistory with changes
		resolve(raceHistory);
	});
}

//updates a user's race history or adds a new entry to the
//history if the race isn't already present
function updateUserGameHistory(gameHistory, race, entrant) {
	return new Promise((resolve, reject) => {
		//checks if game is already in history
		if (gameHistory.has(race.game)) {
			let gameObj = gameHistory.get(race.game.name);
			let goalEdited = race.goal.replace(/[.]/g, "_");
			//check if category already exists
			if (gameObj.categories.has(goalEdited)) {
				//update the category if new info is present
			} else {
				gameObj.categories.set(goalEdited, {
					goal: race.goal,
					avgTime: 0,
					bestTime: 0,
					winRatio: 0,
					numWins: 0,
					numEntries: 1,
				});
			}
		} else {
			let goalEdited = race.goal.replace(/[.]/g, "_");
			gameHistory.set(race.game.name.replace(/[.]/g, "_"), {
				gameID: race.game.id,
				gameTitle: race.game.name,
				categories: new Map([
					[
						goalEdited,
						{
							goal: race.goal,
							avgTime: 0,
							bestTime: 0,
							winRatio: 0,
							numWins: 0,
							numEntries: 1,
						},
					],
				]),
			});
		}
		//resolve raceHistory with changes
		resolve(gameHistory);
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
