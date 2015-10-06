<?php


class Thermostat {

	private $currentTemp = -1;
	private $desiredTemp = -1;
	private $heaterStatus = 0;
	private $name = 'Anonymous';
	private $ip = '';

	public function __construct($name, $ip){
		$this->ip = $ip;
		$this->name = $name;			
	}

	public function getName(){
		return $this->name;
	}

	public function setHeaterOn(){
		$this->heaterStatus = 1;
		return true;		
		return $this->callApi('/heaterOn');
	}


	public function setHeaterOff(){
		$this->heaterStatus = 0;
		return true;
		return $this->callApi('/heaterOff');
	}

	public function getCurrentTemperature(){
		return rand(20,25);
		return $this->callApi('/getCurrentTemperature');
	}

	public function setDesiredTemperature($temperature){
		$this->desiredTemperature = $temperature;
	
		return $this->callApi('/setDesiredTemperature', array('value' => $temperature));
	}

	public function getDesiredTemperature(){
		return $this->desiredTemperature;
		return $this->callApi('/getDesiredTemperature');
	}

	public function getStatus(){
		return $this->heaterStatus;
	}

}


