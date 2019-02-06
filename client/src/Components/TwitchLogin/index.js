import React, { Component } from "react";
import "./style.scss";

class TwitchLogin extends Component {
	state = {
		twitchUrl: "",
	};

	componentWillMount() {
		fetch("http://localhost:3001/api/twitchLoginUrl")
			.then(data => data.json())
			.then(res => {
				this.setState({
					twitchUrl: res.twitchUrl,
				});
			});
	}
	render() {
		return <a href={this.state.twitchUrl}>Log In With Twitch</a>;
	}
}

export default TwitchLogin;
