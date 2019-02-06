import React, { Component } from "react";
import "./style.scss";

class TwitchLogout extends Component {
	logOut = () => {
		fetch("http://localhost:3001/api/twitchLogout").then(res => {
			console.log(res);
		});
	};
	render() {
		return <button onClick={this.logOut}>Log Out of Twitch</button>;
	}
}

export default TwitchLogout;
