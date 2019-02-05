import React from "react";
import "./style.scss";

import RaceEntrant from "../RaceEntrant";

const Race = props => {
	let multiTwitch = "http://multitwitch.tv";
	let race = props.race;

	return (
		<div className="race">
			<h1>{race.gameTitle}</h1>
			<p>Goal: {race.goal}</p>
			<p>Race Status: {race.status}</p>
			{race.status !== "Entry Open" ? (
				<p>Race Start Time: {race.simpleTime}</p>
			) : null}
			<p>Number of Entrants: {race.entrants.length}</p>
			<div className="race-entrants">
				{race.entrants.map(entrant => (
					<RaceEntrant key={entrant._id} entrant={entrant} />
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

export default Race;
