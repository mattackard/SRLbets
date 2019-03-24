import React from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

const RaceSummary = ({ race }) => {
	return (
		<div class="race-summary">
			<NavLink to={`/game/${race.game}`}>
				<h1>{race.game}</h1>
			</NavLink>
			<h2>{race.goal}</h2>
			<p>Status : {race.status}</p>
			<p>Finish position: {race.place}</p>
			<p>Finish time: {race.time}</p>
		</div>
	);
};

export default RaceSummary;
