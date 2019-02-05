const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");

const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const ircConnect = require("./irc").ircConnect;
const getRaceDataFromSRL = require("./apiProcessing").getRaceDataFromSRL;
const updateRaceData = require("./apiProcessing").updateRaceData;

//60,000 ms = 1 minute
const dbUpdateInterval = 60 * 1000;

//import mongodb configuration data
const config = require("./config");

const API_PORT = 3001;
const app = express();

//parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//logs a bunch of stuff
//app.use(logger("dev"));

// this is our MongoDB database
const dbRoute = config.database.url;

// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

//setup session storage
app.use(
	session({
		secret: "keyboard cat",
		resave: true,
		saveUninitialized: false,
		store: new MongoStore({ mongooseConnection: db }),
	})
);

// append /api for our http requests
const router = require("./router");
app.use("/api", router);

//get race data and update the db at set interval
setInterval(() => {
	getRaceDataFromSRL(updateRaceData);
}, dbUpdateInterval);

//catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error("File not found.");
	err.status = 404;
	next(err);
});

//handle all other errors, must be last app.use call
app.use((err, req, res, next) => {
	res.status(err.status || 500).send("error");
});

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));
