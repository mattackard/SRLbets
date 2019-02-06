import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

import TwitchLogin from "../TwitchLogin";
import TwitchLogout from "../TwitchLogout";

class Header extends Component {
	render() {
		return (
			<header>
				<NavLink to="/">
					<h1>SRL Bets</h1>
				</NavLink>
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
							<TwitchLogout />
						) : (
							<TwitchLogin />
						)}
					</li>
				</nav>
			</header>
		);
	}
}

export default Header;
