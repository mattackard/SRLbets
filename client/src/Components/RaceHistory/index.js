import React from "react";
import "./style.scss";

import RaceSummary from "../RaceSummary";

const RaceHistory = props => {
	return (
		<div className="content-column">
			<h2>Race History</h2>
			<ul id="race-history" className="column">
				{props.user.raceHistory.length ? (
					props.user.raceHistory.map((race, index) => {
						return (
							<RaceSummary
								key={index}
								race={race}
								simplifyDate={props.simplifyDate}
								convertRunTime={props.convertRunTime}
							/>
						);
					})
				) : (
					<p>User has not entered any races</p>
				)}
			</ul>
		</div>
	);
};

export default RaceHistory;
