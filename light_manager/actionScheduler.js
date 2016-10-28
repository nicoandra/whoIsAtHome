var moment = require('moment');

function actionScheduler(peopleTracker, lightManager, heaterManager){

	this.checkCycleDuration = 1; // In seconds

	this.peopleTracker = peopleTracker;
	this.lightManager = lightManager;
	this.heaterManager = heaterManager;
	this.wasNightOnLastCheck = false;


	this.runActionBasedOnHomeStatus = function(){

		homeStatus = this.peopleTracker.getHomeStatus().home;
		if(homeStatus.isAlone){
			this.homeStartedToBeAlone();
			return;
		}
		this.someoneIsAtHome();
	}

	this.verifyStatus = function(){
		homeStatus = this.peopleTracker.getHomeStatus().home;

		now = moment().unix();
		lastStatusChange = moment(homeStatus.sinceWhen).add(this.checkCycleDuration, 'seconds').unix();

		if(now - lastStatusChange < this.checkCycleDuration){
			// If the change was done in the last cycle, consider the actual status as the "new" status
			// and trigger an action
			console.log("Home status changed to ", homeStatus)

			this.runActionBasedOnHomeStatus();
		}

		this.verifyIfNightStartedOrEnded();
	}

	this.verifyIfNightStartedOrEnded = function(){
		if(this.wasNightOnLastCheck != this.isNightTime()) {
			this.runActionBasedOnHomeStatus();
			this.wasNightOnLastCheck = this.isNightTime();
		}
	}

	this.homeStartedToBeAlone = function(){
		// Disable heaters, set temperature back to 17;
		console.log('Called homeStartedToBeAlone');

		if(this.isNightTime()){
			this.lightManager.setStatus({ lightName: 'officeLamp', onOff : true, color: "white", "brightness": 80  })
			this.lightManager.setStatus({ lightName: 'kitchenLamp', onOff : true, color: "white", "brightness": 80  })
			this.lightManager.setStatus({ lightName: 'kitchenCountertop', onOff : true, color: "white", "brightness": 80  })
		} else {
			this.lightManager.setStatus({ lightName: 'officeLamp', onOff : false })
			this.lightManager.setStatus({ lightName: 'kitchenLamp', onOff : false })
			this.lightManager.setStatus({ lightName: 'kitchenCountertop', onOff : false })

		}
		this.heaterManager.setStatus(17);
	}


	this.someoneIsAtHome = function(){
		// Disable enable heaters back, set temperature back to 22;
		// this.heaterManager.setStatus(22);
	}


	this.isNightTime = function(){
		hour = moment().hour();
		if(hour > 18 && hour < 6){
			return true;
		}
		return false
	}

	this.isDayTIme  = function(){
		return !this.isNightTime();
	}

	this.start = function(){
		setInterval(this.verifyStatus.bind(this), this.checkCycleDuration * 1000);
		setInterval(this.verifyIfNightStartedOrEnded.bind(this), this.checkCycleDuration * 1000);

	}

	this.start();
}

module.exports = actionScheduler;