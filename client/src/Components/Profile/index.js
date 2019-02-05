import React, { Component } from "react";

import "./style.scss";

class Profile extends Component {
	componentWillMount() {
		this.props.getUser();
	}
	render() {
		const { user } = this.props;
		return (
			<div>
				<h1>User Profile</h1>
				{Object.keys(user).length ? (
					<p>user is logged in: {user.twitchUsername}</p>
				) : (
					<p>User is not logged in</p>
				)}
			</div>
		);
	}
}

export default Profile;
