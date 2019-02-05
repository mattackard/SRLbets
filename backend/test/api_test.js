const expect = require("chai").expect;
const validateApiResponse = require("../apiProcessing")
	.validateApiResponse;

describe("API RESPONSE TESTING", () => {
	describe("validateApiResponse", () => {
		it("should throw an error no response is given", () => {
			let badFn = () => {
				validateApiResponse();
			};
			expect(badFn).to.throw();
		});

		it("should throw an error when the response is not an object", () => {
			let badFn = () => {
				validateApiResponse("Hello World");
			};
			let badFn2 = () => {
				validateApiResponse(1337);
			};
			expect(badFn).to.throw(
				"The response from the API was not an object, or it was empty"
			);
			expect(badFn2).to.throw(
				"The response from the API was not an object, or it was empty"
			);
		});

		it("should throw an error when the response is empty", () => {
			let badFn = () => {
				validateApiResponse({});
			};
			expect(badFn).to.throw(
				"The response from the API was not an object, or it was empty"
			);
		});
	});
});
