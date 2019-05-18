import React, { Component } from "react";
import "./style.scss";
import axios from "axios";
import Loading from "../Loading";
import StreamPlayer from "../StreamPlayer";

class RacePage extends Component {
	state = {
		race: {},
		raceID: this.props.match.params.raceID,
	};

	componentDidMount() {
		//gets race from db by id
		axios
			.get("/api/getRace", {
				withCredentials: true,
				params: {
					raceID: this.state.raceID,
				},
			})
			.then(res => {
				this.setState({
					race: res.data.race,
				});
				this.props.getStreams(2, res.data.race);
			});
	}

	render() {
		return (
			<div id="race-page">
				{Object.keys(this.state.race).length ? (
					<React.Fragment>
						{this.props.stream.race ? (
							<StreamPlayer stream={this.props.stream} />
						) : null}
						<h1>{this.state.race.gameTitle}</h1>
						<h2>{this.state.race.goal}</h2>
						<ul>
							<li>{`Race started on ${
								this.state.race.simpleTime
							}`}</li>
							<li>{this.state.race.status}</li>
							<li>{`${
								Object.keys(this.state.race.entrants).length
							} entrants`}</li>
						</ul>
					</React.Fragment>
				) : (
					<Loading />
				)}
			</div>
		);
	}
}

export default RacePage;
