serialport = require("serialport").SerialPort;

var portName = '/dev/ttyAMA0'; //This is the standard Raspberry Pi Serial port

var readData = ''; //Array to hold the values read in from the port

var sp = new serialport(portName, {
  baudRate: 9600,
  dataBits: 8,
  parity: 'none',
  stopBits: 1,
  flowControl: false
});


var stripLength = 6;
buff = new Buffer(3*stripLength*100);

while(true){
        for(i = 0; i < 256; i++){

                for(pos = 0; pos < stripLength; pos++){
                        w = i;
                        w = Math.round(Math.random());
                        w = 255;
                        
                        actualPos = pos * 3;
                        console.log("write ", w, " in ", actualPos);
                        
                        buff.writeUInt8(w, actualPos++);
                        console.log("write ", w, " in ", actualPos);
                        buff.writeUInt8(w, actualPos++);
                        console.log("write ", w, " in ", actualPos);
                        buff.writeUInt8(w, actualPos++);
                }
        }
        sp.write(buff, function (err, bytesWritten) {
                console.log('bytes written:', bytesWritten);
                buff.fill(0);
        }); 
}
