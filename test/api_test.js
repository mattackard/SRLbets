const expect = require("chai").expect;
const race = require("../js/race");

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
						place: 1,
						time: -3,
						message: "",
						statetext: "Finished",
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
						place: 2,
						time: -3,
						message: "",
						statetext: "Finished",
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
						place: 4,
						time: -3,
						message: "",
						statetext: "Finished",
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
						status: "Finished",
						place: 1,
						time: "Race in progress",
						twitch: "marco",
						betTotal: 0,
					},
					Amateseru: {
						name: "Amateseru",
						status: "Finished",
						place: 2,
						time: "Race in progress",
						twitch: "Amateseru",
						betTotal: 0,
					},
					Xiosris54: {
						name: "Xiosris54",
						status: "Finished",
						place: 4,
						time: "Race in progress",
						twitch: "xiosris54",
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
					Glitchymon: {
						name: "Glitchymon",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "glitchymon",
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
			expect(race.createEntrantObj(testRace)).to.be.a("promise");
		});
		it("the promise should contain a map", () => {
			const myFunc = async () => {
				let myMap = await race.createEntrantObj(testRace);
				return myMap;
			};
			myFunc().then(map => {
				expect(map).to.be.a("map");
				expect(map.get("Marco")).to.not.throw;
			});
		});
		it("the map should be the same size as the input object's entrant array", () => {
			const myFunc = async () => {
				let myMap = await race.createEntrantObj(testRace);
				return myMap;
			};

			expect(myFunc().size).to.equal(testRace.entrants.length);
		});
	});
	describe("sortEntrants", () => {
		let testMap, expectedMap;
		beforeEach(() => {
			testMap = new Map([
				[
					"Nephistoss",
					{
						name: "Nephistoss",
						status: "Forfeit",
						place: 9998,
						time: "Forfeit",
						twitch: "nephisstos",
						betTotal: 0,
					},
				],
				[
					"Xiosris54",
					{
						name: "Xiosris54",
						status: "Finished",
						place: 4,
						time: "Race in progress",
						twitch: "xiosris54",
						betTotal: 0,
					},
				],
				[
					"Marco",
					{
						name: "Marco",
						status: "Finished",
						place: 1,
						time: "Race in progress",
						twitch: "marco",
						betTotal: 0,
					},
				],
				[
					"Glitchymon",
					{
						name: "Glitchymon",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "glitchymon",
						betTotal: 0,
					},
				],
				[
					"Amateseru",
					{
						name: "Amateseru",
						status: "Finished",
						place: 2,
						time: "Race in progress",
						twitch: "Amateseru",
						betTotal: 0,
					},
				],
				[
					"Bonooruu",
					{
						name: "Bonooruu",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "Bonooru_",
						betTotal: 100,
					},
				],
				[
					"Lorelia1",
					{
						name: "Lorelia1",
						status: "Forfeit",
						place: 9998,
						time: "Forfeit",
						twitch: "lorelia1",
						betTotal: 0,
					},
				],
			]);
			expectedMap = new Map([
				[
					"Marco",
					{
						name: "Marco",
						status: "Finished",
						place: 1,
						time: "Race in progress",
						twitch: "marco",
						betTotal: 0,
					},
				],
				[
					"Amateseru",
					{
						name: "Amateseru",
						status: "Finished",
						place: 2,
						time: "Race in progress",
						twitch: "Amateseru",
						betTotal: 0,
					},
				],
				[
					"Xiosris54",
					{
						name: "Xiosris54",
						status: "Finished",
						place: 4,
						time: "Race in progress",
						twitch: "xiosris54",
						betTotal: 0,
					},
				],
				[
					"Bonooruu",
					{
						name: "Bonooruu",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "Bonooru_",
						betTotal: 100,
					},
				],
				[
					"Glitchymon",
					{
						name: "Glitchymon",
						status: "Ready",
						place: 9994,
						time: "Race in progress",
						twitch: "glitchymon",
						betTotal: 0,
					},
				],
				[
					"Nephistoss",
					{
						name: "Nephistoss",
						status: "Forfeit",
						place: 9998,
						time: "Forfeit",
						twitch: "nephisstos",
						betTotal: 0,
					},
				],
				[
					"Lorelia1",
					{
						name: "Lorelia1",
						status: "Forfeit",
						place: 9998,
						time: "Forfeit",
						twitch: "lorelia1",
						betTotal: 0,
					},
				],
			]);
		});
		it("should return a promise", () => {
			expect(race.sortEntrants(testMap)).to.be.a("promise");
		});
		it("should return a map", () => {
			race.sortEntrants(testMap).then(data => {
				expect(data).to.be.a("map");
				expect(data.get("Marco")).to.not.throw;
			});
		});
		it("the returned map should be the same size as the input map", () => {
			race.sortEntrants(testMap).then(data => {
				expect(data.size).to.equal(expectedMap.size);
			});
		});
		it("the returned map should be sorted by finish position", () => {
			race.sortEntrants(testMap).then(data => {
				expect([...data]).to.deep.equal([...expectedMap]);
			});
		});
	});
});
