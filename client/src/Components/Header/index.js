import React from "react";
import { NavLink } from "react-router-dom";
import "./style.scss";

const Header = props => {
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
					<a href={props.twitchAuthPath}>Log In With Twitch</a>
				</li>
				<li>
					<button onClick={props.twitchLogout}>
						Log Out With Twitch
					</button>
				</li>
			</nav>
		</header>
	);
};

export default Header;
