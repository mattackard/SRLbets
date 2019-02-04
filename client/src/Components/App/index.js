import React, { Component } from "react";
import { Route, Switch } from "react-router-dom"; //withRouter?
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
		fetch("http://localhost:3001/api/getRaces")
			.then(data => data.json())
			.then(res =>
				this.setState({
					races: res.races,
				})
			);
	};

	//get twitch client data nexessary for an oAuth login redirect
	getTwitchClientData = callback => {
		fetch("http://localhost:3001/api/getTwitchClientData").then(data =>
			callback(data)
		);
	};

	twitchLogin = () => {
		this.getTwitchClientData(data => {
			console.log(data);
		});
	};

	twitchLogout = () => {
		this.getTwitchClientData(data => {
			console.log(data);
		});
	};

	render() {
		return (
			<React.Fragment>
				<Header
					twitchLogin={this.twitchLogin}
					twitchLogout={this.twitchLogout}
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
							/>
						)}
					/>
					<Route
						path="/profile"
						render={props => (
							<Profile {...props} user={this.state.user} />
						)}
					/>
				</Switch>
				<Footer />
			</React.Fragment>
		);
	}
}

export default App;
