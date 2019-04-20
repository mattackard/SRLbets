import React, { Component } from "react";
import axios from "axios";
import "./style.scss";

//component imports
import BetHistory from "../BetHistory";
import RaceHistory from "../RaceHistory";
import Loading from "../Loading";

class UserPage extends Component {
	state = {
		user: {},
		username: this.props.match.params.username,
	};

	componentDidMount() {
		//get entries from race db that have the same game title
		axios
			.get("/api/getUser", {
				withCredentials: true,
				params: {
					username: this.state.username,
				},
			})
			.then(res => {
				this.setState({
					user: res.data.user,
				});
			});
	}

	render() {
		return (
			<div>
				{Object.keys(this.state.user) < 1 ||
				this.state.user === "no user" ? (
					<Loading />
				) : (
					<React.Fragment>
						<h1>
							{this.state.user.srlName ||
								this.state.user.twitchUserName}
						</h1>
						<h2>Bet Balance: {this.state.user.points}</h2>
						{this.state.user.twitchUserName ? (
							<li>
								{this.state.twitchUsername}
								<a
									href={`https://twitch.tv/${
										this.state.twitchUsername
									}`}
									target="_blank"
									rel="noopener noreferrer"
								>
									<svg
										className="twitch-svg"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 128 134"
									>
										<title>Twitch Stream Link</title>
										<path
											d="M89,77l-9,23v94h32v17h18l17-17h26l35-35V77H89Zm107,76-20,20H144l-17,17V173H100V89h96v64Zm-20-41v35H164V112h12Zm-32,0v35H132V112h12Z"
											transform="translate(-80 -77)"
										/>
									</svg>
								</a>
							</li>
						) : null}
						<div className="user-content">
							<BetHistory
								user={this.state.user}
								simplifyDate={this.props.simplifyDate}
								convertRunTime={this.props.convertRunTime}
							/>
							<RaceHistory
								user={this.state.user}
								simplifyDate={this.props.simplifyDate}
								convertRunTime={this.props.convertRunTime}
							/>
						</div>
					</React.Fragment>
				)}
			</div>
		);
	}
}

export default UserPage;
