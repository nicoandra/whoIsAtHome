
function HeaterLight(name, displayName, heater){
	// Parameters
	this.name = name;
	this.displayName = displayName;
	this.heater = heater;

	// Status tracking
	this.actualStatus = {};  // Shows the actual status

	this.hasRgb = function(hasRgb){
		this.abilities.hasRgb = (hasRgb === true)
		return this;
	}

	this.hasDimmer = function(hasDimmer){
		return true;
	}

	this.getStatus = function(){
		return {
			'name' : this.name,
			'displayName' : this.displayName,
			'actualStatus' : this.actualStatus,
			'status' : this.actualStatus,
			'autoStatus' : this.autoStatus,
			'manualStatus' : this.manualStatus
		}
	}

	this.getInterfaceOptions = function(){

		var resultOptions =  [
			{
				displayName : "On / Off",
				type : "switch",
				options : [
					{ displayName : "On", status: { onOff : true } },
					{ displayName : "Off", status: { onOff : false } },
				]
			}
		]

		if(this.hasDimmer()){
			resultOptions.push({
				displayName : "Dim",
				name : 'dim',
				type : "slider",
				status : function(){
					return this.value;
				}
			})
		}

		return resultOptions;
	  
	}


	this.setManualStatus = function(status, callback){

		console.log("Setting status as", status);

		callback = (typeof callback === 'function') ? callback : function() {};

		if(status.onOff != undefined && this.actualStatus.onOff != status.onOff){
			status.brightness = status.onOff ? 100 : 0;
		}

		if(status.brightness != undefined){
			this.actualStatus.brightness = status.brightness;
			this.setBrightness(status.brightness);
		}

		callback;
	}


	this.setBrightnessMax = function(){
		this.heater.sendRawPayload([0x20, 0, 0x03, 0xFF]);
		this.actualStatus.onOff = true;
		this.brightness = 1023;
	}

	this.setBrightnessMin = function(){
		this.brightness = 1;
		this.heater.sendRawPayload([0x20, 0, 0x00, this.brightness]);
	}

	this.setBrightness = function(value){

		value = Math.max(0, Math.min(value, 100));	// Sanitize the value to be in the range 0-100;
		rangedValue = 1023 * value / 100;	// Convert value in range 0-1023 as the PWM needs

		this.brightness = value

		this.actualStatus.onOff = this.brightness != 0;
		this.heater.sendRawPayload([0x20, 0, parseInt(rangedValue / 256), rangedValue % 256]);
	}

}

module.exports = HeaterLight;