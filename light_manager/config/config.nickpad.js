var config = require('./config.global');

config.type = "development"
config.env = 'nickpad';
config.httpHost = '127.0.0.1';
config.httpHost = '192.168.1.250';

// config.httpHost = '127.0.0.1';

config.httpPort = '3999';

config.milight = [
	{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 25, repeat: 2 }
];

config.peopleTracker = {
	locative: { host: "127.0.0.1" , port: 58972 },
	usernames: ["nico"],

	defaultStatus : { nico : "atHome" }
}

module.exports = config;
