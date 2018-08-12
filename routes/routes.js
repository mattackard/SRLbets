const express = require('express');
const router = express.Router();
const Race = require('../models/race');
const getRaceData = require('../apiProcessing').getRaceData;

let races = '';                               //grab all the mongo documents
Race.find((err,data) => {
  if (err) return console.error(err);
  races = data;
});

//GET home route
router.get('/', (req,res,next) => {
  console.log(races);
  return res.render('index', { title : 'SRL Bets', data : races });
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
  getRaceData((raceData) => {
    return res.render('race', { raceObj : raceData });
  });
});

//race directory route
router.get('/twitch', (req,res,next) => {
  return res.render('twitch');
});


module.exports = router;
