const axios = require('axios');
const Race = require('../models/race');

function validateApiResponse(res) {
  if (!res) {
    throw Error();
  }

  else if (typeof res !== 'Object') {
    throw Error('The response from the API was not an object, or it was empty');
  }
}


function convertRaceStartTime(sec) {
  let readableTime = new Date(sec * 1000);
  return readableTime;
}

function convertRunTime(apiTime) {         //takes entrant's time from the API and returns a string
  if (apiTime === -3) {                 //with standard HH:MM:SS, "In Progress", or "Race not started"
    return "Race has not started";
  }
  else if (apiTime === 0) {
    return "Race in progress";
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

function getRaceData(callback) {
  axios.get('http://api.speedrunslive.com/races')
       .then((response) => {
         response.data.races.forEach((race) => {
           if (race.time > 0) {
             race.time = convertRaceStartTime(race.time);
           }
         });
         callback(response.data.races); //leave callback as argument or hard code db update?
       })
       .catch((error) => {
         console.error(error);
       });
}

function updateRaceData(races) {
  races.forEach((race) => {
    //build the array of entrants
    let entrantArray = [];
    for ( let entrant in entrants) {
      let entrantObj = {
        name: entrant.displayname,
        status: entrant.stateText,
        place: entrant.place,
        time: convertRunTime(entrant.time),
        twitch: entrant.twitch
      }
      entrantArray.push(entrantObj);
    }
    //create a race document for saving in db
    let raceDoc = new Race({
      raceID: race.id,
      gameID: race.game.id,
      gameTitle: race.game.name,
      goal: race.goal,
      status: race.stateText,
      timeStarted: race.time,
      entrants: [entrantArray]
    });

    //if race's raceID can be found in the database
      //update the entry with current data
    //else
      //save the data as a new document
  });
}


module.exports.validateApiResponse = validateApiResponse;
module.exports.getRaceData = getRaceData;
