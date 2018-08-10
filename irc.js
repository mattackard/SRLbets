
function ircConnect() {

  const irc = require('irc');
  const ircPass = 'iamabot';
  const ircNick = 'Betti';
  const ircChannel = '#betti';          //use #betti for testing to prevent main channel join spam


  //node-irc setup
  let client = new irc.Client('irc.speedrunslive.com', ircNick, {
      userName: ircNick,
      realName: 'Betti the Bot of SRLBets',
      debug: false,
      showErrors: true,
      autoRejoin: false,
      autoConnect: false
  });

  client.addListener('registered', () => {
    client.join(ircChannel);
    client.say('nickserv', `identify ${ircPass}`);
  });

  client.addListener('message', (nick, to, text, message) => {
    console.dir(message);
  });

  client.addListener('error', (message) => {
    console.error(`Error: ${message.command}`);
  });




  client.connect();   //keep as last line in setup function
}

function parseMessage(message) {

  if (Object.keys(message).length === 0) {
    throw new Error('Message object cannot be empty');
  }
  if (!message.nick || !message.args) {
    throw new Error('Message object is missing necessary keys');
  }
  if (message.args[1].trim()[0] !== '.') {    // if the first non-space character of the text isn't .
    return false;
  }

  let parsedData = {                //builds a simpler message object from the original irc message object
    channel: message.args[0],
    nick: message.nick,
    command: '',
    args: []
  };

  let splitText = message.args[1].trim().split(' ');

  parsedData.command = splitText[0];          //command is first word (must start with a . ex: .race)

  parsedData.args = splitText.slice(1);       //all text after the first word is added to an array pass as
                                              //function arguments on the command called
  return parsedData;
}

module.exports.ircConnect = ircConnect;
module.exports.parseMessage = parseMessage;
