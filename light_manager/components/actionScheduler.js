const moment = require('moment')
 			, debug = require('debug')("app:component:actionScheduler")
			,	debugTime = require('debug')("app:component:actionScheduler:time")


function actionScheduler(cfg, peopleTracker, lightManager, heaterManager){

	this.checkCycleDuration = 10; // 60; // In seconds
	this.peopleTracker = peopleTracker;
	this.lightManager = lightManager;
	this.heaterManager = heaterManager;
	this.wasNightOnLastCheck = false;
	this.dayTimeStarts = [7, 0, 0];
	this.dayTimeEnds = [17, 0, 0];
	this.config = cfg

	this.homeIsAlone = -1

	this.getStatus = function(){
		return {};
	}

	this.movementWasDetected = function(data){
		var homeStatus = this.peopleTracker.getHomeStatus();
		debug("eventHandler movementWasDetected", data);
	}

	this.personMovementHasBeenDetected = function(data){
		debug("eventHandler Person has been detected", data);

		if(this.isHomeAlone() == false){
			return ;
		}

		let nodemailer = require('nodemailer');
		let smtpTransport = require('nodemailer-smtp-transport');
		let transporter = nodemailer.createTransport(smtpTransport(cfg.email.smtp));
		let message = {
			from: cfg.email.fromFields,
			to:  cfg.email.whoToContact
		};


		debug("eventHandler movementWasDetected", data);
		try {
			name = data.name;
		} catch (exception){
			name = "(Unknown)";
		}

		message.subject = (this.config.type == 'production' ? "" : "[Dev: " +  this.config.env + '] ') + "Alert: A PERSON has been detected in " + name;
		message.text = message.subject;
		message.html = message.subject;

		transporter.sendMail(message, function(err, info){
			debug("Mail sent");
		})
	}

	this.getTimeWhenLightsGoOff = function(){
		return moment().hour(0).minute(30).seconds(0);
	}

	this.setHomeStatusFromEvent = function(message){
		let homeIsAlone = !message.body.presence.anyoneAtHome

		if(this.homeIsAlone == homeIsAlone){
			debug("setHomeStatusFromEvent: no change from ", this.homeIsAlone)
			return
		}

		this.homeIsAlone = homeIsAlone
		if(this.homeIsAlone){
			this.whenEverybodyLeaves();
			return
		}

		this.whenSomeoneGetsBack()

	}


	this.isHomeAlone = function() {
		let newStatus = this.peopleTracker.isHomeAlone();
		debug("Changing from",this.homeIsAlone,"to", newStatus, "?")
		if(this.homeIsAlone != newStatus){
			debug("Change done. ",this.homeIsAlone," >> ", newStatus)
			this.homeIsAlone = newStatus;

			if(newStatus === true){
				// Call action to do when the last person leaves
				this.whenEverybodyLeaves();
			} else if(newStatus === false) {
				// Call action to do when someone is the 1st person getting back
				this.whenSomeoneGetsBack()
			} else {
				debug("Status", newStatus, "is Unknown");
			}

			return this.homeIsAlone
		}
		debug("No change done")
		return this.homeIsAlone;
	}

	this.whenEverybodyLeaves = function(){
		// Update lights according to the time.
		debug("Do the HOME ALONE thing");
		this.homeAloneLightSceneBasedOnTime()
		// Bring heaters back to 19
	}

	this.whenSomeoneGetsBack = function(){
		// Update lights according to the time.
		debug("Do the WELCOME HOME thing");
		this.someoneIsBackLightSceneBasedOnTime()
		// Bring heaters back to 19
	}




	this.homeAloneLightSceneBasedOnTime = function(){

			if(this.isDayTime()){
				// Ligths should be officeLamp
				debugTime("During day, lights off.")
				this.lightManager.useScene("allLightsOff");
				return ;
			}

			var now = moment();
			var dayTimeEnds = moment().hour(this.dayTimeEnds[0]).minute(this.dayTimeEnds[1]).seconds(this.dayTimeEnds[2]);
			var timeWhenLightsGoOff = this.getTimeWhenLightsGoOff();

			if(timeWhenLightsGoOff.isAfter(dayTimeEnds)){
				if(now.isAfter(dayTimeEnds) && now.isBefore(timeWhenLightsGoOff)){
					debugTime("Night case 1 #1. Lights should be ON now. ");
					this.lightManager.useScene("homeIsAloneAtNight");
				}
				return

			} else {
				if(now.isAfter(dayTimeEnds) || now.isBefore(timeWhenLightsGoOff)){
					// We're facing the night time now
					debugTime("Night case 2 #2. Lights should be ON now. ");
					this.lightManager.useScene("homeIsAloneAtNight");
				}
			}

			debugTime("Lights will be turned OFF.");
			this.lightManager.useScene("homeIsAloneAtNight");

	}

	this.someoneIsBackLightSceneBasedOnTime = function(){

				if(this.isDayTime()){
					// Ligths should be officeLamp
					debugTime("During day, keep lights as they are.")
					return ;
				}

				debugTime("Set the welcome home scene.");
				this.lightManager.useScene("welcomeHomeLow");
		}


	this.runActionBasedOnPresenceStatus = function(message){
		debug("Message:", message);
		return this.setHomeStatusFromEvent(message)

	}

	this.runActionBasedOnDayOrNightStatus = function(current){
		if(!this.homeIsAlone){
			return ;
		}
		this.homeAloneLightSceneBasedOnTime();
	}


	this.runActionBasedOnHomeStatus = function(){}




	this.verifyIfNightStartedOrEnded = function(){
		// If the status did not change, do nothing
		var isNightNow = this.isNightTime();
		if(this.wasNightOnLastCheck === isNightNow){
			// debug("Night Status did not change. Return.")
			return ;
		}

		this.wasNightOnLastCheck = isNightNow;

		if(this.isDayTime()){
			this.app.internalEventEmitter.emit("time:isDayOrNight", { day: true, night: false });
		} else {
			this.app.internalEventEmitter.emit("time:isDayOrNight", { day: false, night: true });
		}

	}


	/*******************************

	********** TIME METHODS START ***

	***/

	this.isNightTime = function(){

		debug(moment().locale());
		var dayTimeStarts = moment().hour(this.dayTimeStarts[0]).minute(this.dayTimeStarts[1]).seconds(this.dayTimeStarts[2] - 5);
		var dayTimeEnds = moment().hour(this.dayTimeEnds[0]).minute(this.dayTimeEnds[1]).seconds(this.dayTimeEnds[2] + 5);
		var now = moment()

		if(now.isAfter(dayTimeStarts) && now.isBefore(dayTimeEnds)){
			debugTime("After Day Starts and before day ends, is HomeAlone", this.isHomeAlone());
			return false;
		}

		// debugTime("Is NightTime, is HomeAlone", this.isHomeAlone());
		return true;
	}

	this.isDayTime  = function(){
		return !this.isNightTime();
	}




	/**

	********** TIME METHODS STOP  ***

	********************************/



	this.start = function(app){
		debug("Starting ActionScheduler instance")
		if(this.app != undefined){
			return this;
		}
		this.app = app;

		this.app.internalEventEmitter.on("home:presence:statusChange", this.runActionBasedOnPresenceStatus.bind(this));
		this.app.internalEventEmitter.on("time:isDayOrNight", this.runActionBasedOnDayOrNightStatus.bind(this))


		setInterval(this.verifyIfNightStartedOrEnded.bind(this), 2000);

		this.app.internalEventEmitter.emit("componentStarted", "actionScheduler");
		debug("enabled");
		return this;
	}

}

module.exports = actionScheduler;
