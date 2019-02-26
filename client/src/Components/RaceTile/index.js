import React, { Component } from "react";
import "./style.scss";

import RaceTileEntrant from "../RaceTileEntrant";

class RaceTile extends Component {
	state = {
		showAllEntrants: false,
	};

	toggleAllEntrants = () => {
		this.setState({
			showAllEntrants: !this.state.showAllEntrants,
		});
	};

	render() {
		let race = this.props.race;
		let multiTwitch = "http://multitwitch.tv";
		let entrantLimit = 5;

		let entrantKeys = Object.keys(race.entrants);
		return (
			<div className="race">
				<h1>{race.gameTitle}</h1>
				<p className="race-goal">{race.goal || "No Goal Set"}</p>
				<p>{race.status}</p>
				{race.status !== "Entry Open" &&
				race.status !== "Entry Closed" ? (
					<p>Started {race.simpleTime}</p>
				) : null}
				<p>
					{/* determines whether entrant needs to be plural */}
					{entrantKeys.length === 1
						? `${entrantKeys.length} Race Entrant`
						: `${entrantKeys.length} Race Entrants`}
				</p>
				<div className="race-entrants">
					{entrantKeys.map(entrant => {
						multiTwitch += race.entrants[entrant].twitch
							? `/${race.entrants[entrant].twitch}`
							: "";
						if (entrantLimit > 0 || this.state.showAllEntrants) {
							entrantLimit--;
							return (
								<RaceTileEntrant
									key={race.entrants[entrant].name}
									entrant={race.entrants[entrant]}
									raceStatus={race.status}
									raceID={race.raceID}
									getDataFromDb={this.props.getDataFromDb}
								/>
							);
						} else {
							return null;
						}
					})}
					{entrantKeys.length > 5 ? (
						<button onClick={this.toggleAllEntrants}>
							{this.state.showAllEntrants ? "...less" : "...more"}
						</button>
					) : null}
				</div>
				{multiTwitch !== "http://multitwitch.tv" &&
				entrantKeys.length > 1 ? (
					<a
						href={multiTwitch}
						target="_blank"
						rel="noopener noreferrer">
						MultiTwtich Link
					</a>
				) : null}
			</div>
		);
	}
}

export default RaceTile;
