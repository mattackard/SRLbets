import React from "react";
import "./style.scss";

const RaceSummary = ({ race }) => {
	return (
		<div>
			<h1>{race.game}</h1>
			<h2>{race.goal}</h2>
			<p>Status : {race.status}</p>
			<p>Finish position: {race.place}</p>
			<p>Finish time: {race.time}</p>
		</div>
	);
};

export default RaceSummary;
