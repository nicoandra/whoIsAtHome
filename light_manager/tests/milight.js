var led = require('limitless-gem/index.js');



var con = led.createSocket({ host: '192.168.1.148' });

[
    led.RGBW.ALL_OFF,
    led.RGBW.GROUP1_ON,
    led.RGBW.GROUP2_ON,
    /*led.RGBW.SET_COLOR_TO_VIOLET,
    led.RGBW.SET_COLOR_TO_ROYAL_MINT,
    led.RGBW.SET_COLOR_TO_YELLOW,
    led.RGBW.SET_COLOR_TO_PINK,*/
    led.RGBW.ALL_NIGHT,
    /*led.RGBW.GROUP2_SET_TO_WHITE,
    led.RGBW.GROUP3_SET_TO_WHITE,
    led.RGBW.GROUP4_SET_TO_WHITE,
    led.RGBW.GROUP3_NIGHT,
    led.RGBW.GROUP1_NIGHT,
    led.RGBW.GROUP2_NIGHT,
    led.RGBW.GROUP4_NIGHT*/
        [0xC1, 0x00],
      //  [0xC6, 0x00]
        // [0xC8, 0x00],
        // [0xCA, 0x00],
        // [0xCC, 0x00],

].forEach(function (cmd, index) {
   setTimeout(function () {
       con.send(cmd);
   }, index * 750);
});
