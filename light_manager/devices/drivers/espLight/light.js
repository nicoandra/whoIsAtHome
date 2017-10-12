
const manager = require(__dirname + '/../../../components/core/mqttDeviceManagement.js')


function Light(name, displayName, macAddress, channelNumber){
	// Parameters
	this.name = name;
	this.displayName = displayName;
	this.macAddress = macAddress;
	this.channelNumber = channelNumber;

	// Status tracking
	this.actualStatus = {};  // Shows the actual status
	this.autoStatus = {};    //
	this.manualStatus = {};    //

	this.status = 0;
	this.color = 'white';
	this.fadeInProgress = 0;
	this.currentProgram = '';
	this.brightness = 0;

	this.abilities = { hasRgb : false, hasDimmer : true };

	this.hasRgb = function(hasRgb){
		this.abilities.hasRgb = (hasRgb === true)
		return this;
	}

	this.hasDimmer = function(hasDimmer){
		this.abilities.hasDimmer = (hasDimmer === true)
		return this;
	}

	this.setManualStatus = function(status, callback){
		callback = (typeof callback === 'function') ? callback : function() {};

		if(status.onOff != undefined && this.actualStatus.onOff != status.onOff){
			this.actualStatus.onOff = status.onOff;
			this.sendOnOff(status.onOff);
		}

		if(status.brightness != undefined){
			this.actualStatus.brightness = status.brightness;
			this.setBrightness(status.brightness);
		}

		if(status.nightMode != undefined && status.nightMode == true){
			this.actualStatus.nightMode = status.nightMode;
			this.nightMode();
		}

		if(status.onOff != undefined && this.actualStatus.onOff != status.onOff){
			this.actualStatus.onOff = status.onOff;
			this.sendOnOff(status.onOff);
		}

		if(status.color != undefined){
			/*this.actualStatus.brightness = status.brightness;
			this.setBrightness(status.brightness);*/
			if(status.color == "white"){
				this.white();
			} else {
				this.setColor(status.color);
			}
		}

		if(status.onOff != undefined && this.actualStatus.onOff != status.onOff){
			this.actualStatus.onOff = status.onOff;
			this.sendOnOff(status.onOff);
		}

		callback;
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

		let resultOptions = {
            main: {
                displayName: "On / Off",
                type: "switch",
                options: [
                    {displayName: "On", status: {onOff: true}},
                    {displayName: "Off", status: {onOff: false}},
                ]
            }
        }

		if(this.abilities.hasRgb){
			resultOptions.rgb = {
				name : 'color',
				displayName : "Color", 
				type : "colorPicker",
				values : [
					{ name: "White", htmlColor : "White", id: 'white' },
                    { name: "Violet", htmlColor : '#975297' , id : 'violet'},
                    { name: "Royal Blue", htmlColor : '#4169e1', id : 'royalBlue'},
                    { name: "Blue", htmlColor : '#4169e1', id : 'blue'},
                    { name: "Light Blue", htmlColor : '#87ceeb', id : 'lightBlue'},
                    { name: "Aqua", htmlColor : '#00ffff' , id : 'aqua'},
                    { name: "Royal mint", htmlColor : '#8fff9f' , id : 'royalMint'},
                    { name: "Seafoam green", htmlColor : '#7af9ab' , id : 'seafoamGreen'},
                    { name: "Green", htmlColor : '#15b01a' , id : 'green'},
                    { name: "Lime green", htmlColor : '#89fe05' , id : 'limeGreen'},
                    { name: "Yellow", htmlColor : '#ffff14' , id : 'yellow'},
                    { name: "Yellow orange",  htmlColor : '#fcb001' , id : 'yellowOrange'},
                    { name: "Orange",  htmlColor : '#f97306' , id : 'orange'},
                    { name: "Red",  htmlColor : '#e50000' , id : 'red'},
                    { name: "Pink",  htmlColor : '#ff81c0' , id : 'pink'},
                    { name: "Fuchsia", htmlColor : '#ed0dd9' , id : 'fuchsia'},
                    { name: "Lilac",  htmlColor : '#cea2fd' , id : 'lilac'},
                    { name: "Lavender", htmlColor : '#c79fef' , id : 'lavender'}
				]
			}
		}

        if(this.abilities.hasDisco){
            resultOptions.disco = {
                name : 'disco',
                displayName : "Disco",
                values : [
                    { name: "Disco"		, id: 'disco' },
                    { name: "Next >"	,  id : 'discoNext'},
                    { name: "< Prev"	, id : 'discoPrev'},
                    { name: "+ Faster"	, id : 'discoFaster'},
                    { name: "- Slower"	, id : 'discoSlower'}
                ]
            }
        }

		if(this.abilities.hasDimmer){
			resultOptions.dimmer = {
				displayName : "Dim",
				name : 'dim',
				type : "slider",
				status : function(){
					return this.value;
				}
			}
		}

		return resultOptions;
	  
	}

	this.sendOnOff = function(value){
		if(value == true){
			this.queueOn();
		}

		if(value == false){
			this.queueOff();
		}
	}

	this.queueOn = function(){
		manager.setLightValue(this.macAddress, this.channelNumber, 1024);
	}

	this.queueOff = function(){
		manager.setLightValue(this.macAddress, this.channelNumber, 0);
	}

	this.on = function(){
		manager.setLightValue(this.macAddress, this.channelNumber, 1024);
		this.status = 1;
		this.actualStatus.onOff = true;
	}

	this.off = function(){
		manager.setLightValue(this.macAddress, this.channelNumber, 0);
		this.actualStatus.onOff = false;
		this.color = '';
	}

	this.white = function(){
		this.on();
	}

	this.setBrightnessMax = function(){
		this.on();
	}

	this.setBrightnessMin = function(){
		manager.setLightValue(this.macAddress, this.channelNumber, 1);
		this.brightness = 1;
		this.actualStatus.onOff = true;
		this.actualStatus.brightness = 10;
	}


	this.setBrightness = function(value){

		if(!Number.isInteger(value) || value < 0 || value > 100){
			return false;
		}

		let intensity = Math.round(value * 1024 / 100)
		manager.setLightValue(this.macAddress, this.channelNumber, intensity);
		this.brightness = value;
		this.actualStatus.onOff = true;
		this.actualStatus.brightness = this.brightness;
	}

	this.clearQueue = function() {
		return ;
	}
}


module.exports = Light;