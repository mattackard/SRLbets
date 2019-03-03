# SRLBets

SRLBets is a web app that allows twitch users to bet on the winner of races hosted by SpeedRunsLive. SRLBets extends the SpeedRunsLive API
to allow for tracking extra race statistics and further integration with your twitch profile.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Installing

To get the application running locally on your machine, install dependencies with npm from both the server and client package.json

Install npm dependencies for the server

```
npm install
```

Install the dependencies for the the front-end

```
cd client && npm install
```

This app relys on environment variables not contained in this repository to link your app to the twitch API and establish a connection to a mongodb database. For further information on aquiring your own twitch client information, see the [Twitch Developer Homepage](https://dev.twitch.tv/) and set up a new application. For further information on how to get your own test database set up with mLab, follow the [mLab Quick Start Guide](https://docs.mlab.com/).

## Running the tests

Tests are built using Mocha/Chai, run them with npm using
...
npm test
...

## Built With

-   [Node](https://nodejs.org/en/docs/) - Web server
-   [Express](https://expressjs.com/en/api.html) - Back-end web framework
-   [React](https://reactjs.org/docs/getting-started.html) - Front-end framework
-   [MongoDB](https://docs.mongodb.com/) - Database
-   [mLab](https://docs.mlab.com/) - Database hosting
-   [Twitch API](https://dev.twitch.tv/docs/api/) - Twitch user integration/authorization

## License

This project is licensed under the MIT License
