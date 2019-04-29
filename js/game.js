const Game = require("../models/game");
const User = require("../models/user");

// does all processing for game database entries

/*

how the data needs to be processed for each race

- check if any entrants have finished 1st yet
    - if not nothing needs to be done for game db
- look for game in db
    - create if not found
- check if raceID is already in raceHistory
    - if so you're done!
    - else add raceID to raceHistory
- check for race goal in categories
    - if not found create new category
    - else update mostWins, mostEntries, and bestTime

*/

function updateGameData(races) {
	races.forEach(async race => {
		//looks for each game being raced in the databse
		Game.findOne({ gameID: race.game.id }, async (err, doc) => {
			if (err) {
				throw Error(err);
			}
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
			if (doc) {
				//goal string cannot contain . characters and be used as a map key, so all specail characters are filtered here
				let editedGoal = race.goal.replace(/\W/g, " ").toLowerCase();
				//check if race is recorded in game history
				if (!doc.raceHistory.includes(race.id)) {
					doc.raceHistory.push(race.id);
				}
				//checks if the race is a randomizer and sets category if so
				if (
					editedGoal.includes("randomizer") ||
					editedGoal.includes("seed")
				) {
					editedGoal = "randomizer";
				}
				//checks if category already exists and updates it
				if (doc.categories.has(editedGoal)) {
					let previous = doc.categories.get(editedGoal);
					newCat.goal = previous.goal;
					//update wins and stuff
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
					newCat.goal = race.goal;
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
				let editedGoal = race.goal.replace(/\W/g, " ").toLowerCase();
				if (
					editedGoal.includes("randomizer") ||
					editedGoal.includes("seed")
				) {
					editedGoal = "randomizer";
				}
				newCat.goal = race.goal;
				let gameDoc = new Game({
					gameID: race.game.id,
					gameTitle: race.game.name,
					raceHistory: [race.id],
					categories: new Map([[editedGoal, newCat]]),
				});
				Game.create(gameDoc);
			}
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
									`couldnt find ${editedGoal} in user's game history`
								);
							}
							if (userCategory) {
								if (
									userCategory.numEntries >
									gameCat.mostEntries.numEntries
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
									gameCat.mostWins.numWins
								) {
									gameCat.mostWins = {
										srlName:
											srlRace.entrants[entrant]
												.displayname,
										twitchUsername:
											srlRace.entrants[entrant].twitch ||
											"",
										numWins: userCategory.numwins,
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
				if (
					srlRace.entrants[entrant].time < gameCat.bestTime.time &&
					srlRace.entrants[entrant].time > 0
				) {
					gameCat.besTime = {
						srlName: srlRace.entrants[entrant].displayname,
						twitchUsername: srlRace.entrants[entrant].twitch || "",
						time: srlRace.entrants[entrant].time,
					};
				}
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