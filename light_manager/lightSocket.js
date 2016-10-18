var led = require('limitless-gem/index.js');

function LightSocket(name, group, receiver){
    this.name = name;
    this.group = group;
    this.receiver = receiver;

    this.colorCodes = {
        violet : [0x40, 0x00],
        royalBlue : [0x40, 0x10],
        blue : [0x40, 0x10],
        lightBlue : [0x40, 0x20],
        aqua : [0x40, 0x30],
        royalMint : [0x40, 0x40],
        seafoamGreen : [0x40, 0x50],
        green : [0x40, 0x60],
        limeGreen : [0x40, 0x70],
        yellow : [0x40, 0x80],
        yellowOrange : [0x40, 0x90],
        orange : [0x40, 0xa0],
        red : [0x40, 0xb0],
        pink : [0x40, 0xc0],
        fusia : [0x40, 0xd0],
        lilac : [0x40, 0xe0],
        lavendar : [0x40, 0xf0]
    };


    this.commandOn = led.RGBW['GROUP'+group+'_ON'];
    this.commandOff = led.RGBW['GROUP'+group+'_OFF'];
    this.commandWhite = led.RGBW['GROUP'+group+'_SET_TO_WHITE'];
    this.commandDisco = led.RGBW.DISCO_MODE;
    this.commandDiscoFaster = led.RGBW.DISCO_FASTER;
    this.commandDiscoSlower = led.RGBW.DISCO_SLOWER;

    this.commandBrightnessMax = led.RGBW.BRIGHTNESS_MAX;
    this.commandBrightnessMin = led.RGBW.BRIGHTNESS_MIN;

    this.on = function(cb){
        this.receiver.queueStuff(this.commandOn);
    }

    this.off = function(cb){
        this.receiver.queueStuff(this.commandOff);
    }

    this.white = function(cb){
        this.receiver.queueStuff(this.commandWhite);
        this.receiver.queueStuff(this.commandWhite);
    }

    this.disco = function(cb){
        this.receiver.queueStuff(this.commandOn.concat(0x55, this.commandDisco));
        cb;
    }

    this.discoFaster = function(cb){
        // Turn it on
        this.receiver.queueStuff(this.commandOn.concat(0x55, this.commandDiscoFaster));
    }

    this.discoSlower = function(cb){
        // Turn it on
        this.receiver.queueStuff(this.commandOn.concat(0x55, this.commandDiscoSlower));
    }

    this.setColor = function(colorName){
        if(Array.isArray(colorName)){
            colorCode = colorName;
        } else {
            colorCode = this.colorCodes[colorName];
        }

        this.receiver.queueStuff(this.commandOn.concat(this.receiver.CLOSE_BYTE, colorCode));
    }

    this.brightnessMax = function(){
        this.receiver.queueStuff(this.commandOn.concat(this.commandBrightnessMax));
    }

    this.brightnessMin = function(){
        this.receiver.queueStuff(this.commandOn.concat(this.commandBrightnessMin));
    }

    this.brightness = function(value){
        value = Math.round( 2+ ( (value/100) *25 ));

        this.receiver.queueStuff(this.commandOn.concat(0x55, 0x4e, value));


    }

    this.queueStuff = function(stuff){
        this.receiver.queueStuff(stuff);
    }

    this.sendStuff = function(){
        this.receiver.sendStuff();
    }
}

module.exports = LightSocket;