import React, { Component } from "react";
import * as d3 from "d3";
import "./style.scss";

class PieChart extends Component {
	componentDidMount() {
		// set the dimensions and margins of the graph
		const size = window.innerWidth / 5;
		const margin = 10;

		// the radius of the pie is half the size
		var radius = size / 2 - margin;

		// append the svg object to the div
		var svg = d3
			.select("#pie-chart")
			.append("svg")
			.attr("width", size)
			.attr("height", size)
			.append("g")
			.attr("transform", "translate(" + size / 2 + "," + size / 2 + ")");

		var data = this.props.values;

		let colorRange = () => {
			let colors = [];
			this.props.values.forEach(() => {
				//creates a random color for each chart value
				colors.push(
					"#" +
						(0x1000000 + Math.random() * 0xffffff)
							.toString(16)
							.substr(1, 6)
				);
			});
			return colors;
		};

		// set the color scale
		var color = d3
			.scaleOrdinal()
			.domain(data)
			.range(colorRange());

		// compute the position of each group on the pie:
		var pie = d3.pie().value(function(d) {
			return d.value;
		});
		var data_ready = pie(d3.entries(data));

		// build the pie chart: basically, each part of the pie is a path that we build using the arc function.
		svg.selectAll("svg")
			.data(data_ready)
			.enter()
			.append("path")
			.attr(
				"d",
				d3
					.arc()
					.innerRadius(size / 4)
					.outerRadius(radius)
			)
			.attr("fill", function(d) {
				return color(d.data.key);
			})
			.attr("stroke", "black")
			.style("stroke-width", "2px")
			.style("opacity", 0.7);
	}

	render() {
		return (
			<div id="pie-chart">
				<h1>Race Bets</h1>
				<p>Total: {this.props.values.reduce((a, b) => a + b)}</p>
			</div>
		);
	}
}

export default PieChart;
