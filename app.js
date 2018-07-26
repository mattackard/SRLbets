const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const app = express();

//set up parsing of requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));

//set pug as the view engine
app.set('view engine', 'pug');
app.set('views', __dirname + '/views');

//set path for static assets
app.use(express.static(__dirname + '/public'));

//include routes
const routes = require('./routes/routes');
app.use('/', routes);

//mongodb connection
mongoose.connect('mongodb://localhost:27017/race');
const db = mongoose.connection;
//handle mongo errors
db.on('error', console.log.bind(console, 'connection error: '));

//expose db messages for use in templates
app.use((req,res,next) => {                                                   //issue here? trying to get mongodb entry on index.pug
  res.locals.currentMessage = req.message.messageID;
  next();
});

//catch 404 and forward to error handler
app.use((req,res,next) => {
  const err = new Error('File not found.');
  err.status = 404;
  next(err);
});

//handle all other errors, must be last app.use call
app.use((err,req,res,next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//run node app on port 3000
app.listen(3000, () => {
  console.log('Node app running on port 3000');
});
