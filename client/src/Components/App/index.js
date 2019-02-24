import React, { Component } from "react";
import { Route, Switch } from "react-router-dom"; //withRouter?
import axios from "axios";
import "./style.scss";

//component imports
import Header from "../Header";
import Footer from "../Footer";
import Home from "../Home";
import Profile from "../Profile";

class App extends Component {
	// initialize our state
	state = {
		races: {
			open: [],
			ongoing: [],
			finished: [],
		},
		user: {},
		intervalIsSet: false,
		loggedIn: false,
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

	//get twitch client data necessary for an oAuth login redirect
	getTwitchClientData = callback => {
		axios
			.get("/api/getTwitchClientData", {
				withCredentials: true,
			})
			.then(res => console.log(res.data));
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

	clearUserState = () => {
		this.setState({
			user: {},
			loggedIn: false,
		});
	};

	render() {
		return (
			<React.Fragment>
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
							/>
						)}
					/>
				</Switch>
				<Footer />
			</React.Fragment>
		);
	}
}

export default App;
