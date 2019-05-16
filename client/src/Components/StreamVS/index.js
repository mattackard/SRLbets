import React, { Component } from "react";
import "./style.scss";

class StreamVS extends Component {
	state = {
		stream1: "",
		stream2: "",
	};
	componentDidMount() {
		let streams = this.props.getStreams();
		console.log(streams);
		this.setState({
			stream1: streams[0],
			stream2: streams[1],
		});
	}
	render() {
		return (
			<div id="stream-container">
				<iframe
					src={`https://player.twitch.tv/?channel=${
						this.state.stream1
					}`}
					title={`${this.state.stream1}'s livestream`}
					frameBorder="0"
					scrolling="no"
					allowFullScreen={true}
				/>
				<iframe
					src={`https://player.twitch.tv/?channel=${
						this.state.stream2
					}`}
					title={`${this.state.stream2}'s livestream`}
					frameBorder="0"
					scrolling="no"
					allowFullScreen={true}
				/>
			</div>
		);
	}
}

export default StreamVS;
