import React from "react";
import "./style.scss";

const UserBet = props => {
	const { bet } = props;
	return (
		<li>
			{bet.entrant} {bet.amountBet} {bet.result}
		</li>
	);
};

export default UserBet;
