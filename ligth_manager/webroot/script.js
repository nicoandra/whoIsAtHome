

var socketConfig = {host : '', port : ''};

function sendBrightnessChangeCommand(lampName, b){
	lampName = lampName.replace(/([A-Z])/g , function(match, l, offset){
		return " "+l.toLowerCase();
	});
	sendCommandString(lampName + " " + b.value);
}



function changeRgbWheels(){

}


/**
Sends a command and executes the callback, if specified.
**/
function sendCommandString(commands, cb){

	var socket = io.connect('http://'+socketConfig.host+':'+socketConfig.port);

	// commands = "office boards off";

	if(!Array.isArray(commands)){
		arr = new Array;
		arr.push(commands);
		commands = arr;
	}

	socket.emit('sendCommand', commands);
}


function requestPlotData(){
	$.get('/plot/json', generatePlot);
}

function generatePlot(res, status, statusName){

	if(status != 'success'){
		console.log("Call didn't work...", res,status, statusName);
		return ;
	}	
	res = jQuery.parseJSON(res);

	var plotObject = {
		title : {
			text: 'Temp sensor and heaters'
		},
		subtitle: {
			text: 'HomePwn'
		},
		series: []
	}


	Object.keys(res).forEach(function(cityName, index){
		plotObject.series.push({'name': cityName, data : []});

		res[cityName].forEach(function(temp){
			plotObject.series[index].data.push(temp);
		})

	});

	$('#plotContainer').highcharts(plotObject);
}

/** Ajax request to query the system status and update the UI **/
function getStatus(){
	$.get('/commands/', { command :  "getStatus"}, function(res, status, statusName){
		if(status != 'success'){
			console.log("Call didn't work...", res,status, statusName);
			return ;
		}
		res = jQuery.parseJSON(res);
		updateInterfaceWithStatusObject(res);
	});
}


function updateInterfaceWithStatusObject(response){
	if(response.lights){
		Object.keys(response.lights).forEach(function(name, index){

			$("div.panel."+name+" div.panel-body button.btn.btn-primary").removeClass('btn-primary').addClass('btn-default');
			$("div.panel."+name+" div.panel-body button.btn.btn-primary").removeClass('btn-primary').addClass('btn-default');

			$("#"+name+"BrightnessSlider").roundSlider({value : response.lights[name].brightness });

			if(	Array.isArray(response.lights[name].color) == false || response.lights[name].status == 0 ) {
				if(response.lights[name].status){
					matchString = response.lights[name].color;
				} else {
					matchString = 'off';
				}

				matchString = "div.panel."+name+" div.panel-body button.btn.btn"+matchString;
				$(matchString).addClass('btn-primary');
			}
		});
	}

	if(response.system){
		if(response.system.queueSize){
			$("div.panel.system dl.dl-horizontal dd#globalQueueSize").text(response.system.queueSize.join(", "));
		}

		if(response.system.delayBetweenCommands){
			$("div.panel.system dl.dl-horizontal dd#delayBetweenCommands").text(response.system.delayBetweenCommands);
		}


        if(socketConfig.host == '') {
            socketConfig = response.system.socketInfo;
        }
    }
		

}

$(document).ready(function(){

	if(false){
		/** Setting UI Intervals to refresh status and plotData **/
		setInterval(getStatus, 5000);
		getStatus();
		setInterval(requestPlotData, 60000);
		requestPlotData();
	}

	if('ontouchstart' in window){
		setInterval(getStatus, 2000);
	}

    getStatus();
    initializeSocket();
});


    function initializeSocket() {
        var socket = io.connect('http://'+socketConfig.host+':'+socketConfig.port);

        socket.on('statusUpdate', function (data) {
            updateInterfaceWithStatusObject(data);
        });
    }

	function listen(){
		var recognition = new webkitSpeechRecognition();
		recognition.lang = "en";
		recognition.onresult = function(event) { 
			recognition.stop();
			console.log(event.results[0]);
			command = event.results[0][0].transcript;
			sendCommandString(command);
		}
		recognition.start();
	}


