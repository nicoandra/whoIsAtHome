var config = require('./config.global');

config.env = 'mindgeek';
config.httpHost = '192.168.149.128';
config.httpPort = '3999';
config.milight = [{host : 'ct5130.myfoscam.org' , port : 8899, delayBetweenCommands : 80 }];

module.exports = config;
