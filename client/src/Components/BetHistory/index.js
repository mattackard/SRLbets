import React from "react";
import "./style.scss";

import UserBet from "../UserBet";

const BetHistory = props => {
	return (
		<React.Fragment>
			<h2>Bet History</h2>
			<ul id="bet-history" className="column">
				<li className="list-header">
					<p className="entrant-name">Race Entrant</p>
					<p className="entrant-bet">Points Bet</p>
					<p className="entrant-result">Result</p>
				</li>
				{props.user.betHistory.length ? (
					props.user.betHistory.map((bet, index) => (
						<UserBet key={index} bet={bet} />
					))
				) : (
					<p>User has not made any bets</p>
				)}
			</ul>
		</React.Fragment>
	);
};

export default BetHistory;
