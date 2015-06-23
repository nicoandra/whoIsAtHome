<?php

require_once('inc/config.php');

class HousePrograms {

	const GROUP_OFFICE = 1;
	const GROUP_KITCHEN = 2;

	public function kitchenOnAtNight(){
		// Ping my phone.
		if(isNicoAtHome()){
			// Turn on Office light
			$milight = MiLightHome::getInstance();
			$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
			$milight->rgbwSetGroupToWhite(self::GROUP_KITCHEN);
		}
	}

	public function kitchenOffAtMorning(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$milight->rgbwSetColorToViolet();
	}



	public function officeOnAtNight(){
		// Ping my phone.
		if(!isNicoAtHome()){
			// Turn on Office light
			$milight = MiLightHome::getInstance();
			$milight->setRgbwActiveGroup(self::GROUP_OFFICE);
			$milight->rgbwSetGroupToWhite(self::GROUP_OFFICE);
		}
	}

	public function officeOffAtMorning(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_OFFICE);
		$milight->rgbwSetColorToViolet();
	}
}

if(!isset($argv[1])){
	echo "Missing command".PHP_EOL;
	die();
}
$method = $argv[1];

$instance = new HousePrograms();

if(!method_exists($instance, $method)){
	echo "Program does not exist.".PHP_EOL;
	die();
}

$instance->$method();

