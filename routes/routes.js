const express = require('express');
const router = express.Router();
const Race = require('../models/race');
const User = require('../models/user');
const Client = require('../models/client');
const axios = require('axios');
const getRaceData = require('../public/js/apiProcessing').getRaceData;

let twitchClientData,
    twitchClientId,
    twitchClientSecret,
    twitchRedirect;
Client.findOne({clientName : 'Twitch'}).exec((err,data) => {
  if (err) {
    console.error(err);
  }
  twitchClientData = data;
  twitchClientId = twitchClientData.clientId;
  twitchClientSecret = twitchClientData.clientSecret;
  twitchRedirect = 'http://localhost:3000';
});

function getAndSaveUser(code, callback) {
  axios.post(`https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirect}`)
    .then((token) => {
      if (token.status !== 200) {
        console.error(token);
      }
      else {
        axios.get('https://api.twitch.tv/helix/users', {headers : {Authorization: `Bearer ${token.data.access_token}`}})
          .then((userData) => {
            if (userData.status !== 200) {
              console.error(userData);
            }
            checkForDoc(User,{'twitchUsername': userData.data.data[0].login}, (doc) => {
              if (!doc) {
                User.create({
                  twitchUsername: userData.data.data[0].login,
                  avatar : userData.data.data[0].profile_image_url,
                  oAuth : token.data,
                  betHistory : []
                }, (err, saved) => {
                  if (err) {
                    throw Error(err);
                  }
                  else {
                    console.log('user was saved : ');
                    console.log(saved);
                  }
                });
              }
              else {
                console.log('user already exists');
              }
              callback();
            });
      });
      //console.log(token.data);
    }
  });
}

function checkForDoc(Collection,search, callback) {
  Collection.find(search).exec((err,docs) => {
    if (err) {
      console.error(err);
    }
    if (docs.length > 0) {
      callback(true);
    }
    else {
      callback(false);
    }
  });
}


//GET home route
router.get('/', (req,res,next) => {
  if (req.query.code) {
    getAndSaveUser(req.query.code, () => {
      res.redirect('/');
    });
  }
  else {
    Race.find().exec((err,data) => {
      if (err) {
        return next(err);
      }
      else {
        return res.render('index', { title: 'SRL Bets', raceObj: data });
      }
    });
  }
});

//POST home route
router.post('/save', (req,res,next) => {
  accessToken = req.body.access_token;
  //make axios request with access token to get user info to save into db
  axios.get(
      'https://api.twitch.tv/helix/users',
      { headers: { 'Authorization': `Bearer ${accessToken}` } })
      .then((res) => {
        let twitchUser = res.data.data[0];
        axios.post(`https://id.twitch.tv/oauth2/token
          ?client_id=${twitchClientId}
          &client_secret=${twitchClientSecret}
          &code=${accessToken}
          &grant_type=authorization_code
          &redirect_uri=${twitchRedirect}`)
          .then((res) => {

        });
        console.log(twitchUser);  //create/update user and save to db
        if ( ! User.findOne({ twitchUsername : twitchUser.login }) ) {
          User.create({
            twitchUsername: twitchUser.login,
            points : 100,
            avatar : twitchUser.profile_img_url,
            accessToken : accessToken,
            refreshToken: String,
            betHistory : []
          });
        }
      });
  res.send('all good');
});

//race directory route
router.get('/races', (req,res,next) => {
  Race.find().exec((err,data) => {
    if (err) {
      return next(err);
    }
    else {
      return res.render('race', { title: 'SRL Bets Live Races', raceObj: data });
    }
  });
});

//route for twitch auth redirect
router.get('/twitchLogin', (req,res,next) => {
  res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${twitchRedirect}&response_type=code&scope=user:read:email`);
});

//route for twitch auth redirect
router.get('/twitchLogout', (req,res,next) => {
  res.redirect(`https://id.twitch.tv/oauth2/revoke?client_id=${twitchClientId}&token=<your OAuth token>`);
});


module.exports = router;
