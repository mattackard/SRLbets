const expect = require("chai").expect;
const apiProcessing = require("../apiProcessing");

describe("API RESPONSE TESTING", () => {
	describe("createEntrantObj", () => {
		let testRace, testEntrants;
		beforeEach(() => {
			testRace = {
				id: "pui2c",
				game: {
					id: 3656,
					name: "The Legend of Zelda: Ocarina of Time Hacks",
					abbrev: "oothacks",
					popularity: 285.0,
					popularityrank: 5,
				},
				goal:
					"accessible rando https://ootrandomizer.com/seed/get?id=35843",
				time: 1550784241,
				state: 3,
				statetext: "In Progress",
				filename: "",
				numentrants: 7,
				entrants: {
					Marco: {
						displayname: "Marco",
						place: 9994,
						time: -3,
						message: "",
						statetext: "Ready",
						twitch: "marco",
						trueskill: "1423",
					},
					Bonooruu: {
						displayname: "Bonooruu",
						place: 9994,
						time: -3,
						message: "",
						statetext: "Ready",
						twitch: "Bonooru_",
						trueskill: "1285",
					},
					Amateseru: {
						displayname: "Amateseru",
						place: 9994,
						time: -3,
						message: "",
						statetext: "Ready",
						twitch: "Amateseru",
						trueskill: "1038",
					},
					Glitchymon: {
						displayname: "Glitchymon",
						place: 9994,
						time: -3,
						message: "",
						statetext: "Ready",
						twitch: "glitchymon",
						trueskill: "849",
					},
					Xiosris54: {
						displayname: "Xiosris54",
						place: 9994,
						time: -3,
						message: "",
						statetext: "Ready",
						twitch: "xiosris54",
						trueskill: "5",
					},
					Lorelia1: {
						displayname: "Lorelia1",
						place: 9998,
						time: -1,
						message: "",
						statetext: "Forfeit",
						twitch: "lorelia1",
						trueskill: "734",
					},
					Nephistoss: {
						displayname: "Nephistoss",
						place: 9998,
						time: -1,
						message: "",
						statetext: "Forfeit",
						twitch: "nephisstos",
						trueskill: "0",
					},
				},
			};
			testEntrants = new Map(
				Object.entries({
					Marco: {
						name: "Marco",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "marco",
						betTotal: 0,
					},
					Bonooruu: {
						name: "Bonooruu",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "Bonooru_",
						betTotal: 0,
					},
					Amateseru: {
						name: "Amateseru",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "Amateseru",
						betTotal: 0,
					},
					Glitchymon: {
						name: "Glitchymon",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "glitchymon",
						betTotal: 0,
					},
					Xiosris54: {
						name: "Xiosris54",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "xiosris54",
						betTotal: 0,
					},
					Lorelia1: {
						name: "Lorelia1",
						status: "Forfeit",
						place: 9998,
						time: "Forfeit",
						twitch: "lorelia1",
						betTotal: 0,
					},
					Nephistoss: {
						name: "Nephistoss",
						status: "Forfeit",
						place: 9998,
						time: "Forfeit",
						twitch: "nephisstos",
						betTotal: 0,
					},
				})
			);
		});
		it("should return a promise", () => {
			expect(apiProcessing.createEntrantObj(testRace)).to.be.a("promise");
		});
		it("the promise should contain a map", () => {
			const myFunc = async () => {
				let myMap = await apiProcessing.createEntrantObj(testRace);
				return myMap;
			};
			expect(myFunc()).to.be.a("map");
		});
		it("the map should be the same size as the input object's entrant array", () => {
			const myFunc = async () => {
				let myMap = await apiProcessing.createEntrantObj(testRace);
				return myMap;
			};
			expect(myFunc().size).to.equal(testRace.entrants.length);
		});
	});
});
