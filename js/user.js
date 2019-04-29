const User = require("../models/user");

// does all processing for user database entries

/*

how the data needs to be processed for each race

- find user in db
    - create user if not found
    - update twitch username in case twitch is linked to SRL after first user recording
- find out if user is in multiple races
    - get all races to record all at once
- look for race in race history
    - update status, goal, place, time, bestTime
    - create if can't be found
- leave bet history alone
- look for game in gameHistory
    - create if not present
    - check if game has already been recorded in game history
        - new race array in gameHistory or check from user raceHistory?
            - process gameHistory before raceHistory
        - incement numEntries if necessary
    - look for game category in gameHistory
        - create if not present
        - check if entrant has placed in race already
            - update avgTime, winRatio, bestTime, numWins, totalTime, raceRatio, racesWon

*/

//takes SRL API formatted race and adds or updates all the race entrants into the user db
function updateUserData(race) {
	let openUsers = [];
	if (race.statetext === "In Progress" || race.statetext === "Complete") {
		for (let entrant in race.entrants) {
			//prevents opening the user entry more than once if the user is in multiple races simultaneously
			if (!openUsers.includes(race.entrants[entrant].displayname)) {
				openUsers.push(race.entrants[entrant].displayname);
				User.findOne(
					{
						$or: [
							{ srlName: race.entrants[entrant].displayname },
							{
								twitchUsername: race.entrants[entrant].twitch,
							},
						],
					},
					(err, doc) => {
						if (err) {
							throw Error(err);
						}
						if (doc) {
							//updates user stats if they have finished the race
							if (
								race.entrants[entrant].place < 9000 ||
								race.entrants[entrant].place === 9998
							) {
								if (race.entrants[entrant].place === 1) {
									doc.racesWon++;
								}
								doc.raceRatio =
									doc.racesWon / doc.raceHistory.length;
							}
							//update user race and game history
							updateUserRaceHistory(
								doc.raceHistory,
								race,
								race.entrants[entrant]
							).then(newRaceHistory => {
								updateUserGameHistory(
									doc.gameHistory,
									race,
									race.entrants[entrant]
								).then(newGameHistory => {
									doc.raceHistory = newRaceHistory;
									doc.gameHistory = newGameHistory;
									doc.markModified("raceHistory");
									doc.markModified("gameHistory");
									doc.save(err => {
										if (err) {
											//throw Error(err);
											console.error(err);
										}
									});
								});
							});
						} else {
							let editedGoal = race.goal
								.replace(/\W/g, " ")
								.toLowerCase();
							if (
								editedGoal.includes("randomizer") ||
								editedGoal.includes("seed")
							) {
								editedGoal = "randomizer";
							}
							User.create(
								{
									srlName: race.entrants[entrant].displayname,
									twitchUsername:
										race.entrants[entrant].twitch,
									raceHistory: [
										{
											raceID: race.id,
											game: race.game.name,
											goal: race.goal,
											status: race.statetext,
											time: race.entrants[entrant].time,
											date: convertRaceStartTime(
												race.time
											),
											place: race.entrants[entrant].place,
										},
									],
									gameHistory: new Map([
										[
											race.game.name
												.replace(/\W/g, " ")
												.toLowerCase(),
											{
												gameID: race.game.id,
												gameTitle: race.game.name,
												categories: new Map([
													[
														editedGoal,
														{
															goal: race.goal,
															avgTime: 0,
															totalTime: 0,
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
		}
	}
}

//updates a user's race history or adds a new entry to the
//history if the race isn't already present
function updateUserRaceHistory(raceHistory, race, entrant) {
	return new Promise((resolve, reject) => {
		let updated = false;
		let promises = [];
		raceHistory.forEach((recordedRace, index) => {
			promises.push(
				new Promise(resolve => {
					//if the race is already in history, update it
					if (recordedRace.raceID === race.id) {
						raceHistory[index].status = entrant.statetext;
						raceHistory[index].place = entrant.place;
						raceHistory[index].time = entrant.time;
						raceHistory[index].isBestTime =
							entrant.time > recordedRace.isBestTime;
						updated = true;
					}
					resolve();
				})
			);
		});
		Promise.all(promises).then(() => {
			//if the race isn't in the current user's raceHistory, add a new race object to the raceHistory
			if (!updated) {
				raceHistory.unshift({
					raceID: race.id,
					game: race.game.name,
					goal: race.goal,
					status: entrant.statetext,
					place: entrant.place,
					date: convertRaceStartTime(race.time),
					time: entrant.time,
					isBestTime: false,
				});
			}
			//resolve raceHistory with changes
			resolve(raceHistory);
		});
	});
}

//updates a user's race history or adds a new entry to the
//history if the race isn't already present
function updateUserGameHistory(gameHistory, race, entrant) {
	return new Promise((resolve, reject) => {
		let editedGoal = race.goal.replace(/\W/g, " ").toLowerCase();
		//trys to find out if race is a randomizer
		//if it is, group all randomizer races into one game category
		if (editedGoal.includes("randomizer") || editedGoal.includes("seed")) {
			editedGoal = "randomizer";
		}
		//checks if game is already in history
		if (gameHistory.has(race.game.name.replace(/\W/g, " ").toLowerCase())) {
			let gameObj = gameHistory.get(
				race.game.name.replace(/\W/g, " ").toLowerCase()
			);

			//check if category already exists
			if (gameObj.categories.has(editedGoal)) {
				let oldGameCat = gameObj.categories.get(editedGoal);
				//update the category with new info
				gameObj.categories.set(
					editedGoal,
					updateUserGameCategory(oldGameCat, entrant)
				);
			} else {
				gameObj.categories.set(editedGoal, {
					goal: race.goal,
					avgTime: 0,
					totalTime: 0,
					bestTime: false,
					winRatio: 0,
					numWins: 0,
					numEntries: 1,
				});
			}
			resolve(new Map([...gameHistory]));
		} else {
			gameHistory.set(race.game.name.replace(/\W/g, " ").toLowerCase(), {
				gameID: race.game.id,
				gameTitle: race.game.name,
				categories: new Map([
					[
						editedGoal,
						{
							goal: race.goal,
							avgTime: 0,
							totalTime: 0,
							bestTime: false,
							winRatio: 0,
							numWins: 0,
							numEntries: 1,
						},
					],
				]),
			});
			resolve(new Map([...gameHistory]));
		}
	});
}

function updateUserGameCategory(oldGameCat, srlEntrant) {
	let newGameCat = oldGameCat;
	newGameCat.numEntries++;
	if (srlEntrant.time > 0) {
		newGameCat.totalTime += srlEntrant.time;
		newGameCat.avgTime = newGameCat.totalTime / newGameCat.numEntries;
		if (srlEntrant.time < oldGameCat.bestTime) {
			newGameCat.bestTime = srlEntrant.time;
		}
		if (srlEntrant.place === 1) {
			newGameCat.numWins++;
			newGameCat.winRatio = newGameCat.numWins / newGameCat.numEntries;
		}
	}
	return newGameCat;
}

//converts seconds back into a Date
function convertRaceStartTime(sec) {
	let ms = sec * 1000;
	let date = new Date();
	date.setTime(ms);
	return date;
}

module.exports.updateUserData = updateUserData;
