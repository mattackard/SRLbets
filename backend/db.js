const Race = require("./models/race");
const User = require("./models/user");

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

//records user bets in race document and user document
function makeBet(username, raceID, entrant, amount) {
	//parses amount as string to amount as number
	amount = parseInt(amount);
	User.findOne({ twitchUsername: username }, (err, user) => {
		//checks that user has enough points for the bet they made
		if (user.points >= amount) {
			//finds the requested race making sure betting is still open
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
					if (race) {
						//finds the entrant that was bet on within the race document
						let previousEntrant = race.entrants.get(entrant);
						race.entrants.set(entrant, {
							name: previousEntrant.name,
							status: previousEntrant.status,
							place: previousEntrant.place,
							time: previousEntrant.time,
							twitch: previousEntrant.twitch,
							betTotal: previousEntrant.betTotal + amount,
							bets: new Map(
								buildRaceBetHistory(
									previousEntrant,
									username,
									amount
								)
							),
						});

						race.betTotal += amount;
						user.betHistory = buildUserBetHistory(
							user.betHistory,
							race,
							entrant,
							amount
						);
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
							//gets the data immediately for client side once bet is saved
							getRaceDataFromDB();
						});
					} else {
						return `Could not find any races that ${entrant} is entered in. They could be in a race that has already started.`;
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

//build race history as array of key value pairs to convert into Map
function buildRaceBetHistory(previousEntrant, username, amount) {
	let betHistory = [];
	Object.keys(previousEntrant.bets).forEach(key => {
		//if the key is already present, increase amount to reflect total combined bet amount
		if (key === username) {
			amount += previousEntrant.bets[key].betAmount;
		}
		//otherwise create new betHistory entry
		else {
			betHistory.push([key, previousEntrant.bets[key]]);
		}
	});
	//adds the new bet to betHistory
	betHistory.push([
		username,
		{
			twitchUsername: username,
			betAmount: amount,
			isPaid: false,
		},
	]);
	return betHistory;
}

//build user's bet history checking for bet amount increases
function buildUserBetHistory(betHistory, race, entrant, amount) {
	let increaseBet = false;
	//checks if user already made a bet on this race entrant
	betHistory.forEach(bet => {
		if (bet.raceId === race.raceID && bet.entrant === entrant) {
			increaseBet = true;
			bet.amountBet += amount;
		}
	});
	//if the bet doesn't already exists, add a new bet object to history array
	if (!increaseBet) {
		betHistory.push({
			raceId: race.raceID,
			entrant: entrant,
			amountBet: amount,
		});
	}
	return betHistory;
}

//finds any first place finishes and pays out the bets made on that entrant
function checkForFirstPlace(race) {
	race.entrants.forEach(async entrant => {
		let newRaceBets = [];
		if (entrant.place === 1) {
			//checks if any bets were made for this entrant
			if (Object.keys(entrant.bets).length > 0) {
				console.log(`${entrant.name} finished first!`);
				newRaceBets.push(await betPayout(entrant, race));
			} else {
				console.log(
					`${entrant.name} finished first, but no bets were made`
				);
			}
		} else {
			if (
				Object.keys(entrant.bets).length > 0 &&
				entrant.status !== "In Progress"
			) {
				newRaceBets.push(await closeBet(entrant, race));
			}
		}
		if (
			newRaceBets.length === Object.keys(entrant.bets).length &&
			newRaceBets.length > 0
		) {
			console.log(newRaceBets);
			Race.findOne({ raceID: race.raceID }, (err, doc) => {
				doc.entrants.set(entrant.name, {
					...entrant,
					bets: new Map(newRaceBets), //value.validate error -- schema expecting object instead of map?
				});
				doc.save(err => {
					if (err) {
						throw Error(err);
					}
				});
			});
		}
	});
}

//pays winning bets back 2:1 and sets them as paid
function betPayout(entrant, race) {
	let promises = [];
	Object.keys(entrant.bets).forEach(key => {
		promises.push(
			new Promise((resolve, reject) => {
				//checks if the bet has already been paid
				if (!entrant.bets[key].isPaid) {
					let betReward = entrant.bets[key].betAmount * 2;
					User.findOne(
						{ twitchUsername: entrant.bets[key].twitchUsername },
						(err, doc) => {
							if (err) {
								err.message =
									"Could not find user in bet payout";
								throw Error(err);
							}
							doc.points += betReward;
							doc.betHistory.forEach(userBet => {
								if (userBet.raceId === race.raceID) {
									userBet.result = `+${betReward}`;
								}
							});
							doc.save((err, saved) => {
								if (err) {
									err.message = "";
								}
								//return the edited bet as an array for map conversion
								resolve([
									entrant.bets[key].twitchUsername,
									{
										...entrant.bets[key],
										isPaid: true,
									},
								]);
							});
						}
					);
				}
			})
		);
	});

	return Promise.all(promises).then(newBets => {
		return newBets[0];
	});
}

//records the lost bet and result in the db
function closeBet(entrant, race) {
	let promises = [];
	Object.keys(entrant.bets).forEach(key => {
		promises.push(
			new Promise((resolve, reject) => {
				User.findOne(
					{ twitchUsername: entrant.bets[key].twitchUsername },
					(err, doc) => {
						if (err) {
							err.message = "Could not find user in bet payout";
							throw Error(err);
						}
						doc.betHistory.forEach(userBet => {
							if (userBet.raceId === race.raceID) {
								userBet.result = `-${
									entrant.bets[key].betAmount
								}`;
							}
						});
						doc.save(err => {
							if (err) {
								err.message = "";
							}
							//return the edited bet as an array for map conversion
							resolve([
								entrant.bets[key].twitchUsername,
								{
									...entrant.bets[key],
									isPaid: true,
								},
							]);
						});
					}
				);
			})
		);
	});
	return Promise.all(promises).then(newBets => {
		return newBets[0];
	});
}

module.exports.getRaceDataFromDB = getRaceDataFromDB;
module.exports.checkForFirstPlace = checkForFirstPlace;
module.exports.makeBet = makeBet;
