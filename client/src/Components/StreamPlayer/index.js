import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

import EntrantList from "../EntrantList";
import PieChart from "../PieChart";

class StreamPlayer extends Component {
	state = {
		width: "0vw",
		height: "0vw",
	};

	componentDidMount() {
		//sets the height and width of each stream based on the number of streams showing
		//this calculation keeps a 16:9 aspect ratio
		this.setState({
			width: 90 / this.props.stream.users.length + "vw",
			height: 90 / this.props.stream.users.length / (16 / 9) + "vw",
		});
	}

	render() {
		let betArray = [];
		Object.keys(this.props.stream.race.entrants).forEach(entrant => {
			betArray.push(this.props.stream.race.entrants[entrant].betTotal);
		});
		return (
			<div id="streams">
				<div id="stream-container">
					{this.props.stream.users.map(userName => (
						<iframe
							key={userName}
							src={`https://player.twitch.tv/?channel=${userName}`}
							title={`${userName}'s livestream`}
							frameBorder="0"
							scrolling="no"
							style={{
								height: this.state.height,
								width: this.state.width,
							}}
							allowFullScreen={true}
						/>
					))}
				</div>
				<NavLink to={`/race/${this.props.stream.race.raceID}`}>
					<h2>{`${this.props.stream.race.gameTitle} - ${
						this.props.stream.race.goal
					}`}</h2>
				</NavLink>
				<div id="stream-info-panel">
					<EntrantList
						withScroll={true}
						height={7}
						stream={this.props.stream}
						changeStream={this.props.changeStream}
						convertRunTime={this.props.convertRunTime}
					/>
					<PieChart values={betArray} />
				</div>
			</div>
		);
	}
}

export default StreamPlayer;
