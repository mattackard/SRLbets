import React from "react";
import "./style.scss";

const UserPage = ({ match }) => {
	return <div>User page for {match.params.username}</div>;
};

export default UserPage;
