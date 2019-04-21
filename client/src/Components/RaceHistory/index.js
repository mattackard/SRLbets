import React from "react";
import "./style.scss";

import RaceSummary from "../RaceSummary";

const RaceHistory = props => {
	return (
		<div className="content-column">
			<h2>Race History</h2>
			<ul id="race-history" className="column">
				<li className="list-header">
					<p>Date</p>
					<p>Game</p>
					<p>Category</p>
					<p>Position</p>
					<p>Time</p>
				</li>
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
					<h3>User has not entered any races</h3>
				)}
			</ul>
		</div>
	);
};

export default RaceHistory;
