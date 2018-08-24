const express = require('express');
const router = express.Router();
const Race = require('../models/race');
const User = require('../models/user');
const Client = require('../models/client');
const axios = require('axios');
const getRaceData = require('../public/js/apiProcessing').getRaceData;

let twitchClientData,                                             //grab all the information for OAuth interaction with the Twitch API
    twitchClientId,                                               //from mongoDB
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

  //gets the access token and refresh token from Twitch using the code passed on redirect
  axios.post(`https://id.twitch.tv/oauth2/token?client_id=${twitchClientId}&client_secret=${twitchClientSecret}&code=${code}&grant_type=authorization_code&redirect_uri=${twitchRedirect}`)
    .then((token) => {
      if (token.status !== 200) {
        console.error(token);
      }
      else {

        //gets the user information using the token information retrieved in the parent request
        axios.get('https://api.twitch.tv/helix/users', {headers : {Authorization: `Bearer ${token.data.access_token}`}})
          .then((userData) => {
            if (userData.status !== 200) {
              console.error(userData);
            }

            //if the user doesnt already exists one is created
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

function checkForDoc(Collection,search, callback) {       //checks for a document in the database and runs a callback
  Collection.find(search).exec((err,docs) => {            //passing in a boolean depeneding on if the document exists
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
  if (req.query.code) {                             //if user has authenticated with twitch they will be redirected to
    getAndSaveUser(req.query.code, () => {          //the homepage with a query string used to further authenticate
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


//route for twitch auth redirect / login
router.get('/twitchLogin', (req,res,next) => {
  res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${twitchRedirect}&response_type=code&scope=user:read:email`);
});

//route for twitch auth revoke / logout
router.get('/twitchLogout', (req,res,next) => {
  res.redirect(`https://id.twitch.tv/oauth2/revoke?client_id=${twitchClientId}&token=<your OAuth token>`);
});


module.exports = router;
