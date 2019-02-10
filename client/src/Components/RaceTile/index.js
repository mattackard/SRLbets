import React from "react";
import "./style.scss";

import RaceTileEntrant from "../RaceTileEntrant";

const RaceTile = props => {
	let multiTwitch = "http://multitwitch.tv";
	let race = props.race;

	return (
		<div className="race">
			<h1>{race.gameTitle}</h1>
			<p className="race-goal">{race.goal}</p>
			<p>{race.status}</p>
			{race.status !== "Entry Open" ? (
				<p>Started {race.simpleTime}</p>
			) : null}
			<p>
				{/* determines whether entrant needs to be plural */}
				{race.entrants.length === 1
					? `${race.entrants.length} Race Entrant`
					: `${race.entrants.length} Race Entrants`}
			</p>
			<div className="race-entrants">
				{race.entrants.map(entrant => (
					<RaceTileEntrant
						key={entrant._id}
						entrant={entrant}
						raceStatus={race.status}
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
