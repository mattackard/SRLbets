import React, { Component } from "react";
import axios from "axios";
import { Route, Switch } from "react-router-dom"; //withRouter?
import "./style.scss";

//component imports
import Header from "../Header";
import Footer from "../Footer";
import Home from "../Home";

class App extends Component {
	// initialize our state
	state = {
		races: {
			open: [],
			ongoing: [],
			finished: [],
		},
		user: {},
		data: [],
		id: 0,
		message: null,
		intervalIsSet: false,
		idToDelete: null,
		idToUpdate: null,
		objectToUpdate: null,
	};

	// when component mounts, first thing it does is fetch all existing data in our db
	// then we incorporate a polling logic so that we can easily see if our db has
	// changed and implement those changes into our UI
	componentDidMount() {
		this.getDataFromDb();
		if (!this.state.intervalIsSet) {
			let interval = setInterval(this.getDataFromDb, 10000);
			this.setState({ intervalIsSet: interval });
		}
	}

	// never let a process live forever
	// always kill a process everytime we are done using it
	componentWillUnmount() {
		if (this.state.intervalIsSet) {
			clearInterval(this.state.intervalIsSet);
			this.setState({ intervalIsSet: null });
		}
	}

	// just a note, here, in the front end, we use the id key of our data object
	// in order to identify which we want to Update or delete.
	// for our back end, we use the object id assigned by MongoDB to modify
	// data base entries

	//gets open,ongoing,finished races from db
	getDataFromDb = () => {
		fetch("http://localhost:3001/api/getRaces")
			.then(data => data.json())
			.then(res =>
				this.setState({
					races: res.races,
				})
			);
	};

	// our put method that uses our backend api
	// to create new query into our data base
	putDataToDB = message => {
		let currentIds = this.state.data.map(data => data.id);
		let idToBeAdded = 0;
		while (currentIds.includes(idToBeAdded)) {
			++idToBeAdded;
		}

		axios.post("http://localhost:3001/api/putData", {
			id: idToBeAdded,
			message: message,
		});
	};

	// our delete method that uses our backend api
	// to remove existing database information
	deleteFromDB = idTodelete => {
		let objIdToDelete = null;
		this.state.data.forEach(dat => {
			if (dat.id === idTodelete) {
				objIdToDelete = dat._id;
			}
		});

		axios.delete("http://localhost:3001/api/deleteData", {
			data: {
				id: objIdToDelete,
			},
		});
	};

	// our update method that uses our backend api
	// to overwrite existing data base information
	updateDB = (idToUpdate, updateToApply) => {
		let objIdToUpdate = null;
		this.state.data.forEach(dat => {
			if (dat.id === idToUpdate) {
				objIdToUpdate = dat._id;
			}
		});

		axios.post("http://localhost:3001/api/updateData", {
			id: objIdToUpdate,
			update: { message: updateToApply },
		});
	};

	// here is our UI
	// it is easy to understand their functions when you
	// see them render into our screen
	render() {
		return (
			<div>
				<Header />
				<Switch>
					<Route
						exact
						path="/"
						render={props => (
							<Home {...props} races={this.state.races} />
						)}
					/>
				</Switch>
				<Footer />
			</div>
		);
	}
}

export default App;
