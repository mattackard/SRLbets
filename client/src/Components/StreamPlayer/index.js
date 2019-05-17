import React, { Component } from "react";
import "./style.scss";

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
		return (
			<div id="streams">
				<h2>{`${this.props.stream.race.gameTitle} - ${
					this.props.stream.race.goal
				}`}</h2>
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
			</div>
		);
	}
}

export default StreamPlayer;
