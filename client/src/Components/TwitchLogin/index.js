import React, { Component } from "react";
import axios from "axios";
import "./style.scss";

class TwitchLogin extends Component {
	state = {
		twitchUrl: "",
	};

	componentWillMount() {
		axios
			.get("http://localhost:3001/api/twitchLoginUrl", {
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					twitchUrl: res.data.twitchUrl,
				});
			});
	}
	render() {
		return <a href={this.state.twitchUrl}>Log In With Twitch</a>;
	}
}

export default TwitchLogin;
