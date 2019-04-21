import React from "react";
import "./style.scss";

import UserBet from "../UserBet";

const BetHistory = props => {
	return (
		<div className="content-column">
			<h2>Bet History</h2>
			<ul id="bet-history" className="column">
				<li className="list-header">
					<p className="bet-date">Date</p>
					<p className="entrant-name">Race Entrant</p>
					<p className="entrant-game">Game</p>
					<p className="entrant-bet">Points Bet</p>
					<p className="entrant-result">Result</p>
				</li>
				{props.user.betHistory.length ? (
					props.user.betHistory.map((bet, index) => (
						<UserBet
							key={index}
							bet={bet}
							simplifyDate={props.simplifyDate}
							convertRunTime={props.convertRunTime}
						/>
					))
				) : (
					<h3>User has not made any bets</h3>
				)}
			</ul>
		</div>
	);
};

export default BetHistory;
