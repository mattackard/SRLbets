import React, { Component } from "react";
import "./style.scss";

import RaceTile from "../RaceTile";
import Loading from "../Loading";

class FollowingRaces extends Component {
	state = {
		followerRaces: [],
		racesPopulated: false,
	};

	componentDidMount() {
		this.getFollowerNames(this.props.user.following)
			.then(this.searchRacesForFollowers)
			.then(followerRaces => {
				console.log("followerRaces", followerRaces);
				this.setState({
					followerRaces: [...followerRaces],
					racesPopulated: true,
				});
			});
	}

	getFollowerNames = followList => {
		let promises = [];
		console.log(followList);
		Object.values(followList).forEach(follower => {
			promises.push(
				new Promise(resolve => {
					resolve(follower.twitchUsername);
				})
			);
		});
		return Promise.all(promises).then(data => {
			return data;
		});
	};

	searchRacesForFollowers = followArray => {
		let promises = [];
		let allRaces = [...this.props.races.open, ...this.props.races.ongoing];
		let followerRaces = new Set();
		console.log("users followed", followArray);
		allRaces.forEach(race => {
			Object.values(race.entrants).forEach(entrant => {
				promises.push(
					new Promise(resolve => {
						if (followArray.includes(entrant.twitch)) {
							followerRaces.add(race);
							resolve(race);
						} else {
							resolve();
						}
					})
				);
			});
		});
		console.log(Promise.all(promises));
		return Promise.all(promises).then(() => {
			return followerRaces;
		});
	};

	render() {
		return this.state.followerRaces.length ? (
			<div id="following-races">
				<h1>Follower Races</h1>
				<div className="race-list">
					{this.state.racesPopulated ? (
						this.state.followerRaces.length ? (
							this.state.followerRaces.map(data => (
								<RaceTile
									key={data._id}
									race={data}
									getDataFromDb={this.props.getDataFromDb}
								/>
							))
						) : (
							<p>No races with entrants you are following</p>
						)
					) : (
						<Loading />
					)}
				</div>
			</div>
		) : null;
	}
}

export default FollowingRaces;
