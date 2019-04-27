const Race = require("../models/race");
const User = require("../models/user");

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
				async (err, race) => {
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
							bets: await buildRaceBetHistory(
								previousEntrant,
								username,
								amount
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
						user.numBets++;
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
	let promises = [];
	if (previousEntrant.bets.size > 0) {
		previousEntrant.bets.forEach(bet => {
			promises.push(
				new Promise((resolve, reject) => {
					//if the bet username is already present, increase amount to reflect total combined bet amount
					if (bet.twitchUsername === username) {
						resolve([
							username,
							{
								twitchUsername: bet.twitchUsername,
								betAmount: amount + bet.betAmount,
								isPaid: bet.isPaid,
							},
						]);
					}
					//otherwise create new betHistory entry
					else {
						resolve([bet.twitchUsername, bet]);
					}
				})
			);
		});
		return Promise.all(promises).then(betHistory => {
			return new Map([...betHistory]);
		});
	} else {
		return new Map([
			[
				username,
				{
					twitchUsername: username,
					betAmount: amount,
					isPaid: false,
				},
			],
		]);
	}
}

//build user's bet history checking for bet amount increases
function buildUserBetHistory(betHistory, race, entrant, amount) {
	let increaseBet = false;
	//checks if user already made a bet on this race entrant
	betHistory.forEach(bet => {
		if (bet.raceID === race.raceID && bet.entrant === entrant) {
			increaseBet = true;
			bet.amountBet += amount;
		}
	});
	//if the bet doesn't already exists, add a new bet object to history array
	if (!increaseBet) {
		betHistory.push({
			raceID: race.raceID,
			game: race.gameTitle,
			goal: race.goal,
			entrant: entrant,
			amountBet: amount,
		});
	}
	return betHistory;
}

//checks if any race entrant has finished 1st
function checkForFirstPlace(race) {
	let containsFirstPlace = false;
	race.entrants.forEach(entrant => {
		if (entrant.place === 1) {
			containsFirstPlace = true;
		}
	});
	return containsFirstPlace;
}

//pays out and closes bets once the first race entrant has finished
function resolveBets(race) {
	if (checkForFirstPlace(race)) {
		race.entrants.forEach(async entrant => {
			if (entrant.bets.size > 0) {
				let newRaceBets = [];
				if (entrant.place === 1) {
					console.log(`${entrant.name} finished first!`);
					let newBets = await betPayout(entrant, race);
					newRaceBets.push(...newBets);
				} else {
					let newBets = await closeBet(entrant, race);
					newRaceBets.push(...newBets);
				}
				if (
					newRaceBets.length === entrant.bets.size &&
					newRaceBets.length > 0
				) {
					Race.findOne({ raceID: race.raceID }, (err, doc) => {
						newRaceBets = new Map(newRaceBets);
						if (entrant.place === 1) {
							doc.winner = {
								srlName: entrant.name,
								twitchUsername: entrant.twitch || null,
								betTotal: entrant.betTotal,
							};
							doc.markModified("winner");
						}
						doc.entrants.set(entrant.name, {
							name: entrant.name,
							status: entrant.status,
							place: entrant.place,
							time: entrant.time,
							twitch: entrant.twitch,
							betTotal: entrant.betTotal,
							bets: newRaceBets,
						});
						doc.allBetsPaid = true;
						doc.save(err => {
							if (err) {
								throw Error(err);
							}
						});
					});
				}
			}
		});
	}
}

//pays winning bets back 2:1 and sets them as paid
function betPayout(entrant, race) {
	let promises = [];
	entrant.bets.forEach(bet => {
		promises.push(
			new Promise((resolve, reject) => {
				//checks if the bet has already been paid
				if (!bet.isPaid) {
					let betReward = bet.betAmount * entrant.payRatio;
					User.findOne(
						{ twitchUsername: bet.twitchUsername },
						(err, doc) => {
							if (err) {
								err.message =
									"Could not find user in bet payout";
								throw Error(err);
							}
							doc.betHistory.forEach(userBet => {
								if (
									userBet.raceID === race.raceID &&
									userBet.entrant === entrant.name
								) {
									doc.points += betReward;
									userBet.result = `+${betReward}`;
									doc.betsWon++;
									doc.betRatio = betsWon / numBets;
								}
							});
							doc.save((err, saved) => {
								if (err) {
									throw Error(err);
								}
								//return the edited bet as an array for map conversion
								bet.isPaid = true;
								resolve([bet.twitchUsername, bet]);
							});
						}
					);
				}
			})
		);
	});
	return Promise.all(promises).then(newBets => {
		return newBets;
	});
}

//records the lost bet and result in the db
function closeBet(entrant, race) {
	let promises = [];
	entrant.bets.forEach(bet => {
		if (!bet.isPaid) {
			promises.push(
				new Promise((resolve, reject) => {
					User.findOne(
						{ twitchUsername: bet.twitchUsername },
						(err, doc) => {
							if (err) {
								err.message =
									"Could not find user in bet payout";
								throw Error(err);
							}
							doc.betHistory.forEach(userBet => {
								if (
									userBet.raceID === race.raceID &&
									userBet.entrant === entrant.name
								) {
									userBet.result = `-${bet.betAmount}`;
									doc.betRatio = betsWon / numBets;
								}
							});
							doc.save(err => {
								if (err) {
									throw Error(err);
								}
								//return the edited bet as an array for map conversion
								bet.isPaid = true;
								resolve([bet.twitchUsername, bet]);
							});
						}
					);
				})
			);
		}
	});
	return Promise.all(promises).then(newBets => {
		return newBets;
	});
}

//refunds bets made on an entrant that was entered but left the race before it started
function refundBetsForEntrant(oldEntrant, raceID) {
	//get the user entry of each user that has bet on the old entrant
	oldEntrant.bets.forEach(bet => {
		User.findOne(
			{
				twitchUsername: bet.twitchUsername,
			},
			(err, doc) => {
				if (err) {
					err.message = "Could not find user in bet payout";
					throw Error(err);
				}
				if (doc) {
					newBetHistory = [];
					//find the bet to refund in the user's bet history
					doc.betHistory.forEach(userBet => {
						if (
							userBet.raceID === raceID &&
							userBet.entrant === oldEntrant.name
						) {
							userBet.result = `entrant left race`;
							doc.points += userBet.amountBet;
							doc.numBets--;
						}
						newBetHistory.push(userBet);
					});
					doc.betHistory = newBetHistory;
					doc.markModified("betHistory");
					doc.save(err => {
						if (err) {
							//using console.error to prevent app crashing
							console.error(err);
						}
						bet.isPaid = true;
					});
				}
			}
		);
	});
}

//refunds all user bets for an array of race IDs
function refundBets(IDArray) {
	if (typeof IDArray !== "object") {
		console.log(typeof IDArray);
		IDArray = [IDArray];
	}
	return new Promise(resolve => {
		let eachID = [];
		IDArray.forEach(id => {
			eachID.push(
				new Promise(resolve => {
					Race.findOne({ raceID: id }, (err, race) => {
						if (err) {
							throw Error(err);
						}
						let eachRace = [];
						race.entrants.forEach(entrant => {
							eachRace.push(
								new Promise(resolve => {
									let eachBet = [];
									entrant.bets.forEach(bet => {
										eachBet.push(
											new Promise((resolve, reject) => {
												User.findOne(
													{
														twitchUsername:
															bet.twitchUsername,
													},
													(err, doc) => {
														if (err) {
															err.message =
																"Could not find user in bet payout";
															throw Error(err);
														}
														doc.betHistory.forEach(
															userBet => {
																if (
																	userBet.raceID ===
																		race.raceID &&
																	userBet.entrant ===
																		entrant.name
																) {
																	userBet.result = `race cancelled`;
																	doc.points +=
																		userBet.amount;
																}
															}
														);
														doc.markModified(
															"betHistory"
														);
														doc.save(err => {
															if (err) {
																throw Error(
																	err
																);
															}
															//return the edited bet as an array for map conversion
															bet.isPaid = true;
															resolve([
																bet.twitchUsername,
																bet,
															]);
														});
													}
												);
											})
										);
									});
									resolve(
										Promise.all(eachBet).then(newBets => {
											return newBets;
										})
									);
								})
							);
						});
						resolve(
							Promise.all(eachRace).then(data => {
								return data;
							})
						);
					});
				})
			);
		});
		resolve(
			Promise.all(eachID).then(data => {
				return data;
			})
		);
	});
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

module.exports.getRaceDataFromDB = getRaceDataFromDB;
module.exports.resolveBets = resolveBets;
module.exports.makeBet = makeBet;
module.exports.handleCancelledRaces = handleCancelledRaces;
module.exports.refundBetsForEntrant = refundBetsForEntrant;
