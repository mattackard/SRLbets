import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

class RaceSummary extends Component {
	getPlace = place => {
		if (place < 1000) {
			return place;
		} else if (place === 9998) {
			return "Forfeit";
		} else {
			return "Race In Progress";
		}
	};

	render() {
		const { race, simplifyDate, convertRunTime } = this.props;
		return (
			<li className="race-summary">
				<p>{simplifyDate(race.date)}</p>
				<NavLink to={`/game/${race.game}`}>
					<p>{race.game}</p>
				</NavLink>
				<p>{race.goal}</p>
				<p>{this.getPlace(race.place)}</p>
				{race.time > 0 ? (
					<p>Finish time: {convertRunTime(race.time)}</p>
				) : race.time === -1 ? (
					<p>Forfeit</p>
				) : (
					<p>Race In Progress</p>
				)}
			</li>
		);
	}
}

export default RaceSummary;
