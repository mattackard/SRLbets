import React, { Component } from "react";
import { NavLink } from "react-router-dom";
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
				<NavLink to={`/game/${race.gameTitle}`}>
					<h1>{race.gameTitle}</h1>
				</NavLink>
				<NavLink to={`/race/${race.raceID}`}>
					<p className="race-goal">{race.goal || "No Goal Set"}</p>
				</NavLink>
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
						<button
							onClick={this.toggleAllEntrants}
							className="showEntrantsButton">
							{this.state.showAllEntrants
								? "...show less ▲"
								: "...show more ▼"}
						</button>
					) : null}
				</div>
				{multiTwitch !== "http://multitwitch.tv" &&
				entrantKeys.length > 1 ? (
					<a
						className="multitwitch-link"
						href={multiTwitch}
						target="_blank"
						rel="noopener noreferrer">
						Watch with MultiTwtitch
					</a>
				) : null}
			</div>
		);
	}
}

export default RaceTile;
