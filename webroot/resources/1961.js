function setCommand(roomName, colorName){
	if(colorName != ''){
		jQuery('div.front'+	roomName).css('background-color', colorName);
		commandString = roomName+' '+colorName;
	} else {
		commandString = roomName;
	}

	jQuery('#command').val(commandString);
	doAjaxCall();
}

function listen(){
	var recognition = new webkitSpeechRecognition();
	recognition.lang = "en";
	recognition.onresult = function(event) { 
		recognition.stop();
		console.log(event.results[0]);
		command = event.results[0][0].transcript;
		jQuery('#command').val(command);
		// jQuery('#result').html("Sending command " + command);
		doAjaxCall();
		listen();
	}
	recognition.start();
}

function doAjaxCall(){
	jQuery.post('index.php', jQuery('#form').serialize(), function(data){
		result = jQuery('#result');
		result.text(data.message);

		if(data.status == 'OK'){
			result.addClass('bg-success').removeClass('bg-warning');
			commandText = jQuery("#command").val();
			add = true;
			jQuery('#commandHistory li:contains('+commandText+')').each(function() {
				if ($(this).text() === commandText) {
					add = false;
				}
			});

			if(add){
				jQuery('#commandHistory').prepend(
					$("<li>").text(commandText).click(function(){jQuery("#command").val(this.innerText); doAjaxCall(); })
				);
			}
		} else {
			result.addClass('bg-warning').removeClass('bg-success');
		}


		if(data.speech.length > 0 && $("#speech").prop("checked")){
			var msg = new SpeechSynthesisUtterance(data.speech);
			window.speechSynthesis.speak(msg);
		}

		updatePanel();
	});
}

jQuery(document).ready(function(){
	
	// Enable microphone 
	listen();

	// Remove iframes
	setTimeout(
		function(){
			// jQuery("#monitors").attr('src', "http://ct5130.myfoscam.org/index.php?view=montage&group=0");
			jQuery("#monitors").remove();
		}, 2);

	// Enable Sliders
	jQuery(".brightnessSlider").change(function(e,a){
		roomName = $(this).data().roomname;
		value = $(this).val();
		setCommand(roomName + " brightness " + value + ' percent', '');

		/*.attr('data-roomName');
		value = e.currentTarget.value;
		setCommand(roomName + " brighthness " + value + 'percent');
		console.log(e);*/
	});


	jQuery(".heaterSlider").change(function(e,a){
		roomName = $(this).data().roomname;
		value = $(this).val();
		jQuery('span.desiredTemp.'+roomName).text(value);
		setCommand(roomName + " " + value + ' degrees', '');
	});


	updatePanel();

	refresh=setInterval(function(){updatePanel();}, 5000);
});



function updatePanel(){
	jQuery.post('index.php', {'command' : 'getstatus'}, function(data){
		// response = data.response;
		console.log(data, data.response);
		// console.log('ererere');
		
		updateRoomBox('Kitchen', data.response.kitchen.color, data.response.kitchen.brightness);
		updateRoomBox('Office', data.response.office.color, data.response.office.brightness);
		updateRoomBox('Boards', data.response.boards.color, data.response.boards.brightness);

		cameraStatusText = data.response.zoneminder.status;
		if(data.response.zoneminder.status+'-Hash' != data.response.zoneminder.newStatus){
			cameraStatusText += ' (Switching to '+data.response.zoneminder.newStatus+')';
		}
		jQuery('.cameraStatus').text(cameraStatusText);
		
	
	});

}

function updateRoomBox(roomName, colorName, brightness){
	// console.log('me llamo con nom' + roomName + ' color ' + colorName + ' y brillo ' + brightness);
	jQuery('div.front'+	roomName).css('background-color', colorName);
	jQuery('div.roomOptions.'+roomName+' a.littleColorBox').css('border','none').css('margin', '3px');
	jQuery('div.roomOptions.'+roomName+' a.littleColorBox.box'+colorName).css('border', '3px solid white').css('margin','none');
	console.log('div.roomOptions.'+roomName+' a.littleColorBox.box'+colorName);
	jQuery('#brightness'+roomName).val(brightness);
}
