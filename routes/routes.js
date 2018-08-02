const express = require('express');
const router = express.Router();
const Race = require('../models/race');

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
  console.log('post ran');              //get the post route to work
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


module.exports = router;
