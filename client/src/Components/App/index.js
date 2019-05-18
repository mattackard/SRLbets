import React, { Component } from "react";
import { Route, Switch } from "react-router-dom"; //withRouter?
import axios from "axios";
import "./style.scss";

//component imports
import Header from "../Header";
import Footer from "../Footer";
import Home from "../Home";
import Profile from "../Profile";
import UserPage from "../UserPage";
import GamePage from "../GamePage";
import RacePage from "../RacePage";

class App extends Component {
	state = {
		races: {
			open: [],
			ongoing: [],
			finished: [],
		},
		user: {},
		intervalIsSet: false,
		loggedIn: false,
		stream: {},
	};

	//gets data from mongo at a recurring interval as long as app is mounted
	//checks if user has a logged in session to continue
	componentDidMount() {
		this.getDataFromDb();
		this.getUser();
		if (!this.state.intervalIsSet) {
			let interval = setInterval(this.getDataFromDb, 10000);
			this.setState({ intervalIsSet: interval });
		}
	}

	// kills infinite process when app is unmounted
	componentWillUnmount() {
		if (this.state.intervalIsSet) {
			clearInterval(this.state.intervalIsSet);
			this.setState({ intervalIsSet: null });
		}
	}

	//gets open,ongoing,finished races from db
	getDataFromDb = () => {
		axios
			.get("/api/getRaces", {
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					races: res.data.races,
				});
			});
	};

	//gets a race from db by raceID
	getRace = id => {
		axios
			.get("/api/getRace", {
				withCredentials: true,
				params: {
					raceID: id,
				},
			})
			.then(res => {
				this.setState({
					races: res.data.races,
				});
			});
	};

	//logs user into twitch after authorize redirect
	twitchLogin = (queryCode, state) => {
		axios
			.get("/api/twitchAuth", {
				params: {
					code: queryCode,
					state: state,
				},
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					user: res.data,
					loggedIn: true,
				});
			});
	};

	//gets the logged in user by checking the session storage
	getUser = () => {
		axios
			.get("/api/getLoggedInUser", {
				withCredentials: true,
			})
			.then(res => {
				if (res.data !== "no user") {
					this.setState({
						user: res.data.user,
						loggedIn: true,
					});
				}
			});
	};

	//gets the twitch stream link for the top 2 entrants
	//in the race with the highest bet total
	getStreams = (numStreams, race) => {
		let streams = [];
		let highestTotal = -1;
		let targetRace = {};
		if (race) {
			targetRace = race;
		} else {
			this.state.races.ongoing.forEach(race => {
				if (
					race.betTotal > highestTotal &&
					Object.keys(race.entrants).length > numStreams - 1
				) {
					highestTotal = race.betTotal;
					targetRace = race;
				}
			});
		}
		Object.keys(targetRace.entrants).forEach(entrant => {
			if (
				targetRace.entrants[entrant].twitch &&
				streams.length < numStreams
			) {
				streams.push(targetRace.entrants[entrant].twitch);
			}
		});
		if (streams.length < numStreams) {
			throw Error("not enough entrants had twitch account linked");
		} else {
			this.setState({
				stream: {
					users: streams,
					race: targetRace,
				},
			});
		}
	};

	clearUserState = () => {
		this.setState({
			user: {},
			loggedIn: false,
		});
	};

	//converts date to a string without timezone information
	simplifyDate = date => {
		let pretty = new Date(date);
		pretty = pretty.toString().split(" ");
		//["Sun", "Feb", "05", "2322", "12:08:10", "GMT-0800", "(Pacific", "Standard", "Time)"]

		pretty[1] = this.numberedMonth(pretty[1]);
		//assumes 21st century
		pretty[3] = pretty[3].substring(2);
		pretty[4] = this.twelveHour(pretty[4]);

		//removes time zone information
		pretty.pop();
		pretty.pop();
		return `${pretty[0]} ${pretty[1]}/${pretty[2]}/${pretty[3]} ${
			pretty[4]
		}`;
	};

	//converts from 24 hour clock to 12 hour clock with am and pm
	twelveHour = time => {
		let amPm = "am";
		let pretty = time.split(":");

		//remove seconds from time
		pretty.pop();

		//checks for am vs pm and sets hour 24 to 12
		pretty.forEach(x => {
			return parseInt(x);
		});
		if (pretty[0] > 12) {
			pretty[0] -= 12;
			amPm = "pm";
		}
		if (pretty[0] === 12) {
			amPm = "pm";
		}
		if (pretty[0] === 0) {
			pretty[0] = 12;
		}
		return `${pretty.join(":")} ${amPm}`;
	};

	//takes an abbreviated month string and returns the number of the month
	numberedMonth = month => {
		switch (month) {
			case "Jan":
				return 1;
			case "Feb":
				return 2;
			case "Mar":
				return 3;
			case "Apr":
				return 4;
			case "May":
				return 5;
			case "Jun":
				return 6;
			case "Jul":
				return 7;
			case "Aug":
				return 8;
			case "Sep":
				return 9;
			case "Oct":
				return 10;
			case "Nov":
				return 11;
			case "Dec":
				return 12;
			default:
				return 0;
		}
	};

	//takes entrant's time from the API and returns a string
	convertRunTime = apiTime => {
		if (apiTime === 0) {
			//with standard HH:MM:SS, "In Progress", or "Race not started"
			return "Race has not started";
		} else if (apiTime === -3) {
			return "Race in progress";
		} else if (apiTime === -1) {
			return "Forfeit";
		} else if (apiTime > 0) {
			let hours = Math.floor(apiTime / 3600);

			let minutes = Math.floor((apiTime % 3600) / 60);
			if (minutes < 10) {
				minutes = `0${minutes}`;
			}

			let seconds = Math.floor((apiTime % 3600) % 60);
			if (seconds < 10) {
				seconds = `0${seconds}`;
			}
			return `${hours}:${minutes}:${seconds}`;
		}
	};

	render() {
		return (
			<div className="wrapper">
				<Header
					twitchAuthPath={this.state.twitchAuthPath}
					user={this.state.user}
					clearUserState={this.clearUserState}
					loggedIn={this.state.loggedIn}
				/>
				<Switch>
					<Route
						exact
						path="/"
						render={props => (
							<Home
								{...props}
								races={this.state.races}
								getDataFromDb={this.getDataFromDb}
								intervalIsSet={this.state.intervalIsSet}
								twitchLogin={this.twitchLogin}
								getStreams={this.getStreams}
								stream={this.state.stream}
							/>
						)}
					/>
					<Route
						path="/profile"
						render={props => (
							<Profile
								{...props}
								user={this.state.user}
								getUser={this.getUser}
								loggedIn={this.state.loggedIn}
								simplifyDate={this.simplifyDate}
								convertRunTime={this.convertRunTime}
							/>
						)}
					/>
					<Route
						path="/user/:username"
						render={props => (
							<UserPage
								{...props}
								simplifyDate={this.simplifyDate}
								convertRunTime={this.convertRunTime}
							/>
						)}
					/>
					<Route
						path="/game/:gameTitle"
						render={props => (
							<GamePage
								{...props}
								getDataFromDb={this.getDataFromDb}
							/>
						)}
					/>
					<Route
						path="/race/:raceID"
						render={props => (
							<RacePage
								{...props}
								getRace={this.getRace}
								getStreams={this.getStreams}
								stream={this.state.stream}
							/>
						)}
					/>
				</Switch>
				<Footer />
			</div>
		);
	}
}

export default App;
