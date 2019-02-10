import React from "react";
import "./style.scss";

const RaceTileEntrant = ({ entrant, raceStatus }) => {
	return (
		<ul className="race-entrant">
			<li>{entrant.name}</li>
			<li>{entrant.betTotal || 0}</li>

			{entrant.status === "Finished" ? (
				<React.Fragment>
					<li className={entrant.status}>
						Finished {entrant.place}th
					</li>
					<li>{entrant.time}</li>
				</React.Fragment>
			) : (
				<li className={entrant.status}>
					{entrant.status === "Ready" && raceStatus === "In Progress"
						? "In Race"
						: entrant.status}
				</li>
			)}
			{entrant.twitch ? (
				<li>
					<a
						href={`https://twitch.tv/${entrant.twitch}`}
						target="_blank"
						rel="noopener noreferrer">
						<svg
							className="twitch-svg"
							id="Layer_1"
							data-name="Layer 1"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 128 134">
							<title>Glitch</title>
							<path
								d="M89,77l-9,23v94h32v17h18l17-17h26l35-35V77H89Zm107,76-20,20H144l-17,17V173H100V89h96v64Zm-20-41v35H164V112h12Zm-32,0v35H132V112h12Z"
								transform="translate(-80 -77)"
							/>
						</svg>
					</a>
				</li>
			) : null}
			<button className="entrant-dropdown">&#9660;</button>
		</ul>
	);
};

export default RaceTileEntrant;
