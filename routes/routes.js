const express = require('express');
const router = express.Router();
const Race = require('../models/race');

//GET home route
router.get('/', (req,res,next) => {
  // Race.findById(req.message.messageID)                           //get messages from mongodb
  //   .exec((error, message) => {
  //     if(error) {
  //       return next(error);
  //     }
  //     else {
  //       return res.render('index', { title : 'SRL Bets' , message : message.message });
  //     }
  //   })
    return res.render('index', { title : 'SRL Bets' , //message : req.message.message
  });
});

router.post('/', (req,res,next) => {
  console.log('post ran');              //get the post route to work
  if (req.body.message) {
    let raceData = req.body.message;

    Race.create(raceData, (error, race) => {
      if(error) {
        return next(err);
      }
      else {

      }
    });
  }
})


module.exports = router;
