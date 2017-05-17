var moment = require('moment');
const debug = require('debug')("app:component:actionScheduler");
const debugTime = require('debug')("app:component:actionScheduler:time");

function actionScheduler(cfg, peopleTracker, lightManager, heaterManager){

	this.checkCycleDuration = 1; // 60; // In seconds

	// this.internalEventEmitter = internalEventEmitter;
	this.peopleTracker = peopleTracker;
	this.lightManager = lightManager;
	this.heaterManager = heaterManager;
	this.wasNightOnLastCheck = false;
	this.dayTimeStarts = [7, 0, 0];
	this.dayTimeEnds = [17, 0, 0];

	this.movementWasDetected = function(data){
		homeStatus = this.peopleTracker.getHomeStatus();
		debug("eventHandler movementWasDetected", data);


		if(homeStatus.home.isAlone){
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

			message.subject = "Alert: movement has been detected in " + name;
			message.text = message.subject;
			message.html = message.subject;

			transporter.sendMail(message, function(err, info){
				console.log('send', err, info);
			})

		}		
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
			console.log('send', err, info);
		})
	}


	this.getTimeWhenLightsGoOff = function(){
		return moment().hour(0).minute(30).seconds(0);

		dayNumber = moment().day(); // Get the day number

		if(dayNumber >= 5){
			// Friday (5) and Saturday (6), close the lights later
			return moment().hour(2).minute(30).seconds(0);
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
			debug("runActionBasedOnHomeStatus: home is NOT alone. Someone is at home. Call someoneIsAtHome();")
			this.someoneIsAtHome();
		}
	}

	this.verifyIfNightStartedOrEnded = function(){
		// If the status did not change, do nothing
		if(this.wasNightOnLastCheck === this.isNightTime()){
			// debug("Night Status did not change. Return.")
			return ;
		}

		this.wasNightOnLastCheck = this.isNightTime();

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

	this.someoneIsAtHome = function(){
		// Disable enable heaters back, set temperature back to 22;
		// this.heaterManager.setGlobalTemperature(22);
		if(this.isDayTime()){
			return false;
		}

		if(this.isItTooLateToTurnOnLights()){
			// When coming back home late at night, ligths go on dimmed
			this.lightManager.useScene("welcomeHomeLow");
		} else {
			// When it's not late, lights go on full power
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

		var dayTimeStarts = moment().hour(this.dayTimeStarts[0]).minute(this.dayTimeStarts[1]).seconds(this.dayTimeStarts[2]);
		var dayTimeEnds = moment().hour(this.dayTimeEnds[0]).minute(this.dayTimeEnds[1]).seconds(this.dayTimeEnds[2]);
		var now = moment();

		if(now.isAfter(dayTimeStarts) && now.isBefore(dayTimeEnds)){
			debugTime("After Day Starts and before day ends, is HomeAlone", this.isHomeAlone());
			return false;
		}

		debugTime("Is NightTime, is HomeAlone", this.isHomeAlone());
		return true;
	}

	this.isDayTime  = function(){
		return !this.isNightTime();
	}

	this.isItTooLateToTurnOnLights = function(){
		if(!this.isHomeAlone()){
			debugTime("turnOffLightsWhenHomeIsAloneAndItIsTooLate false. There's someone at home. Do nothing.");
			// If there's someone at home, don't do anything
			return false;
		}

		if(!this.isNightTime()){
			// If it is not night time, don't do anything
			debugTime("turnOffLightsWhenHomeIsAloneAndItIsTooLate false. It's not night time. Do nothing.");
			return false;
		}

		var now = moment();
		var dayTimeEnds = moment().hour(this.dayTimeEnds[0]).minute(this.dayTimeEnds[1]).seconds(this.dayTimeEnds[2]);
		var getTimeWhenLightsGoOff = this.getTimeWhenLightsGoOff();

		if(getTimeWhenLightsGoOff.isAfter(dayTimeEnds)){
			if(now.isAfter(dayTimeEnds) || now.isBefore(this.getTimeWhenLightsGoOff())){
				debugTime("turnOffLightsWhenHomeIsAloneAndItIsTooLate false. Between dayTimeEnds and getTimeWhenLightsGoOff #1");
				return false;
			}

		} else {
			if(now.isAfter(dayTimeEnds) || now.isBefore(this.getTimeWhenLightsGoOff())){
				// We're facing the night time now
				debugTime("turnOffLightsWhenHomeIsAloneAndItIsTooLate false. Between dayTimeEnds and getTimeWhenLightsGoOff #2");
				return false;
			}
		}

		return true;		
	}

	this.turnOffLightsWhenHomeIsAloneAndItIsTooLate = function(){
		if(!this.isItTooLateToTurnOnLights()){
			return false;
		}

		// Do not turn on the lights when it's too late.
		debugTime("The home is alone, but it is too late to turn the lights on. Turn them off.");
		this.lightManager.useScene("allLightsOff");
		return true;
	}

	this.start = function(app){
		if(this.app != undefined){
			return this;
		}
		this.app = app;

		this.app.internalEventEmitter.on("home:presence:statusChange", this.runActionBasedOnHomeStatus.bind(this));
		setInterval(this.verifyIfNightStartedOrEnded.bind(this), this.checkCycleDuration * 1000);
		setInterval(this.turnOffLightsWhenHomeIsAloneAndItIsTooLate.bind(this), this.checkCycleDuration * 1000);
		debug("enabled");
		return this;
	}

	this.forceDayTime = function(){

	}
}

module.exports = actionScheduler;