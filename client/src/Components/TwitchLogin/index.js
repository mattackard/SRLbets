import React, { Component } from "react";
import "./style.scss";

class TwitchLogin extends Component {
	componentWillMount() {
		this.props.getLoginUrl();
	}
	render() {
		return <a href={this.props.twitchUrl}>Log In With Twitch</a>;
	}
}

export default TwitchLogin;
