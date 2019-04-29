const Race = require("../models/race");

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

module.exports.getRaceDataFromDB = getRaceDataFromDB;
