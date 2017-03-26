var config = require('./config.global');

config.env = 'nickpad';
config.httpHost = '127.0.0.1';
config.httpHost = '192.168.1.112';

// config.httpHost = '127.0.0.1';

config.httpPort = '3999';

config.milight = [
	{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 25, repeat: 2 }
];

config.peopleTracker = {
	defaultStatus : { nico : "atHome" }
}

module.exports = config;
