
function LightPrograms(){

	this.lights = {};

	

	this.getZonesByProgramName = function(programName){
        var exp;
        var action = '';
        var actionArguments = [];
        var affectedLights = [];

        if(programName.match('get lights status')){
            /*this.lights.officeBoards.off();
            this.lights.officeLamp.off();
            this.lights.kitchenLamp.off();*/
            return {methodToExecute : 'getLightsStatus' };
        }

		exp = programName.match('^all lights (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
			affectedLights.push(lights.officeLamp);
			affectedLights.push(lights.kitchenLamp);
		}

		exp = programName.match('^office all (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
			affectedLights.push(lights.officeLamp);
		}


		exp = programName.match('^office lamp (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeLamp);
		}

		exp = programName.match('^office boards (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.officeBoards);
		}

		exp = programName.match('^kitchen lamp (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.kitchenLamp);
		}

		exp = programName.match('^kitchen all (.*)');
		if(exp){
			action = exp[1];
			affectedLights.push(lights.kitchenLamp);
		}

		// Now parse the action!

//		console.log('EEEE', action);
		exp = action.match('^color (.*)');
		if(exp){
			action = 'setColor';
			actionArguments.push(exp[1]);
		}


		colorMatch = action.match('([0-9]{1,3}) ([0-9]{1,3}) ([0-9]{1,3})');
		if(colorMatch){
			colorToSet = rgbToMilightColor(colorMatch[1], colorMatch[2], colorMatch[3]);
			action = 'setColor';
			actionArguments.push(colorToSet);
		}

		if(action){
			affectedLights.forEach(function(lightObject){
				if(lightObject.hasOwnProperty(action) && typeof lightObject[action] === 'function'){
					
					console.log('Calling method '+action+ ' with params ', actionArguments);
					lightObject[action].apply(lightObject, actionArguments);
					return true;
				} else {
					console.log('This object does not have a method '+action+'. Fallback');
				}

			});
		}

		if(programName.match('^all lights off')){
            lights.officeBoards.off();
            lights.officeLamp.off();
            lights.kitchenLamp.off();
            return true;
		}

		if(programName.match('^all lights on')){
            lights.officeBoards.on();
            lights.officeLamp.on();
            lights.kitchenLamp.on();
            return true;
		}

		if(programName.match('^all lights white')){
            lights.officeBoards.white();
            lights.officeLamp.white();
            lights.kitchenLamp.white();
            return true;
        }

		exp = programName.match('^all lights (.*)');
		if(exp){
			console.log(exp[1]);
			if(exp[1] == 'disco'){
                lights.officeBoards.disco();
                lights.officeLamp.disco();
                lights.kitchenLamp.disco();
                return true;
			}

			if(exp[1] == 'disco faster'){
                lights.officeBoards.discoFaster();
                lights.officeLamp.discoFaster();
                lights.kitchenLamp.discoFaster();
                return true;
			}

			if(exp[1] == 'disco slower'){
                lights.officeBoards.discoSlower();
                lights.officeLamp.discoSlower();
                lights.kitchenLamp.discoSlower();
                return true;
            }

			if(colorCodes.hasOwnProperty(exp[1])){
				lights.officeBoards.setColor(exp[1]);
				lights.officeLamp.setColor(exp[1]);
				lights.kitchenLamp.setColor(exp[1]);
				return true;
			}



			if(exp[1] == 'brightness max'){
				lights.officeLamp.brightnessMax();
				lights.officeBoards.brightnessMax();
				lights.kitchenLamp.brightnessMax();
				return true;
			}

			if(exp[1] == 'brightness min'){
				lights.officeLamp.brightnessMin();
				lights.officeBoards.brightnessMin();
				lights.kitchenLamp.brightnessMin();
				return true;
			}


			if(exp[1] == 'ocean' || exp[1] == 'pinks' || exp[1] == 'greens'){
				try {
					lights.boards[exp[1]]();
					lights.officeLamp[exp[1]]();
					lights.kitchenLamp[exp[1]]();
				} catch(e){
					console.log('Sorry, such method does not exist');
				}
				return true;
			}


		}

		if(programName.match('^all rooms (.*)')){
			return {lights : [] , heaters : [1,2,3] , partToStrip : 'all rooms' , parseComplete : false}; 
		}

		if(programName.match('^office (.*)')){

			exp = programName.match('^office all (.*)');
			if(exp){
				if(exp[1] == 'on'){
                    lights.officeLamp.on();
                    lights.officeBoards.on();
                    return true;
				}

				if(exp[1] == 'off'){
                    lights.officeLamp.off();
                    lights.officeBoards.off();
                    return true;
				}

				if(exp[1] == 'white'){
                    lights.officeLamp.white();
                    lights.officeBoards.white();
                    return true;
				}

                if(exp[1] == 'disco'){
                    lights.officeLamp.disco();
                    lights.officeBoards.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.officeLamp.discoFaster();
                    lights.officeBoards.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeLamp.discoSlower();
                    lights.officeBoards.discoSlower();
                    return true;
                }

				if(exp[1] == 'brightness max'){
					lights.officeLamp.brightnessMax();
					lights.officeBoards.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.officeLamp.brightnessMin();
					lights.officeBoards.brightnessMin();
					return true;
				}    

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeLamp.setColor(exp[1]);
                    lights.officeBoards.setColor(exp[1]);
                    return true;
                }



			}

            exp = programName.match('^office lamp (.*)');
			if(exp){
                if(exp[1] == 'on'){
                    lights.officeLamp.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.officeLamp.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.officeLamp.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.officeLamp.disco();
                    return true;
                }


				if(exp[1] == 'brightness max'){
					lights.officeLamp.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.officeLamp.brightnessMin();
					return true;
				}

                if(exp[1] == 'disco faster'){
                    lights.officeLamp.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeLamp.discoSlower();
                    return true;
                }

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeLamp.setColor(exp[1]);
                    return true;
                }

				if(exp[1] == 'ocean' || exp[1] == 'pinks' || exp[1] == 'greens'){
					lights.officeLamp[exp[1]]();
					return true;
				}

			}

			exp = programName.match('^office boards (.*)');
            if(exp){
                if(exp[1] == 'on'){
                    lights.officeBoards.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.officeBoards.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.officeBoards.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.officeBoards.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.officeBoards.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.officeBoards.discoSlower();
                    return true;
                }

				if(exp[1] == 'brightness max'){
					lights.officeBoards.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.officeBoards.brightnessMin();
					return true;
				}                

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.officeBoards.setColor(exp[1]);
                    return true;
                }

				if(exp[1] == 'ocean' || exp[1] == 'pinks' || exp[1] == 'greens'){
					lights.boards[exp[1]]();
					return true;
				}

            }

			if(programName.match('^office light (.*)')){
				return "COMMAND NOT IMPLEMENTED";
			}

			expr = programName.match('^office ([0-9]+(\.5)?) degrees');
			if(expr){
				return {lights : [] , heaters : [3] , temperature: expr[1] , parseComplete : true};
			}
		}

		if(programName.match('^kitchen (.*)')){

			if(programName.match('^kitchen all (.*)')){
				return {lights : [2,4] , heaters : [], partToStrip : 'kitchen all' , parseComplete : false };
			}


            exp = programName.match('^kitchen lamp (.*)');
            if(exp){
                if(exp[1] == 'on'){
                    lights.kitchenLamp.on();
                    return true;
                }

                if(exp[1] == 'off'){
                    lights.kitchenLamp.off();
                    return true;
                }

                if(exp[1] == 'white'){
                    lights.kitchenLamp.white();
                    return true;
                }

                if(exp[1] == 'disco'){
                    lights.kitchenLamp.disco();
                    return true;
                }

                if(exp[1] == 'disco faster'){
                    lights.kitchenLamp.discoFaster();
                    return true;
                }

                if(exp[1] == 'disco slower'){
                    lights.kitchenLamp.discoSlower();
                    return true;
                }

				if(exp[1] == 'brightness max'){
					lights.kitchenLamp.brightnessMax();
					return true;
				}

				if(exp[1] == 'brightness min'){
					lights.kitchenLamp.brightnessMin();
					return true;
				}                 

                if(colorCodes.hasOwnProperty(exp[1])){
                    lights.kitchenLamp.setColor(exp[1]);
                    return true;
                }

				if(exp[1] == 'ocean' || exp[1] == 'pinks'){
					lights.kitchenLamp[exp[1]]();
					return true;
				}

            }

			if(programName.match('^kitchen countertop (.*)')){
			}
			if(programName.match('^kitchen light (.*)')){
			}

			expr = programName.match('^kitchen ([0-9]+(\.5)?) degrees');
			if(expr){
				return {lights : [] , heaters : [1] , temperature: expr[1] , parseComplete : true};
			} 			
		}

		if(programName.match('^living (.*)')){

			if(programName.match('^living all (.*)')){
				return {lights : [1,3] , heaters : [3] , partToStrip : 'living all' , parseComplete : false};
			}

			if(programName.match('^living lamp (.*)')){
				return {lights : [1] , heaters : [], partToStrip : 'living lamp' , parseComplete : false };
			} 

			if(programName.match('^living light (.*)')){
				return {lights : [1] , heaters : [], partToStrip : 'living light' , parseComplete : false};
			}

			expr = programName.match('^living ([0-9]+(\.5)?) degrees');
			if(expr){
				return {lights : [] , heaters : [2] , temperature: expr[1], parseComplete : true};
			}
		}

		return {};
	}

	this.getActionByProgramName = function(programName, affectedZones){
		toParse = programName;
		if(affectedZones.hasOwnProperty('partToStrip')){
			toParse = programName.replace(affectedZones.partToStrip, '').trim();
		}

		affectedZones.toParse = toParse;

		if(	toParse === 'off' || 
			toParse === 'on' || 
			toParse === 'white' || 
			toParse == 'disco' || 
			toParse == 'disco faster' || 
			toParse == 'disco slower'){

			affectedZones.methodToRunOnZones = toParse;
			affectedZones.parseComplete = true;
			return affectedZones;
		}

		exp = toParse.match('([0-9]{2,3}) percent');
		if(exp){
			affectedZones.methodToRunOnZones = 'brightness';
			affectedZones.parametersForMethod = exp[1];
			affectedZones.parseComplete = true;
			return affectedZones;
		}

		// Still need to parse: #color
		Object.keys(colorCodes).forEach(function(a,b){

			affectedZones.methodToRunOnZones = '_send';
			affectedZones.parametersForMethod = [0x40, 0x20];
			affectedZones.parseComplete = true;
			return affectedZones.methodToRunOnZones;

			exp = toParse.match('^('+a+')$');
			if(exp){
				console.log('Match!', a, colorCodes[a]);
				affectedZones.methodToRunOnZones = '_send';
				affectedZones.parametersForMethod = colorCodes[a];
				affectedZones.parseComplete = true;
			}
		})

		return affectedZones;
	}

	this.runProgram = function(programName){


		affectedZones = this.getZonesByProgramName(programName);
        if(affectedZones === true){
            return ;
        }

        if(affectedZones.hasOwnProperty('methodToExecute')){
            return global[affectedZones.methodToExecute]();
        }

        // console.log('CurrentStatus', lights);
        return ;



		if(!affectedZones.parseComplete){
			affectedZones = this.getActionByProgramName(programName, affectedZones);
		}


		if(affectedZones.parseComplete){

			console.log('*********',affectedZones,'*********');
			if(affectedZones.hasOwnProperty('parametersForMethod')){
				console.log(milight.zone(affectedZones.lights));
			} else {
				affectedZones.commandsToSend.forEach(function(command, index){
					setTimeout(function () {
       					limitless.send(command);
   					}, index * 100);
				});
				
			}
		}

		/*
			all [on / white / color / off / disco]
			all [number] degrees

			office [all|lamp|boards|light] [on|white|#color|off|disco|#number brightess]
			office [#number] degrees
			
			kitchen [all|lamp|countertop|light] [on|white|#color|off|disco|#number brightess]
			kitchen [#number] degrees

			front door [on / white / color / off / disco]
			back door [on / white / color / off / disco]

			corridor [on|white|#color|off|disco|#number brightess]

			living [all|lamp|light] [on|white|#color|off|disco|#number brightess]
			living [#number] degrees
		*/
	}

    this.getLightsStatus = function(){

    	var status = {};

    	Object.keys(lights).forEach(function(key, pete){
    		console.log(key, pete);
    		status[key] = {
    			'status' : lights[key].status,
    			'color' : lights[key].color,
    			'brightness' : lights[key].brightness,
    			'queueSize' : lights[key].commandQueue.length
    		};
    	});

        return status;
    }

}

module.exports = LightPrograms;

