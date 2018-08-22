const express = require('express');
const router = express.Router();
const Race = require('../models/race');
const User = require('../models/user');
const axios = require('axios');
const getRaceData = require('../public/js/apiProcessing').getRaceData;
const twitchClientId = '36ajloyc79v2ccwny9v8zfog0lwr3z';
const twitchRedirect = 'http://localhost:3000';

//GET home route
router.get('/', (req,res,next) => {
  Race.find().exec((err,data) => {
    if (err) {
      return next(err);
    }
    else {
      return res.render('index', { title: 'SRL Bets', raceObj: data });
    }
  });
});

//POST home route
router.post('/save', (req,res,next) => {
  accessToken = req.body.access_token;
  //make axios request with access token to get user info to save into db
  axios.get(
      'https://api.twitch.tv/helix/users',
      { headers: { 'Authorization': `Bearer ${accessToken}` } })
      .then((res) => {
        console.log(res.data.data[0]);  //create/update user and save to db
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
router.get('/authenticateTwitch', (req,res,next) => {
  res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${twitchClientId}&redirect_uri=${twitchRedirect}&response_type=token&scope=user:read:email`);
});


module.exports = router;
