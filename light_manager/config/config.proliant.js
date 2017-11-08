var config = require('./config.global');

config.type = "production"
config.env = 'proliant';
config.httpHost = '192.168.1.106';
config.httpPort = '3999';


config.milight = [{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 25, repeat: 5 }];



config.peopleTracker = {
	locative: { host: "127.0.0.1" , port: 58972 },
	usernames: ["nico"],
	defaultStatus : { nico : "away" }
}

module.exports = config;
