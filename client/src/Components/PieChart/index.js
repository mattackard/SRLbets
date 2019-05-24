import React from "react";
import * as d3 from "d3";

const PieChart = props => {
	let pie = d3.pie()(props.values);
	return (
		<div>
			<p>pie chart goes here</p>
			{props.values.map(value => {
				return <p>{value}</p>;
			})}
		</div>
	);
};

export default PieChart;
