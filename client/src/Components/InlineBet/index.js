import React, { Component } from "react";
import axios from "axios";

import "./style.scss";

class InlineBet extends Component {
	state = {
		betAmount: "",
		formError: "",
	};
	submitBet = e => {
		e.preventDefault();
		if (/\D/.test(this.state.betAmount)) {
			this.setState({
				formError: "Bet amount must be a number",
			});
		} else {
			axios
				.post(
					"http://localhost:3001/api/makeBet",
					{
						entrant: this.props.entrant.name,
						raceID: this.props.raceID,
						betAmount: this.state.betAmount,
					},
					{
						withCredentials: true,
					}
				)
				.then(res => {
					if (res.data !== "success") {
						this.setState({
							formError: res.data,
						});
					} else {
						this.props.getDataFromDb();
					}
				});
			this.setState({
				betAmount: "",
				formError: "",
			});
		}
	};
	updateText = e => {
		let error = "";
		if (/\D/.test(this.state.betAmount)) {
			error = "Bet amount must be a number";
		}
		this.setState({
			betAmount: e.target.value,
			formError: error,
		});
	};

	render() {
		return (
			<form className="inline-bet-form" onSubmit={this.submitBet}>
				{this.state.formError ? <p>{this.state.formError}</p> : null}
				<input
					type="text"
					onChange={this.updateText}
					value={this.state.betAmount}
					placeholder="Enter amount to bet"
				/>
				<button type="submit">Bet</button>
			</form>
		);
	}
}

export default InlineBet;
