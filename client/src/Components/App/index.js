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
			.get("http://localhost:3001/api/getRaces", {
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					races: res.data.races,
				});
			});
	};

	//get twitch client data nexessary for an oAuth login redirect
	getTwitchClientData = callback => {
		axios
			.get("http://localhost:3001/api/getTwitchClientData", {
				withCredentials: true,
			})
			.then(res => console.log(res.data));
	};

	//logs user into twitch after authorize redirect
	twitchLogin = (queryCode, state) => {
		axios
			.get("http://localhost:3001/api/twitchAuth", {
				params: {
					code: queryCode,
					state: state,
				},
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					user: res.data,
				});
			});
	};

	//logs user out of twitch and destroys session
	twitchLogout = () => {
		axios
			.get("http://localhost:3001/api/twitchLogout", {
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					user: {},
				});
			});
	};

	//gets the logged in user by checking the session storage
	getUser = () => {
		axios
			.get("http://localhost:3001/api/getLoggedInUser", {
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					user: res.data.user,
				});
			});
	};

	clearUserState = () => {
		this.setState({
			user: {},
		});
	};

	render() {
		return (
			<React.Fragment>
				<Header
					twitchLogin={this.twitchLogin}
					twitchLogout={this.twitchLogout}
					twitchAuthPath={this.state.twitchAuthPath}
					user={this.state.user}
					clearUserState={this.clearUserState}
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
