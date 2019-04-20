import React from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

const UserBet = props => {
	const { bet, simplifyDate } = props;
	return (
		<li className="user-bet">
			<p className="bet-date">{simplifyDate(bet.date)}</p>
			<p className="entrant-name">
				<NavLink to={`/user/${bet.entrant}`}>{bet.entrant}</NavLink>
			</p>
			<p className="entrant-bet">{bet.amountBet}</p>
			<p className="entrant-result">{bet.result}</p>
		</li>
	);
};

export default UserBet;
