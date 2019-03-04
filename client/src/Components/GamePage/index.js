import React, { Component } from "react";
import "./style.scss";
import axios from "axios";
import RaceSummary from "../RaceSummary";
import Loading from "../Loading";

class GamePage extends Component {
	state = {
		races: [],
		gameTitle: this.props.match.params.gameTitle,
	};

	componentDidMount() {
		//get entries from race db that have the same game title
		axios
			.get("/api/getGameSummary", {
				withCredentials: true,
				params: {
					gameTitle: this.state.gameTitle,
				},
			})
			.then(res => {
				this.setState({
					races: res.data.game,
				});
			});
	}

	render() {
		return (
			<div>
				<h1>{this.state.gameTitle} Race Page</h1>
				{this.state.races.length < 1 ||
				this.state.game === "no game found" ? (
					<Loading />
				) : (
					//show race history for game
					<div>
						{this.state.races.map(race => (
							<RaceSummary key={race.raceID} race={race} />
						))}
					</div>
				)}
			</div>
		);
	}
}

export default GamePage;
