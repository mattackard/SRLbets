const expect = require('chai').expect;
const parseMessage = require('../irc.js').parseMessage;

describe('IRC TESTS', () => {

  describe('parseMessage', () => {

    let testMessage
    beforeEach(() => {
      testMessage = { prefix: 'Trueskill61094!Mibbit@58DE7B47.B2F30159.BE07DCBF.IP',
        nick: 'Trueskill61094',
        user: 'Mibbit',
        host: '58DE7B47.B2F30159.BE07DCBF.IP',
        command: 'PRIVMSG',
        rawCommand: 'PRIVMSG',
        commandType: 'normal',
        args: [ '#betti', '.startrace sm64' ]
      };
    });

    it('should throw an error when the message object is empty', () => {
      let emptyObj = {};
      let badFn = () => { parseMessage(emptyObj); };
      expect(badFn).to.throw('Message object cannot be empty');
    });

    it('should throw an error when the message object is not formatted correctly', () => {
      let badObj = {
        foo: 'bar',
        hello: 'world'
      };
      let badFn = () => { parseMessage(badObj); };
      expect(badFn).to.throw('Message object is missing necessary keys');
    });

    it('should return false for messages without bot commands', () => {
      testMessage.args[1] = 'Hello World';
      expect(parseMessage(testMessage)).to.be.false;
    });

    it('should return an object', () => {
      expect(parseMessage(testMessage)).to.be.an('object');
    });

    it('should correctly return the channel the message was sent to', () => {
      expect(parseMessage(testMessage).channel).to.equal('#betti');
    });

    it('should correctly return the message-sender\'s nick', () => {
      expect(parseMessage(testMessage).nick).to.equal('Trueskill61094');
    });

    it('should correctly return the irc command being used', () => {
      expect(parseMessage(testMessage).command).to.equal('.startrace');
    });

    it('should correctly return the irc command\'s arguments', () => {
      expect(parseMessage(testMessage).args).to.deep.equal(['sm64']);
    });

  });

});
