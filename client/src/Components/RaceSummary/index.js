import React from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

const RaceSummary = ({ race, simplifyDate, convertRunTime }) => {
	return (
		<li className="race-summary">
			<p>{simplifyDate(race.date)}</p>
			<NavLink to={`/game/${race.game}`}>
				<p>{race.game}</p>
			</NavLink>
			<p>{race.goal}</p>
			{race.place < 1000 ? <p>{race.place}</p> : <p>Race In Progress</p>}
			{/* {race.place === 9998 ? <p>Forfeit</p> : null} */}
			{race.time > 0 ? (
				<p>Finish time: {convertRunTime(race.time)}</p>
			) : (
				<p>Race In Progress</p>
			)}
		</li>
	);
};

export default RaceSummary;
