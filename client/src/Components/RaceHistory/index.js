import React from "react";
import "./style.scss";

import RaceSummary from "../RaceSummary";

const RaceHistory = props => {
	return (
		<React.Fragment>
			<h2>Race History</h2>
			<ul id="raceHistory" className="column">
				{props.user.raceHistory.length ? (
					props.user.raceHistory.map((race, index) => (
						<RaceSummary key={index} race={race} />
					))
				) : (
					<p>User has not entered any races</p>
				)}
			</ul>
		</React.Fragment>
	);
};

export default RaceHistory;
