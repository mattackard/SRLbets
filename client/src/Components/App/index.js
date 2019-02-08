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
	componentDidMount() {
		this.getDataFromDb();
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

	twitchLogin = (queryCode, state) => {
		axios
			.get("http://localhost:3001/api/twitchAuth", {
				params: {
					code: queryCode,
					state: state,
				},
				withCredentials: true,
			})
			.then(res =>
				this.setState({
					user: res.data,
				})
			);
	};

	twitchLogout = () => {
		axios
			.get("http://localhost:3001/api/twitchLogout", {
				withCredentials: true,
			})
			.then(res => console.log(res.data));
	};

	getUser = () => {
		axios
			.get("http://localhost:3001/api/getLoggedInUser", {
				withCredentials: true,
			})
			.then(res => {
				console.log(res.data);
				this.setState({
					user: res.data,
				});
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
