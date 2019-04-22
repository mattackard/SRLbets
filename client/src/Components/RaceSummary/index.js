import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

class RaceSummary extends Component {
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

	getPlace = place => {
		if (place < 1000) {
			return this.addPositionSuffix(place);
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
					<p>{convertRunTime(race.time)}</p>
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
