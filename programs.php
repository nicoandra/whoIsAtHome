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


	public function kitchenBrightness($percent){
		$percent = min($percent, 100);
		$percent = max(0, $percent);
		$milight = MiLightHome::getInstance();
		$milight->rgbwBrightnessPercent($percent, self::GROUP_KITCHEN);
	}

        public function officeBrightness($percent){
                $percent = min($percent, 100);
                $percent = max(0, $percent);
                $milight = MiLightHome::getInstance();
                $milight->rgbwBrightnessPercent($percent, self::GROUP_OFFICE);
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


	public function kitchenDisco(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$milight->rgbwDiscoMode();
	}

        public function officeDisco(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_OFFICE);
                $milight->rgbwDiscoMode();
        }

	public function allDisco(){
		$this->kitchenDisco();
		$this->officeDisco();
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


	public function kitchenPink(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$milight->rgbwSetColorToPink();
	}

        public function officePink(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_OFFICE);
                $milight->rgbwSetColorToPink();
        }

	public function setColorInPlace($group, $color){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup($group);

		$string = str_pad(dechex($color[0]), 2, '0').
				str_pad(dechex($color[1]), 2, '0').
				str_pad(dechex($color[2]), 2, '0');

		$milight->rgbwSetColorHexString($string);

	}

	public function camerasOff($hours){
		makeNicoInForHours($hours);
	}

	public function camerasOn($hours){
		makeNicoOutForHours($hours);
	}

	public function camerasAuto(){
		makeNicoOutForHours(-2);
	}


	public function goodnight(){
		$this->officeOff();
		$this->kitchenOff();
	}

	public function lightsOn(){
		$this->officeOn();
		$this->kitchenOn();
	}

	public function allGreen(){
		$this->officeGreen();
		$this->kitchenGreen();
	}

	public function allRed(){
		$this->officeRed();
		$this->kitchenRed();
	}

	public function allBlue(){
		$this->officeBlue();
		$this->kitchenBlue();
	}

	public function allPink(){
		$this->officePink();
		$this->kitchenPink();
	}

	public function officeViolet(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_OFFICE);
		$milight->rgbwSetColorToViolet();
	}

	public function kitchenViolet(){
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$milight->rgbwSetColorToViolet();
	}

	public function allViolet(){
		$this->kitchenViolet();
		$this->officeViolet();
	}

	 public function officeYellow(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_OFFICE);
                $milight->rgbwSetColorToYellow();
        }

        public function kitchenYellow(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
                $milight->rgbwSetColorToYellow();
        }

	public function allYellow(){
		$this->officeYellow();
		$this->kitchenYellow();
	}

         public function officeOrange(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_OFFICE);
                $milight->rgbwSetColorToOrange();
        }

        public function kitchenOrange(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
                $milight->rgbwSetColorToOrange();
        }

        public function allOrange(){
                $this->officeOrange();
                $this->kitchenOrange();
        }

         public function officeLimeGreen(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_OFFICE);
                $milight->rgbwSetColorToLimeGreen();
        }

        public function kitchenLimeGreen(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
                $milight->rgbwSetColorToLimeGreen();
        }

        public function allLimeGreen(){
                $this->officeLimeGreen();
                $this->kitchenLimeGreen();
        }


}


