import React, { Component } from "react";
import "./style.scss";

//component imports
import Race from "../Race";

class Home extends Component {
	render() {
		return (
			<div>
				<h1>Currently Open Races</h1>
				{this.props.races.open.map(data => (
					<Race key={data._id} race={data} />
				))}
				<h1>Ongoing Races</h1>
				{this.props.races.ongoing.map(data => (
					<Race key={data._id} race={data} />
				))}
				<h1>Recently Finished Races</h1>
				{this.props.races.finished.map(data => (
					<Race key={data._id} race={data} />
				))}
			</div>
		);
	}
}

export default Home;
