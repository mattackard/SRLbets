const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);
const ircConnect = require("./js/irc").ircConnect;
const path = require("path");
const getRaceDataFromSRL = require("./js/apiProcessing").getRaceDataFromSRL;
const updateRaceData = require("./js/apiProcessing").updateRaceData;

//60,000 ms = 1 minute
const dbUpdateInterval = 60 * 1000;

//import mongodb configuration data
const config = require("./js/config");

const API_PORT = process.env.PORT || 3001;
const app = express();

//logs a bunch of stuff
//app.use(logger("dev"));

// this is our MongoDB database
const dbRoute = config.database.url;

//enable cors for development
const cors = require("cors");

const corsOptions = {
	origin: "http://localhost:3000",
	credentials: true,
};
app.use(cors(corsOptions));

// connects our back end code with the database
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

//setup session storage
app.use(
	session({
		secret: config.sessionSecret,
		resave: false,
		saveUninitialized: true,
		store: new MongoStore({ mongooseConnection: db }),
	})
);

//directs express to the react build files for deployment
app.use(express.static(path.join(__dirname, "client", "build")));

db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

//parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

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

//makes express serve react build files
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));