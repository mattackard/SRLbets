const axios = require('axios');
const Race = require('../../models/race');

function validateApiResponse(res) {
  if (!res) {
    throw Error();
  }

  else if (typeof res !== 'Object') {
    throw Error('The response from the API was not an object, or it was empty');
  }
}


function convertRaceStartTime(sec) {
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

function getRaceData(db) {
  axios.get('http://api.speedrunslive.com/races')
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
    for ( let i in race.entrants) {
      let entrantObj = {
        name: race.entrants[i].displayname,
        status: race.entrants[i].statetext,
        place: race.entrants[i].place,
        time: convertRunTime(race.entrants[i].time),
        twitch: race.entrants[i].twitch
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
      timeStarted: race.time,   //timeStarted is currently evaluating to null
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
      { upsert: true , new : true, runValidators : true },
      (err,doc) => {
        if (err) {
          console.error(err);
        }
        else {
          console.log('A race was updated or saved!');
          return doc;
        }
      }
    );
  });
}


module.exports.validateApiResponse = validateApiResponse;
module.exports.getRaceData = getRaceData;
module.exports.updateRaceData = updateRaceData;
