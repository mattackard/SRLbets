import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import axios from "axios";
import "./style.scss";

import TwitchLogin from "../TwitchLogin";
import TwitchLogout from "../TwitchLogout";

class Header extends Component {
	state = {
		twitchUrl: "",
		showNav: false,
	};

	getLoginUrl = () => {
		axios
			.get("http://localhost:3001/api/twitchLoginUrl", {
				withCredentials: true,
			})
			.then(res => {
				this.setState({
					twitchUrl: res.data.twitchUrl,
				});
			});
	};

	toggleNav = () => {
		this.setState({
			showNav: !this.state.showNav,
		});
	};

	render() {
		return (
			<header id="page-header">
				<NavLink to="/">
					<h1 className="page-logo">SRL Bets</h1>
				</NavLink>
				<i
					className="fas fa-bars menu"
					onClick={() => this.toggleNav()}
				/>
				{this.state.showNav ? (
					<nav>
						<li>
							<NavLink to="/" activeClassName="activeLink">
								Home
							</NavLink>
						</li>
						<li>
							<NavLink to="/profile" activeClassName="activeLink">
								My Profile
							</NavLink>
						</li>
						<li>
							<NavLink to="/makeBet" activeClassName="activeLink">
								Make a Bet
							</NavLink>
						</li>
						<li>
							<NavLink to="/recent" activeClassName="activeLink">
								Recently Finished Races
							</NavLink>
						</li>
						<li>
							{Object.keys(this.props.user).length ? (
								<TwitchLogout
									clearUserState={this.props.clearUserState}
									getLoginUrl={this.getLoginUrl}
								/>
							) : (
								<TwitchLogin
									getLoginUrl={this.getLoginUrl}
									twitchUrl={this.state.twitchUrl}
								/>
							)}
						</li>
					</nav>
				) : null}
			</header>
		);
	}
}

export default Header;
