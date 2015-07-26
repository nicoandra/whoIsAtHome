<?php

require_once('inc/config.php');

class HousePrograms {

	const GROUP_OFFICE = 1;
	const GROUP_KITCHEN = 2;
	const GROUP_BOARDS = 3;

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

	private function roomBrightness($roomName, $percent){
		$roomName = trim(strtolower($roomName));
		$roomId = constant('self::GROUP_' . strtoupper($roomName));

		$percent = min($percent, 100);
		$percent = max(0, $percent);
		$milight = MiLightHome::getInstance();
		$milight->rgbwBrightnessPercent($percent, $roomId);

		RedisConn::getConnection()->hSet('lights', $roomName.'.brightness', $percent);

		return true;

	}

	public function kitchenBrightness($percent){
		return $this->roomBrightness('kitchen', $percent);
	}

    public function officeBrightness($percent){
    	return $this->roomBrightness('office', $percent);
    }

	public function boardsBrightness($percent){
		return $this->roomBrightness('boards', $percent);
	}

	private function roomOff($roomName){
		$roomName = trim(strtolower($roomName));
		$roomId = constant('self::GROUP_' . strtoupper($roomName));

		$milight = MiLightHome::getInstance();
		$method = 'rgbwGroup'.$roomId.'Off';
		$milight->{$method}();

		RedisConn::getConnection()->hSet('lights', $roomName.'.color', 'off');
	}

	public function kitchenOff(){
		$this->roomOff('Kitchen');
	}

	public function officeOff(){
		$this->roomOff('Office');
	}

	public function boardsOff(){
		$this->roomOff('Boards');
	}


	public function kitchenOn(){
		$milight = MiLightHome::getInstance();
		$milight->rgbwSetGroupToWhite(self::GROUP_KITCHEN);
	}

	public function officeOn(){
		$milight = MiLightHome::getInstance();
		$milight->rgbwSetGroupToWhite(self::GROUP_OFFICE);
	}




    private function roomDisco($roomName){
    	$roomName = trim(strtolower($roomName));
    	$roomId = constant('self::GROUP_' . strtoupper($roomName));

    	RedisConn::getConnection()->hSet('lights', $roomName.'.color', 'disco');

		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup($roomId);
		return $milight->rgbwDiscoMode();
    }

	public function kitchenDisco(){
		$this->roomDisco('kitchen');
	}

	public function officeDisco(){
		$this->roomDisco('office');
	}

	public function boardsDisco(){
		$this->roomDisco('boards');
	}


	private function roomRed($room){
		$this->setColorInPlace('office', array(255, 0 , 0));
	}

	public function officeRed(){
		$this->setColorInPlace('office', 'red');
	}

	public function kitchenRed(){
		$this->setColorInPlace('kitchen', 'red');
	}

	public function boardsRed(){
		$this->setColorInPlace('boards','red');
	}


	public function officeGreen(){
		$this->setColorInPlace('office', 'green');
	}

	public function kitchenGreen(){
		$this->setColorInPlace('kitchen', 'green');
	}

	public function boardsGreen(){
		$this->setColorInPlace('boards','green');
	}

	public function officeBlue(){
		$this->setColorInPlace('office', 'blue');
	}

	public function kitchenBlue(){
		$this->setColorInPlace('kitchen', 'blue');
	}

	public function boardsBlue(){
		$this->setColorInPlace('boards', 'blue');
	}

	public function kitchenPink(){
		$this->setColorInPlace('kitchen', 'pink');
		return ;
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_KITCHEN);
		$milight->rgbwSetColorToPink();
	}

	public function officePink(){
		$this->setColorInPlace('office', 'pink');
		return ;		
		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup(self::GROUP_OFFICE);
		$milight->rgbwSetColorToPink();
	}	



	/** Security methods **/
	public function kitchenOnAtNight(){
		// Ping my phone.
		if(!isNicoAtHome()){
			// Turn on Kitchen light
			$this->kitchenOn();
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
			$this->officeOn();
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

	public static function getZoneminderStatus(){
		$return = array();
		$return = RedisConn::getConnection()->hGetAll('zoneminder');
		return $return;

		$newStatus = isNicoAtHome() ? 'Periferia' : 'NadieEnCasa';
		RedisConn::getConnection()->hSet('zoneminder', 'newStatus', $newStatus.'-Hash');

	}


	public function allDisco(){
		$this->kitchenDisco();
		$this->officeDisco();
		$this->boardsDisco();
	}



        public function boardsPink(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_BOARDS);
                $milight->rgbwSetColorToPink();
        }


        public function boardsLimeGreen(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_BOARDS);
                $milight->rgbwSetColorToLimeGreen();
        }


        public function boardsOrange(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_BOARDS);
                $milight->rgbwSetColorToOrange();
        }


        public function boardsViolet(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_BOARDS);
                $milight->rgbwSetColorToViolet();
        }

         public function boardsYellow(){
                $milight = MiLightHome::getInstance();
                $milight->setRgbwActiveGroup(self::GROUP_BOARDS);
                $milight->rgbwSetColorToYellow();
        }


	public function setColorInPlace($roomName, $color){

		$roomName = trim(strtolower($roomName));
		$roomId = constant('self::GROUP_' . strtoupper($roomName));

		if(is_string($color)){
			$colorName = strtolower($color);
			switch($colorName){
				case 'red': $color = array(255,0,0); break;
				case 'green': $color = array(0,255,0); break;
				case 'blue': $color = array(0,0,255); break;
				case 'pink': $color = array(255, 105, 180); break;

			}

			if(is_array($color)){
				RedisConn::getConnection()->hSet('lights', $roomName.'.color', $colorName);
			}
		}

		$milight = MiLightHome::getInstance();
		$milight->setRgbwActiveGroup($roomId);

		$string = str_pad(dechex($color[0]), 2, '0').
				str_pad(dechex($color[1]), 2, '0').
				str_pad(dechex($color[2]), 2, '0');

		$milight->rgbwSetColorHexString($string);

	}

	public function camerasOff($hours){
		// shell_exec("/home/nico/code/whoIsAtHome/shell/turnCameraOffice.sh window &");
		makeNicoInForHours($hours);
	}

	public function camerasOn($hours){
		// shell_exec("/home/nico/code/whoIsAtHome/shell/turnCameraOffice.sh room &");
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


