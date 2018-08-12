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


function convertTime(sec) {
  let readableTime = new Date(sec * 1000);
  return readableTime;
}

function convertTime(apiTime) {     //takes time from the API and returns a string
                                  //with standard HH:MM:SS or "In Progress"
}

function getRaceData(callback) {
  axios.get('http://api.speedrunslive.com/races')
       .then((response) => {
         response.data.races.forEach((race) => {
           if (race.time > 0) {
             race.time = convertTime(race.time);
           }
         });
         callback(response.data.races);
       })
       .catch((error) => {
         console.error(error);
       });
}

function updateRaceData(races) {
  races.forEach(race) {

     //build the array of entrants
    let entrantArray = [];
    for ( let entrant in entrants) => {
      let entrantObj = {
        name: entrant.displayname,
        status: entrant.stateText,
        place: entrant.place,
        time: convertTime(entrant.time),
        twitch: entrant.twitch
      }
      entrantArray.push(entrantObj);
    });

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
    //     h1.gameTitle #{race.game.name}
    //     p.raceGoal Goal: #{race.goal}
    //     p.raceStatus Race Status: #{race.statetext}
    //     - if (race.statetext !== 'Entry Open')
    //       p.raceTime Race Start Time: #{race.time}
    //     p.numEntrant Number of entrants: #{race.numentrants}
    //
    //     //- iterate through each user object enetered in each race
    //     .raceEntrants
    //
    //     - let entrants = race.entrants
    //
    //     each user in entrants
    //       ul
    //         li Name: #{user.displayname}
    //         li Race Status: #{user.statetext}
    //         - if (user.statetext === 'Finished')
    //           li Finished in position: #{user.place}
    //         li Twtich username: #{user.twitch}
  }
}

module.exports.validateApiResponse = validateApiResponse;
module.exports.getRaceData = getRaceData;
