import React from "react";
import "./style.scss";

const UserBet = props => {
	const { bet } = props;
	return (
		<li>
			<p className="entrant-name">{bet.entrant}</p>
			<p className="entrant-bet">{bet.amountBet}</p>
			<p className="entrant-result">{bet.result}</p>
		</li>
	);
};

export default UserBet;
