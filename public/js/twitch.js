
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

    Twitch.api({method: 'user'}, function(error, user) {
      $('.twitchUsername').text(user.display_name);
    });
  }

  $('.twitch-connect').click(function() {         //login through twitch on button click
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
