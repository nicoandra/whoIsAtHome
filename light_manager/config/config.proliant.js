var config = require('./config.global');

config.env = 'proliant';
config.httpHost = '192.168.1.106';
config.httpPort = '3999';


config.milight = [{host : '192.168.1.148' , port : 8899, delayBetweenCommands : 50, repeat: 2  }];

module.exports = config;
