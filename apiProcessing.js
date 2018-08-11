const axios = require('axios');

function validateApiResponse(res) {
  if (!res) {
    throw Error();
  }

  else if (typeof res !== 'Object') {
    throw Error('The response from the API was not an object, or it was empty');
  }
}

function getRaceData(callback) {
  axios.get('http://api.speedrunslive.com/races')
       .then((response) => {
         callback(response.data.races);
       })
       .catch((error) => {
         console.error(error);
       });
}

module.exports.validateApiResponse = validateApiResponse;
module.exports.getRaceData = getRaceData;
