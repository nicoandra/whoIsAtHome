"use strict"
var dgram = require('dgram');

function ReceiverSocket(params){
    this.client = dgram.createSocket('udp4');
    this.buffer = [];
    this.port = params.port;
    this.delayBetweenCommands = params.delayBetweenCommands;
    this.repeat = params.repeat;	// NOT USED AS OF NOW
    this.host = params.host;
    this.CLOSE_BYTE = 0x55;
    var self = this;

    this.queueStuff = function(stuff){
        stuff = JSON.parse(JSON.stringify(stuff));
        stuff.push(this.CLOSE_BYTE);

        this.buffer.push(stuff);
        this.buffer.push(stuff);
    }

    this.sendQueuedStuff = function(){
        var queueSize = self.buffer.length;

        if(queueSize == 0){
            setTimeout(self.sendQueuedStuff.bind(self), 0);
            return false;
        }

        var toSend = self.buffer.shift();

        if(toSend.length > 3){
            /*
             Some commands are better to be sent together; notably the "light on" command and any of the colors or
             disco mode. The reason is that in order to set a light on disco mode, for example, the light that will be
             affected needs to be identified first. The way to identify the lights is by sending an "on" command.

             But, if 2 setColor are sent at the same time for different lights, the end result can be the opposite; light A will take the color intended to
             be for B, and light B will take the color intended for light A.

             Because of this, some commands need to be sent together */

            var buffer1 = [toSend[0],toSend[1], toSend[2]];
            var buffer2 = [toSend[3],toSend[4], toSend[5]];

            buffer1 = new Buffer(buffer1.concat(), 'hex');
            buffer2 = new Buffer(buffer2.concat(), 'hex');

            this.client.send(
                buffer1, 0, buffer1.length, this.port,
                this.host,
                function(err){
                    setTimeout(function(){
                        this.client.send(
                            buffer2, 0, buffer2.length, this.port,
                            self.host,
                            function(err){
                                // calls itself again
                                setTimeout(this.sendQueuedStuff.bind(this), this.delayBetweenCommands);
                            }.bind(this)
                        )}.bind(this), this.delayBetweenCommands);
                }.bind(this)
            );

        } else {

            /** This is a short command of 3 datagrams; it's OK to send standalone */

            var buffer = new Buffer(toSend.concat(), 'hex');
            // console.log('sending: ', buffer);

            this.client.send(
                buffer, 0, buffer.length, self.port,
                this.host,
                function(err){
                    // calls itself again
                    setTimeout(self.sendQueuedStuff.bind(this), this.delayBetweenCommands); 
                }.bind(this)
            );
        }
    }

    this.getQueueSize = function(){
        return this.buffer.length;
    }

    // Start sending queued messages. The function will call itself in the queue
    setTimeout(this.sendQueuedStuff.bind(self), this.delayBetweenCommands);
}

module.exports = ReceiverSocket;