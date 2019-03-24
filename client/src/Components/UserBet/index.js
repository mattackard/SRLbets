import React from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

const UserBet = props => {
	const { bet } = props;
	return (
		<li class="user-bet">
			<p className="entrant-name">
				<NavLink to={`/user/${bet.entrant}`}>{bet.entrant}</NavLink>
			</p>
			<p className="entrant-bet">{bet.amountBet}</p>
			<p className="entrant-result">{bet.result}</p>
		</li>
	);
};

export default UserBet;
