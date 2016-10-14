var config = require('./config.global');

config.env = 'mindgeek';
config.httpHost = '192.168.1.106';
config.httpPort = '3999';


config.milight = [{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 10 }];

module.exports = config;
