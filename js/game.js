const Game = require("../models/game");
const User = require("../models/user");

// does all processing for game database entries

function updateGameData(gameObj) {
	Object.keys(gameObj).forEach(game => {
		//looks for each game being raced in the databse
		Game.findOne({ gameTitle: game }, async (err, doc) => {
			if (err) {
				throw Error(err);
			}
			let newGame = {
				gameID: gameObj[game].races[0].game.id,
				gameTitle: gameObj[game].races[0].game.name,
				raceHistory: [],
				categories: new Map(),
			};
			let promises = [];
			gameObj[game].races.forEach(race => {
				promises.push(
					new Promise(async resolve => {
						if (
							race.statetext !== "Entry Open" &&
							race.statetext !== "Entry Closed"
						) {
							let newCat = {
								goal: "",
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
							//if the game is already in the database, iterate through each race of the game and
							//update the categories from each race
							if (doc) {
								//goal string cannot contain . characters and be used as a map key, so all specail characters are filtered here
								let editedGoal = race.goal
									.replace(/\W/g, " ")
									.toLowerCase();
								//check if race is recorded in game history
								if (!doc.raceHistory.includes(race.id)) {
									doc.raceHistory.push(race.id);
								}
								//checks if the race is a randomizer and sets category if so
								if (
									editedGoal.includes("randomizer") ||
									editedGoal.includes("seed") ||
									editedGoal.includes("hacks")
								) {
									editedGoal = "randomizer";
								}
								//checks if category already exists and updates it
								if (doc.categories.has(editedGoal)) {
									let previous = doc.categories.get(
										editedGoal
									);
									newCat.goal = previous.goal;
									let updated = await updateGameCategory(
										race,
										editedGoal,
										previous
									);
									newCat.mostEntries = updated.mostEntries;
									newCat.mostWins = updated.mostWins;
									newCat.bestTime = updated.bestTime;
								} else {
									//create a new category object with current race's category
									newCat.goal =
										race.goal === "randomizer"
											? "randomizer"
											: race.goal;
								}
								doc.categories.set(editedGoal, newCat);
								doc.markModified("categories");
								resolve();
							}
							//if the game can't be found in the database, create a new game document
							//and initiailize a category for each race of the game
							else {
								//create a new game if it can't already be found in the database
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
								newCat.goal =
									race.goal === "randomizer"
										? "randomizer"
										: race.goal;
								newGame.raceHistory.push(race.id);
								newGame.categories.set(editedGoal, newCat);
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
					Game.create(newGame);
				}
			});
		});
	});
}

function updateGameCategory(srlRace, editedGoal, gameCat) {
	let promises = [];
	for (let entrant in srlRace.entrants) {
		promises.push(
			new Promise((resolve, reject) => {
				User.findOne(
					{ srlName: srlRace.entrants[entrant].displayname },
					(err, user) => {
						if (err) {
							reject(err);
							throw Error(err);
						}

						if (user) {
							let userGame = user.gameHistory.get(
								srlRace.game.name
									.replace(/\W/g, " ")
									.toLowerCase()
							);
							let userCategory;
							if (userGame) {
								userCategory = userGame.categories.get(
									editedGoal
								);
							} else {
								console.log(
									`couldnt find ${srlRace.game.name} in ${
										srlRace.entrants[entrant].displayname
									}'s game history`
								);
							}
							if (userCategory) {
								if (
									(srlRace.entrants[entrant].time <
										gameCat.bestTime.time ||
										!gameCat.bestTime.time) &&
									srlRace.entrants[entrant].time > 0
								) {
									gameCat.bestTime = {
										srlName:
											srlRace.entrants[entrant]
												.displayname,
										twitchUsername:
											srlRace.entrants[entrant].twitch ||
											"",
										time: srlRace.entrants[entrant].time,
									};
								}
								if (
									userCategory.numEntries >
										gameCat.mostEntries.numEntries ||
									!gameCat.mostEntries.numEntries
								) {
									gameCat.mostEntries = {
										srlName:
											srlRace.entrants[entrant]
												.displayname,
										twitchUsername:
											srlRace.entrants[entrant].twitch ||
											"",
										numEntries: userCategory.numEntries,
									};
								}
								if (
									userCategory.numWins >
										gameCat.mostWins.numWins ||
									!gameCat.mostWins.numWins
								) {
									gameCat.mostWins = {
										srlName:
											srlRace.entrants[entrant]
												.displayname,
										twitchUsername:
											srlRace.entrants[entrant].twitch ||
											"",
										numWins: userCategory.numWins,
									};
								}
							} else {
								console.error(
									`Game category ${editedGoal} could not be found in ${
										srlRace.entrants[entrant].displayname
									}'s database entry `
								);
							}
						}
						resolve();
					}
				);
			})
		);
	}
	return Promise.all(promises).then(() => {
		return new Promise(resolve => {
			resolve(gameCat);
		});
	});
}

module.exports.updateGameData = updateGameData;
