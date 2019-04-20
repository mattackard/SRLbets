import React from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

const RaceSummary = ({ race, simplifyDate, convertRunTime }) => {
	return (
		<div className="race-summary">
			<NavLink to={`/game/${race.game}`}>
				<h1>{race.game}</h1>
			</NavLink>
			<h2>{race.goal}</h2>
			<p>{simplifyDate(race.date)}</p>
			<p>Status : {race.status}</p>
			{race.place < 1000 ? <p>Finish position: {race.place}</p> : null}
			{race.place === 9998 ? <p>Finish position: Forfeit</p> : null}
			{race.time > 0 ? (
				<p>Finish time: {convertRunTime(race.time)}</p>
			) : null}
		</div>
	);
};

export default RaceSummary;
