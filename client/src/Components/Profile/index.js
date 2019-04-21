import React, { Component } from "react";
import "./style.scss";
import RaceHistory from "../RaceHistory";
import BetHistory from "../BetHistory";
import Loading from "../Loading";

class Profile extends Component {
	componentWillMount() {
		this.props.getUser();
	}
	render() {
		const { user, loggedIn } = this.props;
		return (
			<div id="main-content" class="profile-container">
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
						<h3>Bet Balance: {user.points}</h3>
						{user.betHistory ? (
							<BetHistory
								user={user}
								simplifyDate={this.props.simplifyDate}
								convertRunTime={this.props.convertRunTime}
							/>
						) : (
							<Loading />
						)}
						{user.raceHistory ? (
							<RaceHistory
								user={user}
								simplifyDate={this.props.simplifyDate}
								convertRunTime={this.props.convertRunTime}
							/>
						) : (
							<Loading />
						)}
					</React.Fragment>
				) : (
					<h2>You must be logged in to view your profile</h2>
				)}
			</div>
		);
	}
}

export default Profile;
