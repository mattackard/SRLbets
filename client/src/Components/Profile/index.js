import React, { Component } from "react";
import "./style.scss";
import UserBet from "../UserBet";
import RaceSummary from "../RaceSummary";

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
						<h2>Bet History</h2>
						<ul id="bet-history" className="column">
							<li className="list-header">
								<p className="entrant-name">Race Entrant</p>
								<p className="entrant-bet">Points Bet</p>
								<p className="entrant-result">Result</p>
							</li>
							{user.betHistory.length ? (
								user.betHistory.map((bet, index) => (
									<UserBet key={index} bet={bet} />
								))
							) : (
								<p>User has not made any bets</p>
							)}
						</ul>
						<h2>Race History</h2>
						<ul id="raceHistory" className="column">
							{user.raceHistory.length ? (
								user.raceHistory.map((race, index) => (
									<RaceSummary key={index} race={race} />
								))
							) : (
								<p>User has not entered any races</p>
							)}
						</ul>
					</React.Fragment>
				) : (
					<h2>You must be logged in to view your profile</h2>
				)}
			</div>
		);
	}
}

export default Profile;
