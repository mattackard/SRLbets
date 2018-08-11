const axios = require('axios');

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

module.exports.validateApiResponse = validateApiResponse;
module.exports.getRaceData = getRaceData;
