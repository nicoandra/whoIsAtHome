var moment = require('moment');
const debug = require('debug')("app:component:actionScheduler");
const debugTime = require('debug')("app:component:actionScheduler:time");

function actionScheduler(cfg, peopleTracker, lightManager, heaterManager){

	this.checkCycleDuration = 10; // 60; // In seconds
	this.peopleTracker = peopleTracker;
	this.lightManager = lightManager;
	this.heaterManager = heaterManager;
	this.wasNightOnLastCheck = false;
	this.dayTimeStarts = [7, 0, 0];
	this.dayTimeEnds = [17, 0, 0];


	this.getStatus = function(){
		return {};
	}

	this.movementWasDetected = function(data){
		var homeStatus = this.peopleTracker.getHomeStatus();
		debug("eventHandler movementWasDetected", data);
		// @@TODO@@ PING THE PHONE TO SEE IF I'M BACK
	}


	this.personMovementHasBeenDetected = function(data){
		homeStatus = this.peopleTracker.getHomeStatus();
		debug("eventHandler Person has been detected", data);

		if(homeStatus.home.isAlone === false){
			return ;
		}

		var nodemailer = require('nodemailer');
		var smtpTransport = require('nodemailer-smtp-transport');
		var transporter = nodemailer.createTransport(smtpTransport(cfg.email.smtp));
		var message = {
			from: cfg.email.fromFields,
			to:  cfg.email.whoToContact
		};


		debug("eventHandler movementWasDetected", data);
		try {
			name = data.name;
		} catch (exception){
			name = "(Unknown)";	
		}

		message.subject = "Alert: A PERSON has been detected in " + name;
		message.text = message.subject;
		message.html = message.subject;

		transporter.sendMail(message, function(err, info){
			// console.log('send', err, info);
			debug("Mail sent");
		})
	}


	this.getTimeWhenLightsGoOff = function(){
		return moment().hour(0).minute(30).seconds(0);

		dayNumber = moment().day(); // Get the day number

		if(dayNumber >= 5){
			// Friday (5) and Saturday (6), close the lights later
			return moment().hour(1).minute(30).seconds(0);
		}

		// During the week, turn them off much earlier
		return moment().hour(0).minute(30).seconds(0);
		
	}

	this.isHomeAlone = function() {
		homeStatus = this.peopleTracker.getHomeStatus().home;		
		return homeStatus.isAlone;
	}

	this.runActionBasedOnHomeStatus = function(){
		if(this.isHomeAlone()){
			debug("runActionBasedOnHomeStatus: home is alone. call homeStartedToBeAlone()")
			this.homeStartedToBeAlone();
		} else {
			debug("runActionBasedOnHomeStatus: home is NOT alone. Someone is at home. Call someoneGotBackHome();")
			this.someoneGotBackHome();
		}
	}

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
			this.app. internalEventEmitter.emit("time:isDayOrNight", { day: false, night: true });
		}

		this.runActionBasedOnHomeStatus();
	}

	this.homeStartedToBeAlone = function(){
		// Disable heaters, set temperature back to 17;
		debug('Called homeStartedToBeAlone');

		if(this.isNightTime()){
			debug("It's night");

			if(this.turnOffLightsWhenHomeIsAloneAndItIsTooLate()){
				// Do not turn on the lights when it's too late.
				debugTime("The home is alone, but it is too late to turn the lights on.");
				return ;
			}

			debugTime("It's night and the home is alone, turning lights on");
			this.lightManager.useScene("homeIsAloneAtNight");
		} else {
			debug("It's day")
			debugTime("It's DAY and the home is alone, turning lights off");
			this.lightManager.setStatus({ lightName: 'officeLamp', onOff : false })
			this.lightManager.setStatus({ lightName: 'kitchenLamp', onOff : false })
			this.lightManager.setStatus({ lightName: 'kitchenCountertop', onOff : false })
		}
		this.heaterManager.setTemperature(17);
	}

	this.someoneGotBackHome = function(){
		// Disable enable heaters back, set temperature back to 22;
		// this.heaterManager.setGlobalTemperature(22);
		if(this.isDayTime()){
			debug("someoneGotBackHome ; daytime. Return false.")
			return false;
		}

		if(this.isItTooLateToTurnOnLights()){
			debug("someoneGotBackHome ; late. welcomeHomeLow.")
			// When coming back home late at night, ligths go on dimmed
			this.lightManager.useScene("welcomeHomeLow");
		} else {
			// When it's not late, lights go on full power
			debug("someoneGotBackHome ; early. welcomeHome.")
			this.lightManager.useScene("welcomeHome");
		}
	}


	this.nightTimeCounter = 10;

	this.isNightTime = function(){

		if(false){
			if(this.nightTimeCounter-- > 0){
				return false;
			}


			if(this.nightTimeCounter < -30){
				this.nightTimeCounter = 10;
				return true;
			}
		}

		var dayTimeStarts = moment().hour(this.dayTimeStarts[0]).minute(this.dayTimeStarts[1]).seconds(this.dayTimeStarts[2] - 5);
		var dayTimeEnds = moment().hour(this.dayTimeEnds[0]).minute(this.dayTimeEnds[1]).seconds(this.dayTimeEnds[2] + 5);
		var now = moment();

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

	this.isItTooLateToTurnOnLights = function(){
		if(!this.isNightTime()){
			// If it is not night time, don't do anything
			debugTime("isItTooLateToTurnOnLights false. It's not night time. Do nothing.");
			return false;
		}

		var now = moment();
		var dayTimeEnds = moment().hour(this.dayTimeEnds[0]).minute(this.dayTimeEnds[1]).seconds(this.dayTimeEnds[2]);
		var timeWhenLightsGoOff = this.getTimeWhenLightsGoOff();

		if(timeWhenLightsGoOff.isAfter(dayTimeEnds)){
			// This section might be buggy. @@TODO@@ RECHECK
			if(now.isAfter(dayTimeEnds) && now.isBefore(timeWhenLightsGoOff)){
				debugTime("Between dayTimeEnds and timeWhenLightsGoOff #1. Lights should be ON now. ");
				return false;
			}

		} else {
			if(now.isAfter(dayTimeEnds) || now.isBefore(timeWhenLightsGoOff)){
				// We're facing the night time now
				debugTime("Between dayTimeEnds and timeWhenLightsGoOff #2. Lights should be ON now. ");
				return false;
			}
		}

		debugTime("It's too late to turn lights ON. Lights should be OFF now.");
		return true;
	}

	this.turnOffLightsWhenHomeIsAloneAndItIsTooLate = function(){

		if(!this.isHomeAlone()){
			debug("turnOffLightsWhenHomeIsAloneAndItIsTooLate: There's someone at home. Do nothing.");
			// If there's someone at home, don't do anything
			return false;
		}

		if(!this.isItTooLateToTurnOnLights()){
			debugTime("turnOffLightsWhenHomeIsAloneAndItIsTooLate: lights now should be on.");
			return this.turnLightsOnWhenHomeIsAloneAndItsEarly();
		}

		// Do not turn on the lights when it's too late.
		debugTime("turnOffLightsWhenHomeIsAloneAndItIsTooLate: The home is alone. Too late to turn lights on. ");
		this.lightManager.useScene("allLightsOff");
		return true;
	}



	this.turnLightsOnWhenHomeIsAloneAndItsEarly = function(){

		if(!this.isHomeAlone()){
			debug("turnLightsOnWhenHomeIsAloneAndItEarly: There's someone at home. Do nothing.");
			// If there's someone at home, don't do anything
			return false;
		}

		if(this.isItTooLateToTurnOnLights()){
			debugTime("turnLightsOnWhenHomeIsAloneAndItEarly: too late to turn them on.");
			return false;
		}

		if(this.isDayTime()){
			debugTime("turnLightsOnWhenHomeIsAloneAndItEarly: not during daytime.");
			return false;
		}

		// Do not turn on the lights when it's too late.
		debugTime("turnLightsOnWhenHomeIsAloneAndItEarly: The home is alone. It's early. Turn lights on.");
		this.lightManager.useScene("homeIsAloneAtNight");
		return true;
	}



	this.start = function(app){
		if(this.app != undefined){
			return this;
		}
		this.app = app;

		this.app.internalEventEmitter.on("home:presence:statusChange", this.runActionBasedOnHomeStatus.bind(this));
		setInterval(this.verifyIfNightStartedOrEnded.bind(this), 1000);
		setInterval(this.turnOffLightsWhenHomeIsAloneAndItIsTooLate.bind(this), 1000);

		this.app.internalEventEmitter.emit("componentStarted", "actionScheduler");
		debug("enabled");
		return this;
	}

}

module.exports = actionScheduler;