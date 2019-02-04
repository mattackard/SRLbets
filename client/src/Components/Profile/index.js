import React from "react";
import "./style.scss";

const Profile = props => {
	return (
		<div>
			<h1>User Profile</h1>
			{Object.keys(props.user).length ? (
				<p>user is logged in: {props.twitchUsername}</p>
			) : (
				<p>User is not logged in</p>
			)}
		</div>
	);
};

export default Profile;
