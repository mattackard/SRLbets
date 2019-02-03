import React from "react";
import "./style.scss";

const Header = props => {
	return (
		<header>
			<a href="http://localhost:3000">
				<h1>SRL Bets</h1>
			</a>
			<nav>
				<li>
					<a href="http://localhost:3000">Home</a>
				</li>
				<li>
					<a href="http://localhost:3000/profile">My Profile</a>
				</li>
				<li>
					<a href="http://localhost:3000/makeBet">Make a Bet</a>
				</li>
				<li>
					<a href="http://localhost:3000/recent">
						Recently Finished Races
					</a>
				</li>
				<li>
					<a href="http://localhost:3000/twitchLogin">
						Log In with Twitch
					</a>
				</li>
				<li>
					<a href="http://localhost:3000/twitchLogout">
						Log Out with Twtich
					</a>
				</li>
			</nav>
		</header>
	);
};

export default Header;
