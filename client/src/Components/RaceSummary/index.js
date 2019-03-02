import React from "react";
import "./style.scss";

const RaceSummary = ({ race }) => {
	return (
		<ul>
			<li>{race.game}</li>
			<li>{race.goal}</li>
			<li>{race.status}</li>
			<li>{race.place}</li>
			<li>{race.time}</li>
		</ul>
	);
};

export default RaceSummary;
