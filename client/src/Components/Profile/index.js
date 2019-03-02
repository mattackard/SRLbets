import React, { Component } from "react";
import "./style.scss";
import RaceHistory from "../RaceHistory";
import BetHistory from "../BetHistory";

class Profile extends Component {
	componentWillMount() {
		this.props.getUser();
	}
	render() {
		const { user, loggedIn } = this.props;
		return (
			<div id="profile-container">
				{loggedIn ? (
					<React.Fragment>
						<ul className="user-display">
							<img
								src={user.twitchProfileImg}
								alt={`${user.twitchUsername}'s avatar`}
								id="profile-img"
							/>
							<h2>{user.twitchUsername}</h2>
						</ul>
						<h3>Points: {user.points}</h3>
						<BetHistory user={user} />
						<RaceHistory user={user} />
					</React.Fragment>
				) : (
					<h2>You must be logged in to view your profile</h2>
				)}
			</div>
		);
	}
}

export default Profile;
