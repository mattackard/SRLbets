import React, { Component } from "react";

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
			<div>
				<p>yo here is some text</p>
				<p>{`twitch.tv/${this.state.stream1}`}</p>
				<p>{`twitch.tv/${this.state.stream2}`}</p>
			</div>
		);
	}
}

export default StreamVS;
