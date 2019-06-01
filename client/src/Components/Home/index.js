import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import queryString from "query-string";
import "./style.scss";

//component imports
import RaceTile from "../RaceTile";
import Loading from "../Loading";
import StreamPlayer from "../StreamPlayer";
import FollowingRaces from "../FollowingRaces";

class Home extends Component {
	state = {
		minimizeOpen: true,
		minimizeOngoing: true,
		minimizeFinished: true,
		gotStreams: false,
	};

	componentDidMount() {
		const parsed = queryString.parse(this.props.location.search);
		if (Object.keys(parsed).length) {
			this.props.twitchLogin(parsed.code, parsed.state);
			//redirects to home to remove query string
			this.props.history.push("/");
		}
		if (this.props.races.ongoing.length) {
			this.props.getStreams(2).then(() => {
				this.setState({ gotStreams: true });
			});
		}
	}

	componentDidUpdate() {
		if (this.props.races.ongoing.length && !this.props.stream.race) {
			this.props.getStreams(2).then(() => {
				this.setState({ gotStreams: true });
			});
		}
	}

	render() {
		return (
			<div id="main-content">
				{this.state.gotStreams ? (
					<StreamPlayer
						stream={this.props.stream}
						changeStream={this.props.changeStream}
						convertRunTime={this.props.convertRunTime}
					/>
				) : null}
				{this.props.loggedIn &&
				this.props.user.following &&
				this.props.races.finished.length ? (
					<FollowingRaces
						races={this.props.races}
						user={this.props.user}
					/>
				) : null}
				<h1>Currently Open Races</h1>
				<div className="race-list">
					{this.props.races.finished.length ? (
						this.props.races.open.map(data => (
							<RaceTile
								key={data._id}
								race={data}
								getDataFromDb={this.props.getDataFromDb}
							/>
						))
					) : (
						<Loading />
					)}
				</div>
				<h1>Ongoing Races</h1>
				<div className="race-list">
					{this.props.races.finished.length ? (
						this.props.races.ongoing.map(data => (
							<RaceTile
								key={data._id}
								race={data}
								getDataFromDb={this.props.getDataFromDb}
							/>
						))
					) : (
						<Loading />
					)}
				</div>
				<h1>Recently Finished Races</h1>

				<div className="race-list">
					{this.props.races.finished.length ? (
						this.props.races.finished.map(data => (
							<RaceTile
								key={data._id}
								race={data}
								getDataFromDb={this.props.getDataFromDb}
							/>
						))
					) : (
						<Loading />
					)}
				</div>
			</div>
		);
	}
}

export default withRouter(Home);
