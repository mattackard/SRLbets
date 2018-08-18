const express = require('express');
const router = express.Router();
const Race = require('../models/race');
const User = require('../models/user');
const getRaceData = require('../public/js/apiProcessing').getRaceData;

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

router.post('/', (req,res,next) => {
  console.log('post ran');
  if (req.body.message) {
    let raceData = req.body.message;
    console.log(raceData);
    let race = new Race({
      message: raceData
    });
    race.save((err) => {
      if (err) next(err);
      console.log(`message saved : ${raceData}`);
      res.redirect('/');
    });
  }
  else {
    res.redirect('/youDidntWriteAnything');
  }
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

//race directory route
router.get('/twitch', (req,res,next) => {
  return res.render('twitch');
});


module.exports = router;
