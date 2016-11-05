var config = require('./config.global');

config.env = 'mindgeek';
config.httpHost = '127.0.0.1';
config.httpHost = '127.0.0.1';
config.httpPort = '3999';

config.milight = [{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 50 }];

module.exports = config;
