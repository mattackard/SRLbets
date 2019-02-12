import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import queryString from "query-string";
import "./style.scss";

//component imports
import RaceTile from "../RaceTile";

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
			<div>
				<h1>Currently Open Races</h1>
				{this.props.races.open.map(data => (
					<RaceTile key={data._id} race={data} />
				))}
				<h1>Ongoing Races</h1>
				{this.props.races.ongoing.map(data => (
					<RaceTile key={data._id} race={data} />
				))}
				<h1>Recently Finished Races</h1>
				{this.props.races.finished.map(data => (
					<RaceTile key={data._id} race={data} />
				))}
			</div>
		);
	}
}

export default withRouter(Home);
