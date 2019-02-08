import React, { Component } from "react";
import axios from "axios";
import "./style.scss";

class TwitchLogout extends Component {
	logOut = () => {
		axios
			.get("http://localhost:3001/api/twitchLogout", {
				withCredentials: true,
			})
			.then(res => {
				console.log(res.data);
			});
	};
	render() {
		return <button onClick={this.logOut}>Log Out of Twitch</button>;
	}
}

export default TwitchLogout;
