import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import queryString from "query-string";
import "./style.scss";

//component imports
import RaceTile from "../RaceTile";
import Loading from "../Loading";

class Home extends Component {
	state = {
		minimizeOpen: true,
		minimizeOngoing: true,
		minimizeFinished: true,
	};

	componentDidMount() {
		const parsed = queryString.parse(this.props.location.search);
		if (Object.keys(parsed).length) {
			this.props.twitchLogin(parsed.code, parsed.state);
			//redirects to home to remove query string
			this.props.history.push("/");
		}
	}
	render() {
		return (
			<div id="main-content">
				<h1>Currently Open Races</h1>
				<div className="race-list">
					{this.props.races.finished.length ? null : <Loading />}
					{this.props.races.open.map(data => (
						<RaceTile
							key={data._id}
							race={data}
							getDataFromDb={this.props.getDataFromDb}
						/>
					))}
				</div>
				<h1>Ongoing Races</h1>
				<div className="race-list">
					{this.props.races.finished.length ? null : <Loading />}
					{this.props.races.ongoing.map(data => (
						<RaceTile
							key={data._id}
							race={data}
							getDataFromDb={this.props.getDataFromDb}
						/>
					))}
				</div>
				<h1>Recently Finished Races</h1>

				<div className="race-list">
					{this.props.races.finished.length ? null : <Loading />}
					{this.props.races.finished.map(data => (
						<RaceTile
							key={data._id}
							race={data}
							getDataFromDb={this.props.getDataFromDb}
						/>
					))}
				</div>
			</div>
		);
	}
}

export default withRouter(Home);
