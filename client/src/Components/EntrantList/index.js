import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "./style.scss";

import WatchSVG from "../WatchSVG";

class EntrantList extends Component {
	state = {
		style: {
			height: 5 * this.props.height + "vh",
			overflow: "auto",
		},
		selectedEntrant: {},
		entrantsLoaded: false,
	};

	componentDidMount() {
		this.changeSelectedEntrant(
			this.props.stream.race.entrants[
				Object.keys(this.props.stream.race.entrants)[0]
			]
		);
	}

	changeSelectedEntrant = entrantObj => {
		axios
			.get(`/api/getUser?username=${entrantObj.name}`, {
				withCredentials: true,
			})
			.then(user => {
				this.setState({
					selectedEntrant: user.data.user,
					entrantsLoaded: true,
				});
			});
	};

	render() {
		let race = this.props.stream.race;
		//creates map-friendly strings for searching within the mapped data
		let editedGameTitle = race.gameTitle.replace(/\W/g, " ").toLowerCase();
		let editedGoal = race.goal.replace(/\W/g, " ").toLowerCase();
		if (editedGoal.includes("randomizer") || editedGoal.includes("seed")) {
			editedGoal = "randomizer";
		}
		return (
			<div className="entrant-container">
				<div id="entrant-list" style={this.state.style}>
					{Object.keys(this.props.stream.race.entrants).map(
						entrantName => {
							let entrant = this.props.stream.race.entrants[
								entrantName
							];
							return (
								<div
									key={entrant.name}
									className={
										this.state.selectedEntrant.srlName ===
										entrant.name
											? "entrant-tile selected-entrant"
											: "entrant-tile"
									}
									onClick={() =>
										this.changeSelectedEntrant(entrant)
									}>
									<div className="grid-top-left">
										<h3>{entrant.name}</h3>
									</div>
									<div className="grid-bottom-left">
										{entrant.place < 9000
											? entrant.place
											: ""}
									</div>
									<div className="grid-center">
										<WatchSVG
											twitch={entrant.twitch !== ""}
											entrantTwitch={entrant.twitch}
											changeStream={
												this.props.changeStream
											}
											streamUsers={
												this.props.stream.users
											}
										/>
									</div>
									<div className="grid-top-right">
										<span>{entrant.payRatio} : 1</span>
										<svg
											viewBox="0 0 32 32"
											xmlns="http://www.w3.org/2000/svg"
											style={{
												fill: "none",
												strokeLinejoin: "round",
												strokeWidth: "2px",
											}}>
											<defs />
											<title />
											<g
												data-name="219-Dice"
												id="_219-Dice">
												<rect
													height="30"
													width="30"
													x="1"
													y="1"
												/>
												<circle cx="16" cy="16" r="2" />
												<circle cx="24" cy="8" r="2" />
												<circle cx="24" cy="24" r="2" />
												<circle cx="8" cy="8" r="2" />
												<circle cx="8" cy="24" r="2" />
											</g>
										</svg>
									</div>
									<div className="grid-bottom-right">
										<span>{entrant.betTotal}</span>
										<svg
											id="Layer_1"
											version="1.1"
											viewBox="0 0 30 30"
											xmlns="http://www.w3.org/2000/svg">
											<path d="M15,3C8.373,3,3,8.373,3,15c0,6.627,5.373,12,12,12s12-5.373,12-12C27,8.373,21.627,3,15,3z M16,20.857V23h-2v-2.137  c-2.13-0.284-3.471-1.523-3.546-3.359h2.281c0.109,0.914,1.031,1.5,2.359,1.5c1.227,0,2.094-0.594,2.094-1.445  c0-0.719-0.562-1.133-1.945-1.43l-1.469-0.312c-2.055-0.43-3.062-1.5-3.062-3.219c0-1.83,1.274-3.116,3.288-3.439V7h2v2.156  c1.956,0.317,3.276,1.584,3.337,3.317h-2.219c-0.109-0.891-0.938-1.484-2.078-1.484c-1.18,0-1.961,0.547-1.961,1.406  c0,0.695,0.539,1.094,1.859,1.375l1.359,0.289c2.266,0.477,3.242,1.453,3.242,3.203C19.54,19.244,18.214,20.554,16,20.857z" />
										</svg>
									</div>
								</div>
							);
						}
					)}
				</div>
				{this.state.entrantsLoaded &&
				this.state.selectedEntrant.gameHistory[editedGameTitle] ? (
					<div id="entrant-info">
						<NavLink
							to={`/user/${this.state.selectedEntrant.srlName}`}>
							<h1>{this.state.selectedEntrant.srlName}</h1>
						</NavLink>
						<ul>
							{this.state.selectedEntrant.twitchUsername ===
							"" ? (
								<li>
									{this.state.selectedEntrant.twitchUsername}
								</li>
							) : null}
							<li>
								Overall Win Rate:{" "}
								{this.state.selectedEntrant.raceRatio * 100 +
									"%"}
							</li>
							<li>
								Win rate for this category:{" "}
								{this.state.selectedEntrant.gameHistory[
									editedGameTitle
								].categories[editedGoal].winRatio *
									100 +
									"%"}
							</li>
							<li>
								Wins for this category:{" "}
								{
									this.state.selectedEntrant.gameHistory[
										editedGameTitle
									].categories[editedGoal].numWins
								}
							</li>
							<li>
								Average time:{" "}
								{this.state.selectedEntrant.gameHistory[
									editedGameTitle
								].categories[editedGoal].avgTime === 0
									? "User has no race history in this category"
									: this.props.convertRunTime(
											this.state.selectedEntrant
												.gameHistory[editedGameTitle]
												.categories[editedGoal].avgTime
									  )}
							</li>
							<li>
								Best time:{" "}
								{this.state.selectedEntrant.gameHistory[
									editedGameTitle
								].categories[editedGoal].bestTime === 0
									? "User has no race history in this category"
									: this.props.convertRunTime(
											this.state.selectedEntrant
												.gameHistory[editedGameTitle]
												.categories[editedGoal].bestTime
									  )}
							</li>
						</ul>
					</div>
				) : null}
			</div>
		);
	}
}

export default EntrantList;
