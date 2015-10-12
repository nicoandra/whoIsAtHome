
	var sendBrightnessChangeCommand = function(a, b){

		console.log(a,b);
		return ;

		lampName = lampName.replace(/([A-Z])/g , function(match, l, offset){
			return " "+l.toLowerCase();
		});

		sendCommandString(lampName + ' brightness ' + brightnessToRequest);
	}

	// Handle timeouts for the 3 RGB sliders. It waits 1 sec before making the actual HTTP request.
	// This is to avoid flooding the queue with numbers as the slider changes values
	// It will wait for 1 sec without changes before posting the request
	var RGBChangeTimeout = -1;
	var RGBChange = function(){
		r = allRoomsColorRSlider.getValue();
		g = allRoomsColorGSlider.getValue();
		b = allRoomsColorBSlider.getValue();
		$('#allRoomsColorRow').css('background', 'rgb('+r+','+g+','+b+')');

		if(RGBChangeTimeout > 0){
			clearTimeout(RGBChangeTimeout);
		}

		RGBChangeTimeout = setTimeout(function(){
			sendCommandString("all lights "+r+" "+g+" "+b, getStatus);
		}, 1000);

	}


	// Bind the OnChangeEvent
	allRoomsColorRSlider.on('change', RGBChange);
	allRoomsColorGSlider.on('change', RGBChange);
	allRoomsColorBSlider.on('change', RGBChange);

	function updateInterfaceWithStatusObject(response){
		if(response.lights){
			Object.keys(response.lights).forEach(function(name, index){

				$("div.panel."+name+" div.panel-body button.btn.btn-primary").removeClass('btn-primary').addClass('btn-default');
				$("div.panel."+name+" div.panel-body button.btn.btn-primary").removeClass('btn-primary').addClass('btn-default');

				$('#'+name+'BrightnessSlider').slider().slider('setValue', Math.min(10, Math.max(0, parseInt(response.lights[name].brightness)) / 10 )).data('slider').on('change', sendBrightnessChangeCommand);

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
			
		}
	}



	/** Ajax request to query the system status and update the UI **/
	function getStatus(){
		sendCommandString("getStatus", function(res, status, statusName){
			if(status != 'success'){
				showWarning("Call didn't work...");
				return ;
			}
			res = jQuery.parseJSON(res);
			updateInterfaceWithStatusObject(res);

		});
	}





	/** Setting UI Intervals to refresh status and plotData **/
	setInterval(getStatus, 5000);
	setInterval(requestPlotData, 60000);




/**
Sends a command and executes the callback, if specified.
**/
function sendCommandString(command, cb){
	$.get('/commands/', { command :  command}, cb);	

	if(typeof cb != 'function'){
		getStatus();
	}
}



function requestPlotData(){
	$.get('/plot/json', generatePlot);
}

function generatePlot(res, status, statusName){

	if(status != 'success'){
		showWarning("Call didn't work...");
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
