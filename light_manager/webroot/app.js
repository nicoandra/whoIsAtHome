angular.module("LightManagerApp", [  ])
.controller("LightManagerController", function($scope, $http, $timeout){

$scope.homeStatus = {
	people: { nico : { status : 'away'}},

}
$scope.heaters = {};
$scope.lightManager = {};

$scope.setPersonStatusAs = function(statusName, time){
	switch(statusName){
		case "atHome": url = '/people/setAsAtHome'; break;
		case "away": url = '/people/setAsAway'; break;
		case "sleeping": url = '/people/setAsSleeping'; break;
		case "getBackIn": url = '/people/setAsComingBack'; break;
		default: return;
	}

	$http.post(url).success(function(response){
		$scope.homeStatus = response;
	})
}

$scope.allLights = {
	onOff : true,
	brightness : 100
}
$scope.requestStatus = false;


$scope.setAllHeaters = function(desiredTemperature){
	Object.keys($scope.heaters).forEach(function(heaterName){
		$scope.heaters[heaterName].desiredTemperatureFromInterface = desiredTemperature;
	});
	$scope.heaterChanged();
}

$scope.heaterChanged = function(){
	$http.post("/angular/heathers/set", $scope.heaters).success(function(response,httpStatus){
		$scope.updateInterfaceWithResponse(response)
		$scope.requestEnded(httpStatus);
	}).error(function(response,httpStatus){
		console.log("SOMETHING HAPPENED")
		$scope.requestEnded(httpStatus);
	});

}

$scope.requestStarted = function(){
	$scope.requestStatus = true;
}

$scope.requestEnded = function(httpStatus){
	$scope.requestStatus = httpStatus;

	$timeout(function(){
		if(parseInt($scope.requestStatus) != 0){
			$scope.requestStatus = false;
		}
	}, httpStatus > 0 ? 1000 : 5000)
}

$scope.dimChange = function(a,b,c){ console.log(a,b,c) };

function processHeaterResponse(source, destination){
	Object.keys(source).forEach(function(name){
		if(destination[name] == undefined){
			destination[name] = {};
		}
		destination[name].desiredTemperatureFromHeater = source[name].desiredTemperatureFromHeater,
		destination[name].displayName = source[name].displayName;
		destination[name].humidity = source[name].humidity;
		destination[name].isDown = source[name].isDown;
		destination[name].isDownSince = source[name].isDownSince;
		destination[name].lastResponse = source[name].lastResponse;
		destination[name].power = source[name].power;
		destination[name].temperature = source[name].temperature;
	});
	console.log("HOLA", source, destination);
}


$scope.persistLightStatusAsScene = function(){
	console.log($scope.interface.programName, $scope.interface.programAlias)

	let data = {
		programName : $scope.interface.programName,
		programAlias : $scope.interface.programAlias
	}

	$http.post("/lights/persistProgram", data).success(function(response,httpStatus){
		console.log("OK!", response, httpStatus)
		$scope.interface.programName = $scope.interface.programAlias = ''
	}).error(function(err,a){
		console.log("OK!", response, httpStatus)
	})
}

$scope.updateInterfaceWithResponse = function(response){

	if(response.lightManager !== undefined){
		$scope.lights = response.lightManager.lights;
		$scope.lightManager = response.lightManager;
	}


	$scope.homeStatus = response.peopleTracker.people;
	$scope.localWeather = response.localWeather.short;
	$scope.home = response.peopleTracker.home;

	processHeaterResponse(response.heaterManager.heaters, $scope.heaters);

	isAnyLightOn = Object.keys($scope.lights).reduce(function(prevVal,currVal,c,d){
		currVal = $scope.lights[currVal]
		return prevVal || currVal.status.onOff;
	}, false)

	$scope.allLights.onOff = isAnyLightOn;
	$scope.activeProgram = response.lightManager.programs.activeProgram;
}

$scope.buildInterface = function(){
	$scope.requestStarted();
	$http.get("/app/getInterfaceOptions").success(function(response,httpStatus){
		$scope.updateInterfaceWithResponse(response)
		$scope.getNotifications();
		// $scope.getNotifications();
		// $scope.getHeaters();
		$scope.requestEnded(httpStatus);
	}).error(function(response,httpStatus){
		console.log("SOMETHING HAPPENED")
		$scope.requestEnded(httpStatus);
	});
}

$scope.getNotifications = function(){
	$http.get("/angular/system/getNotifications").success(function(response){
		console.log(response);
		$scope.notifications = response;
	});
}

$scope.allLights = function(statusObject){
	console.log("going to send", statusObject);
	statusToSend = statusObject;

	Object.keys(statusObject).forEach(function(key){
		$scope.allLights[key] = statusObject[key];
	})

	$scope.sendLightCommand(Object.keys($scope.lights), statusToSend)
}


$scope.toggleLightProgramByKey = function(programKey, element){

	if(programKey == $scope.activeProgram){
		return $scope.allLights({ onOff : false});
	}
	$scope.sendLightProgramByKey(programKey);
}


$scope.sendLightProgramByKey = function(programKey){
	$scope.loadingRequest = true;
	$http.post(
		"/app/components/lightManager/runProgram",
		{programKey}
	).success(function(){
		this.loadingRequest = false;
		this.buildInterface
	}.bind($scope)).error(function(){
		this.loadingRequest = false;
	}.bind($scope))
}

$scope.sendLightCommand = function(element, status){

	$scope.requestStarted();
	if(typeof element == "string" || typeof element == "object"){
		status.lightName = element;
	} else {
		status.lightName = element.light.name;
	}

	$http.post(
		"/app/components/lightManager/runProgram",
		status
	).success(function(response, httpStatus){
		$scope.requestEnded(httpStatus);
		$scope.updateInterfaceWithResponse(response)
	})

}



$scope.socketSimulator = function(){
	$http.get("/app/sock", { timeout: 60000 })
		.success(function(response){
			$scope.socketSimulator()
			// $scope.buildInterface();
			$scope.updateInterfaceWithResponse(response)
		}).error(function(){
			$timeout($scope.socketSimulator, 1000)
			// If error is "CONN REFUSED, call again in 5 minutes"
			// If error is "TIMEOUT", call again in
			// $scope.socketSimulator()
		}
	)
}

$scope.getCameras = function(){
/*	$http.get("/cameras/getList").success(
		function(response){
			$scope.cameras = response;
		}
	);*/
}

$scope.buildInterface();
$scope.socketSimulator();
$scope.getCameras();

$scope.changeTheme = function(theme){
	$http.get("/switchInterface?theme="+ theme).success(function(){
		window.location = window.location;
	})
}

/*$scope.getHeaters = function(){
	$http.get("/angular/heaters/getStatus").success(function(response){
		$scope.heaters = response.heaters;
		$scope.localWeather = response.localWeather;
	})
}
$scope.getHeaters();
*/


});
