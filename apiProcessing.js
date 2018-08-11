
function validateApiResponse(res) {
  if (!res) {
    throw Error();
  }

  else if (typeof res !== 'Object') {
    throw Error('The response from the API was not an object, or it was empty');
  }
}

module.exports.validateApiResponse = validateApiResponse;
