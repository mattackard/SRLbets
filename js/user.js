const User = require("../models/user");

// does all processing for user database entries

//takes SRL API formatted race and adds or updates all the race entrants into the user db
function updateUserData(userObj) {
	Object.keys(userObj).forEach(user => {
		//creating this var stops mongo from getting whatever user with an empty twitch username it finds first
		let userTwitch =
			userObj[user].twitch === "" ? null : userObj[user].twitch;
		User.findOne(
			{
				$or: [{ srlName: user }, { twitchUsername: userTwitch }],
			},
			(err, doc) => {
				if (err) {
					throw Error(err);
				}
				//initialize variable in case new user entry needs to be created
				let newUser = {};
				let promises = [];
				userObj[user].races.forEach(race => {
					promises.push(
						new Promise(resolve => {
							if (
								race.statetext !== "Entry Open" &&
								race.statetext !== "Entry Closed"
							) {
								//finds the user's entrant object in each race
								let entrant = race.entrants[user];
								//updates user information if user entry exists and race has not already been archived
								if (
									doc &&
									!doc.archivedRaces.includes(race.id)
								) {
									//updates twitch & srl usernames in case accounts are linked after user is created
									doc.twitchUsername = entrant.twitch;
									doc.srlName = entrant.displayname;
									//updates user stats if they have finished the race
									if (
										entrant.place < 9000 ||
										entrant.place === 9998
									) {
										if (entrant.place === 1) {
											doc.racesWon++;
										}
										doc.raceRatio =
											doc.racesWon /
											doc.raceHistory.length;
										//if entrant has finished the race, archive the race
										doc.archivedRaces.push(race.id);
										doc.markModified("archivedRaces");
									}
									//update user race and game history
									updateUserRaceHistory(
										doc.raceHistory,
										race,
										entrant
									).then(newRaceHistory => {
										updateUserGameHistory(
											doc.gameHistory,
											race,
											entrant
										).then(newGameHistory => {
											doc.raceHistory = newRaceHistory;
											doc.gameHistory = newGameHistory;
											doc.markModified("raceHistory");
											doc.markModified("gameHistory");
											resolve();
										});
									});
								} else {
									//build the new user object
									let editedGoal = race.goal
										.replace(/\W/g, " ")
										.toLowerCase();
									if (
										editedGoal.includes("randomizer") ||
										editedGoal.includes("seed") ||
										editedGoal.includes("hacks")
									) {
										editedGoal = "randomizer";
									}
									//checks if new user has already been populated from another race
									//if it has, it adds to the race and game history of the new user
									if (newUser.srlName) {
										newUser.raceHistory.push({
											raceID: race.id,
											game: race.game.name,
											goal: race.goal,
											status: race.statetext,
											time: entrant.time,
											date: convertRaceStartTime(
												race.time
											),
											place: entrant.place,
										});
										newUser.gameHistory.set(
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
															numEntries: 0,
															numForfeits: 0,
														},
													],
												]),
											}
										);
									} else {
										newUser = {
											srlName: entrant.displayname,
											twitchUsername: entrant.twitch,
											raceHistory: [
												{
													raceID: race.id,
													game: race.game.name,
													goal: race.goal,
													status: race.statetext,
													time: entrant.time,
													date: convertRaceStartTime(
														race.time
													),
													place: entrant.place,
												},
											],
											gameHistory: new Map([
												[
													race.game.name
														.replace(/\W/g, " ")
														.toLowerCase(),
													{
														gameID: race.game.id,
														gameTitle:
															race.game.name,
														categories: new Map([
															[
																editedGoal,
																{
																	goal:
																		race.goal,
																	avgTime: 0,
																	totalTime: 0,
																	bestTime: 0,
																	winRatio: 0,
																	numWins: 0,
																	numEntries: 0,
																	numForfeits: 0,
																},
															],
														]),
													},
												],
											]),
										};
									}
									resolve();
								}
							}
						})
					);
				});
				Promise.all(promises).then(() => {
					if (doc) {
						doc.save(err => {
							if (err) {
								throw Error(err);
							}
						});
					} else {
						User.create(newUser);
					}
				});
			}
		);
	});
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
		if (
			editedGoal.includes("randomizer") ||
			editedGoal.includes("seed") ||
			editedGoal.includes("hacks")
		) {
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
					bestTime: 0,
					winRatio: 0,
					numWins: 0,
					numEntries: 0,
					numForfeits: 0,
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
							bestTime: 0,
							winRatio: 0,
							numWins: 0,
							numEntries: 0,
							numForfeits: 0,
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
	if (srlEntrant.time > 0) {
		newGameCat.numEntries++;
		newGameCat.totalTime += srlEntrant.time;
		newGameCat.avgTime =
			newGameCat.totalTime /
			(newGameCat.numEntries - newGameCat.numForfeits);
		if (
			srlEntrant.time < oldGameCat.bestTime ||
			oldGameCat.bestTime === 0
		) {
			newGameCat.bestTime = srlEntrant.time;
		}
		if (srlEntrant.place === 1) {
			newGameCat.numWins++;
			newGameCat.winRatio = newGameCat.numWins / newGameCat.numEntries;
		}
	}
	if (srlEntrant.place === 9998) {
		newGameCat.numEntries++;
		newGameCat.numForfeits++;
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
