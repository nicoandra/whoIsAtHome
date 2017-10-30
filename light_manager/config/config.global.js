var config = module.exports = {};

config.httpHost = '192.168.1.112';
config.httpPort = '3999';

config.milight = [{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 10 }];

config.email = require("./restricted/mail.js");
config.secrets = require("./restricted/secrets.js");

config.peopleTracker = {
	locative: { host: "127.0.0.1" , port: 58972 },
	usernames: ["nico"],
	defaultStatus : { nico : "away" }
}

config.mqtt = {
	host: "192.168.1.106",
	port: 1883 ,
	keepalive: 10000
}
