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
				this.props.clearUserState();
				this.props.getLoginUrl();
			})
			.catch(err => console.error(err));
	};
	render() {
		return (
			<button onClick={this.logOut} className="twitch-logout">
				Log Out of Twitch
			</button>
		);
	}
}

export default TwitchLogout;
