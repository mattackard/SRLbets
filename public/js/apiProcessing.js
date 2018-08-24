const axios = require('axios');
const Race = require('../../models/race');
const User = require('../../models/user');

function validateApiResponse(res) {           //checks the response from the SRL API in case it is empty or not as expected
  if (!res) {
    throw Error();
  }
  else if (typeof res !== 'Object') {
    throw Error('The response from the API was not an object, or it was empty');
  }
}

function convertRaceStartTime(sec) {       //converts seconds back into a Date
  let ms = sec * 1000;
  let date = new Date();
  date.setTime(ms);
  return date;
}

function convertRunTime(apiTime) {         //takes entrant's time from the API and returns a string
  if (apiTime === 0) {                 //with standard HH:MM:SS, "In Progress", or "Race not started"
    return "Race has not started";
  }
  else if (apiTime === -3) {
    return "Race in progress";
  }
  else if (apiTime === -1) {
    return "Forfeit";
  }
  else if (apiTime > 0) {
    let hours = Math.floor(apiTime / 3600);

    let minutes = Math.floor((apiTime % 3600) / 60);
    if (minutes < 10) { minutes = `0${minutes}`; }

    let seconds = Math.floor((apiTime % 3600) % 60);
    if (seconds < 10) { seconds = `0${seconds}`; }
    return `${hours}:${minutes}:${seconds}`;
  }
}

function getRaceData(db) {                          //gets the current race json data from the SRL API
  axios.get('http://api.speedrunslive.com/races')   //and saves/updates it in the local database
       .then((response) => {
         response.data.races.forEach((race) => {
           if (race.time > 0) {
             race.time = convertRaceStartTime(race.time);
           }
         });
         updateRaceData(response.data.races, db);
       })
       .catch((error) => {
         console.error(error);
       });
}

function updateRaceData(races, db) {
  races.forEach((race) => {
    //build the array of entrants
    let entrantArray = [];
    for ( let i in race.entrants) {                       //fills in data for the race entrant schema
      let entrantObj = {
        name: race.entrants[i].displayname,
        status: race.entrants[i].statetext,
        place: race.entrants[i].place,
        time: convertRunTime(race.entrants[i].time),
        twitch: race.entrants[i].twitch,
        betTotal: getBetTotal(race, race.entrants[i].displayname)
      }
      entrantArray.push(entrantObj);
    }

    //create a race document for saving in db
    let raceDoc = new Race({
      raceID: race.id,
      gameID: race.game.id,
      gameTitle: race.game.name,
      goal: race.goal,
      status: race.statetext,
      timeStarted: race.time,
      entrants: entrantArray
    });

    //update the race database
    Race.updateOne(                                   //apparently pre-save doesn't execute using this method, just
      { raceID : raceDoc.raceID },                    //leaving a note in case I end up using pre-save and am having issues
      {$set: {   'raceID': race.id,
                 'gameID': race.game.id,
                 'gameTitle': race.game.name,
                 'goal': raceDoc.goal,
                 'status': raceDoc.status,
                 'timeStarted': raceDoc.timeStarted,
                 'entrants': raceDoc.entrants
              }},
      { upsert: true , new : true, runValidators : true },      //upsert will create a new db doc if none was found
      (err,doc) => {
        if (err) {
          throw Error(err);
        }
        else {
          console.log('A race was updated or saved!');
          return doc;
        }
      }
    );
  });
}

function getBetTotal(race, entrantName) {                //searches for the race entrant and returns the current
  Race.find({ raceID: race.id }, (err, res) => {          //bet total if present
    if (err) {
      throw Error(err);
    }
    else if (res.entrants) {
      return res.entrants[entrantName].betTotal;
    }
    else {
      return 0;
    }
  });
}

function makeBet(username, entrant) {

}


module.exports.validateApiResponse = validateApiResponse;
module.exports.getRaceData = getRaceData;
module.exports.updateRaceData = updateRaceData;