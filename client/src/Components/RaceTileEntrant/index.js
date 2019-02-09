import React from "react";
import "./style.scss";

const RaceTileEntrant = ({ entrant }) => {
	return (
		<div>
			<button className="entrant-dropdown">{entrant.name} &#9660;</button>
			<ul className="race-entrant">
				<li>Name: {entrant.name}</li>
				<li>Total Points Bet: {entrant.betTotal}</li>
				<li>Race Status: {entrant.status}</li>
				{entrant.status === "Finished" ? (
					<React.Fragment>
						<li>Finished in Position: {entrant.place}</li>
						<li>Time: {entrant.time}</li>
					</React.Fragment>
				) : null}
				{entrant.twitch ? (
					<li>
						Twitch Username:
						<a
							href={`https://twitch.tv/${entrant.twitch}`}
							target="_blank"
							rel="noopener noreferrer">{` twitch.tv/${
							entrant.twitch
						}`}</a>
					</li>
				) : null}
			</ul>
		</div>
	);
};

export default RaceTileEntrant;
