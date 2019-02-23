import React from "react";
import "./style.scss";

const RaceSummary = props => {
	const { race } = props;
	return (
		<li>
			<p>{race.game}</p>
			<p>{race.goal}</p>
			<p>{race.status}</p>
			<p>{race.place}</p>
			<p>{race.time}</p>
		</li>
	);
};

export default RaceSummary;
