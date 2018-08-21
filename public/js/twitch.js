const axios = require('axios');
const clientId = '36ajloyc79v2ccwny9v8zfog0lwr3z';
const redirect = 	'http://localhost:3000/twitch';

function getTwitchUserToken (clientId, redirectURL) {
  axios.get(`https://id.twitch.tv/oauth2/authorize
    ?client_id=${clientId}
    &redirect_uri=${redirectURL}
    &response_type=token
    &scope=user:read:email`)
    .then((res) => {
      //get the auth code from the redirected url via document.location.hash
      console.log(document.location.hash);
    })
    .then(() => {
      axios.post(`https://id.twitch.tv/oauth2/token
    ?client_id=${clientId}
    &client_secret=<your client secret>
    &code=<authorization code received above>
    &grant_type=authorization_code
    &redirect_uri=<your registered redirect URI>`);
    });
}

function getTwitchAppToken() {
  axios.post();
}




Twitch.init({clientId: '36ajloyc79v2ccwny9v8zfog0lwr3z'}, (error, status) => {
  if (error) {
    // error encountered while loading
    console.error(error);
  }
  // the sdk is now loaded
  if (status.authenticated) {
  // Already logged in, hide the login button
    $('.twitch-connect').hide();
    $('.loginStatus').text('You are logged in through Twitch!');

  }

  Twitch.api({method: 'user'}, function(error, user) {
    $('.twitchUsername').text(user.display_name);
    User.find({ twitchUsername: user.display_name }, (err, res) => {    //add user to db if it doesn't already exist
      if (err) {
        throw Error(err);
      }
      if (!res.twitchUsername) {
        let userObj = {
          twitchUsername: user.display_name,
          points : 100,
          betHistory : []
        };
        User.create(userObj, (err, user) => {
          if (err) {
            throw Error(err);
          }
          else {
            console.log('user was saved to db');
          }
        });
      }
    });
  });

  $('.twitch-connect').click(() => {         //login through twitch on button click
    Twitch.login({
      scope: ['user_read', 'channel_read']
    });
  });

  $('#logout button').click(function() {         //logout of twitch
    Twitch.logout((error) => {
      if (error) {
        console.error(error);
      }
      else {
        console.log('You should be logged out now');
      }
    });
  });
});
