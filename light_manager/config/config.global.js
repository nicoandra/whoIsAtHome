var config = module.exports = {};

config.httpHost = '192.168.1.112';
config.httpPort = '3999';

config.milight = [{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 10 }];

config.email = require("./restricted/mail.js");
config.secrets = require("./restricted/secrets.js");

config.peopleTracker = {
	defaultStatus : { nico : "away" }
}

config.mqtt = {
	dsn : 'mqtt://192.168.0.106'
}