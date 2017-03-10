var plotly = require('../node_modules/plotly/index.js')('nicoandra','BBcIps5AYHoGW1umClsA');
 
var data = [{x:[new Date()], y:[Math.round(Math.random() * 100)], type: 'scatter', mode: 'lines+markers'}];
var graphOptions = {fileopt : "extend", filename : "testPlot"};
 
plotly.plot(data, graphOptions, function (err, msg) {
    console.log(msg);
});