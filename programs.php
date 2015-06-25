<?php

require_once('inc/config.php');

class HousePrograms {

	const GROUP_OFFICE = 1;
	const GROUP_KITCHEN = 2;

	public function rainbow(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$step = 64;
		for($r = 0; $r < 256 ; $r = $r + $step){
			for($g = 0; $g < 256; $g = $g + $step){
				for($b = 0; $b < 256; $b = $b + $step){

					if($r == 0 && $g == 0 && $b == 0){
						$r = 10;
					}

					if($r == 255 && $g == 255 && $b == 255){
						$r = 0;
					}

					$string = str_pad(dechex($r), 2, '0') .
							str_pad(dechex($g), 2, '0').
							str_pad(dechex($b), 2, '0');
					$milight->rgbwSetColorHexString($string);
					sleep(.0000001);
				}
			}
		}
		$milight->rgbwSetColorToBabyBlue();
		sleep(.5);


	}

	public function kitchenOnAtNight(){
		// Ping my phone.
		if(!isNicoAtHome()){
			// Turn on Office light
			$milight = MiLightHome::getInstance();
			$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
			$milight->rgbwSetGroupToWhite(self::GROUP_KITCHEN);
		}
	}

	public function kitchenOffAtMorning(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$milight->rgbwGroup2Off();
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
		$milight->rgbwGroup1Off();
	}



	public function setZoneminderOnOrOff(){
		$newStatus = isNicoAtHome() ? 'Periferia' : 'NadieEnCasa';
		RedisConn::getConnection()->hSet('zoneminder', 'newStatus', $newStatus.'-Hash');

	}


        public function kitchenOff(){
                $milight = MiLightHome::getInstance();
                $milight->rgbwGroup2Off();
        }


	public function kitchenOn(){
		$milight = MiLightHome::getInstance();
		$milight->rgbwSetGroupToWhite(self::GROUP_KITCHEN);
	}

	public function officeOn(){
		$milight = MiLightHome::getInstance();
		$milight->rgbwSetGroupToWhite(self::GROUP_OFFICE);
	}

	public function officeOff(){
		$milight = MiLightHome::getInstance();
		$milight->rgbwGroup1Off();
	}

	public function officeRed(){
		$this->setColorInPlace(self::GROUP_OFFICE, array(255, 0 , 0));
	}

        public function kitchenRed(){
                $this->setColorInPlace(self::GROUP_KITCHEN, array(255, 0 , 0));
        }

        public function officeGreen(){
                $this->setColorInPlace(self::GROUP_OFFICE, array(0, 255, 0));
        }

        public function kitchenGreen(){
                $this->setColorInPlace(self::GROUP_KITCHEN, array(0, 255, 0));
        }

        public function officeBlue(){
                $this->setColorInPlace(self::GROUP_OFFICE, array(0, 0 , 255));
        }

        public function kitchenBlue(){
                $this->setColorInPlace(self::GROUP_KITCHEN, array(0, 0 , 255));
        }



	public function setColorInPlace($group, $color){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup($group);

		$string = str_pad(dechex($color[0]), 2, '0').
				str_pad(dechex($color[1]), 2, '0').
				str_pad(dechex($color[2]), 2, '0');

		$milight->rgbwSetColorHexString($string);
		

	}

}


