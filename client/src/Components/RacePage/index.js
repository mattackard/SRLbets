import React, { Component } from "react";
import "./style.scss";
import axios from "axios";
import Loading from "../Loading";
import StreamPlayer from "../StreamPlayer";

class RacePage extends Component {
	state = {
		race: {},
		raceID: this.props.match.params.raceID,
		gotStreams: false,
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
				this.props.getStreams(2, res.data.race).then(() => {
					this.setState({
						race: res.data.race,
						gotStreams: true,
					});
				});
			});
	}

	render() {
		return (
			<div id="race-page">
				{Object.keys(this.state.race).length ? (
					<React.Fragment>
						{this.props.stream.race ? (
							<StreamPlayer
								stream={this.props.stream}
								changeStream={this.props.changeStream}
								convertRunTime={this.props.convertRunTime}
							/>
						) : null}
					</React.Fragment>
				) : (
					<Loading />
				)}
			</div>
		);
	}
}

export default RacePage;
