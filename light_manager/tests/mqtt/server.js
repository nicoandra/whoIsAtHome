const env = process.env.NODE_ENV || 'development'
        , cfg = require(__dirname + '/../../config/config.'+env+'.js')
        , debug = require('debug')("server")
        , moment = require('moment')
	, Brk = require(__dirname + '/../../components/core/mqtt.js')


cfg.mqtt.dsn = { host: "192.168.1.106", port: 1883 , keepalive: 10000 }
// cfg.mqtt.dsn.host = "test.mosquitto.org"
const broker = Brk(cfg);


