const expect = require('chai').expect;

describe('SANITY CHECKS', () => {

  describe('Chai integration', () => {
    it('chai can run a test from a file in the test folder', () => {
      expect(true).to.be.ok;
    });
  });

});
