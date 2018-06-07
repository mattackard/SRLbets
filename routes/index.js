const express = require('express');
const router = express.Router();

//GET home route
router.get('/', (req,res,next) => {
  return res.render('index');
});


module.exports = router;
