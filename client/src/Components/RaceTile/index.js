import React from "react";
import "./style.scss";

import RaceTileEntrant from "../RaceTileEntrant";

const RaceTile = props => {
	let multiTwitch = "http://multitwitch.tv";
	let race = props.race;

	let entrantKeys = Object.keys(race.entrants);
	return (
		<div className="race">
			<h1>{race.gameTitle}</h1>
			<p className="race-goal">{race.goal || "No Goal Set"}</p>
			<p>{race.status}</p>
			{race.status !== "Entry Open" && race.status !== "Entry Closed" ? (
				<p>Started {race.simpleTime}</p>
			) : null}
			<p>
				{/* determines whether entrant needs to be plural */}
				{entrantKeys.length === 1
					? `${entrantKeys.length} Race Entrant`
					: `${entrantKeys.length} Race Entrants`}
			</p>
			<div className="race-entrants">
				{entrantKeys.map(entrant => (
					<RaceTileEntrant
						key={race.entrants[entrant].name}
						entrant={race.entrants[entrant]}
						raceStatus={race.status}
						raceID={race.raceID}
						getDataFromDb={props.getDataFromDb}
					/>
				))}
			</div>
			{multiTwitch === "http://multitwitch.tv" ? null : (
				<a href={multiTwitch} target="_blank" rel="noopener noreferrer">
					MultiTwtich Link
				</a>
			)}
		</div>
	);
};

export default RaceTile;
