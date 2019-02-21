import React from "react";
import "./style.scss";

const RaceSummary = props => {
	const { race } = props;
	return (
		<li>
			{race.game}, {race.goal}, {race.status}, {race.place}, {race.time}
		</li>
	);
};

export default RaceSummary;
