var sensor = require('node-dht-sensor');

setInterval(function(){

        sensor.read(22, 17, function(err, temperature, humidity) {
            if (!err) {
                console.log('temp: ' + temperature.toFixed(1) + '°C, ' +
                    'humidity: ' + humidity.toFixed(1) + '%'
                );
            }
        })
    },
    5000
);



