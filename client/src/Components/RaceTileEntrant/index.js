import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

//component imports
import InlineBet from "../InlineBet";

class RaceTileEntrant extends Component {
	state = {
		entrantDetails: false,
	};

	addPositionSuffix = num => {
		if (num !== 11 && num % 10 === 1) {
			return `${num}st`;
		}
		if (num !== 12 && num % 10 === 2) {
			return `${num}nd`;
		}
		if (num !== 13 && num % 10 === 3) {
			return `${num}rd`;
		}
		return `${num}th`;
	};

	toggleEntrantDetails = () => {
		this.setState({
			entrantDetails: !this.state.entrantDetails,
		});
	};

	render() {
		let { entrant, raceStatus, raceID, getDataFromDb } = this.props;

		return (
			<div id="entrant-tile">
				<ul className="race-entrant">
					<li>
						<NavLink to={`/user/${entrant.name}`}>
							{entrant.name}
						</NavLink>
					</li>
					<li>{entrant.betTotal}</li>

					{entrant.status === "Finished" ? (
						<React.Fragment>
							<li className={entrant.status}>
								Finished {this.addPositionSuffix(entrant.place)}
							</li>
							<li>{entrant.time}</li>
						</React.Fragment>
					) : (
						<li className={entrant.status}>
							{entrant.status === "Ready" &&
							raceStatus === "In Progress"
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
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 128 134">
									<title>Twitch Stream Link</title>
									<path
										d="M89,77l-9,23v94h32v17h18l17-17h26l35-35V77H89Zm107,76-20,20H144l-17,17V173H100V89h96v64Zm-20-41v35H164V112h12Zm-32,0v35H132V112h12Z"
										transform="translate(-80 -77)"
									/>
								</svg>
							</a>
						</li>
					) : null}
					{raceStatus === "Entry Open" ||
					raceStatus === "Entry Closed" ? (
						<button
							className="entrant-dropdown"
							onClick={() => this.toggleEntrantDetails()}>
							&#9660;
						</button>
					) : null}
				</ul>
				{this.state.entrantDetails ? (
					<InlineBet
						entrant={entrant}
						raceID={raceID}
						getDataFromDb={getDataFromDb}
					/>
				) : null}
			</div>
		);
	}
}

export default RaceTileEntrant;
