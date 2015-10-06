<?php

ini_set('display_errors',1);
ini_set('display_startup_errors',1);
error_reporting(-1);

require_once('/home/nico/code/whoIsAtHome/programs.php');


function fixColors($color){
        switch($color){
       		case 'white':
       			return 'on';
       			break;
                case 'of':
                        return 'off';
                        break;
                case 'org':
                        return 'on';
                        break;

		case 'think':
		case 'sink':
			return 'pink';
			break;
		case 'lime':
			return 'limeGreen';

        }
	return $color;

}

function sendJsonResponse($status = 'OK', $executedRawCommand = '', $executedParsedCommand = '', $message = '', $speech = ''){
	header('Content-Type: application/json');

	if(is_array($executedRawCommand)){
		echo json_encode(array(
			'status' => strtoupper($status),
			'response' => $executedRawCommand
		));
		return true;
	}
	echo json_encode(array(
		'status' => strtoupper($status),
		'executedRawCommand' => $executedRawCommand,
		'executedParsedCommand' => $executedParsedCommand,
		'message' => $message,
		'speech' => $speech)
	);
	return true;
}


function assignArrayByPath(&$arr, $path, $value) {
    $keys = explode('.', $path);

    while ($key = array_shift($keys)) {
        $arr = &$arr[$key];
    }

    $arr = $value;
}

function getStatus(){
	$hashes = RedisConn::getConnection()->hGetAll('lights');

	$return = array();
	foreach($hashes as $hashKey => $hashValue){
		assignArrayByPath($return, $hashKey, $hashValue);
	}


	$return['zoneminder'] = HousePrograms::getZoneminderStatus();
	return $return;
}


if(isset($_SERVER['HTTP_X_REQUESTED_WITH'])){


	$rawCommand = strtolower($_POST['command']);

	if($rawCommand == 'getstatus'){
		return sendJsonResponse('OK', getStatus());

	}

	$command = explode(' ', $rawCommand);
	$room = $command[0];

	$speech = 'Command executed';
	switch($room){
		case 'goodnight':
			$command[1] = '';
			$speech = 'Got it. Have a good night Nick';
	}

	if(sizeof($command) < 2){
		return sendJsonResponse('KO', '', '', 'Command not found. Sorry.');
	}

	$color = fixColors($command[1]);

	$instance = new HousePrograms();

	if($room == 'camera' || $room == 'cameras'){
		$matches = array();
		preg_match('~camera(s?) (off|of|on) for ([0-9]+) hour(s?)~', $rawCommand, $matches);

		if($rawCommand == 'cameras auto' || $rawCommand == 'camera auto'){
			$instance->camerasAuto();
			return sendJsonResponse('OK', 'cameras auto', 'camerasAuto', "Setting cameras to automatic mode", 
                                "Turning cameras in automatic mode");
		}

		if(sizeof($matches) == 5){
			// Turn cameras ON or OFF for X time
			$room = 'cameras';
			$color = ucfirst($matches[2]);
			$hours = (int) $matches[3];
			$method = $room.$color;
			$instance->{$method}($hours);
			return sendJsonResponse('OK', $rawCommand, $method, "Turning cameras {$color} for {$hours} hour(s)", 
				"Turning cameras {$color} for {$hours} hour". ($hours > 1 ? 's' : ''));
		} else {
			return sendJsonResponse('KO', $rawCommand, "", "Can not understand your command", "Command failed");
		}

	}


	if($color === 'disco' && isset($command[2]) && ($command[2] == 'slower' || $command[2] == 'faster')){
		// Handle Disco Speed 
		$method = $room.ucfirst($color).ucfirst($command[2]);
	} else {
		$method = $room.ucfirst($color);
	}


 
	if(!method_exists($instance, $method)){
		echo json_encode(array('status' => 'KO', 'message' => 'Command does not exist'));
	        return;
	}

	if($color == 'brightness'){
		$instance->$method($command[2]);
	} else {
		$instance->$method();
	}

	sendJsonResponse('OK', $rawCommand, $method, "Command ".$rawCommand." executed properly", $speech);
	return;
}
?>
<!DOCTYPE html>
<html lang="en">
	<head>
		<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
		<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.5/united/bootstrap.min.css">
		<link rel="stylesheet" href="/resources/style.css">
		<meta name="viewport" content="width=device-width, maximum-scale=1, minimum-scale=1"/>
		<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/js/bootstrap.min.js"></script>
		<script src="/resources/1961.js"></script>
		<title>HomePwn</title>
	</head>
	<body>

	<div class="page-header">
		<h1>1961</h1>
	</div>


		<div class="container">
			<div class="row">
				<div id="result"></div>
			</div>

			<div class="row">

			<?php

			$rooms = array(
				array(
					'name' => 'Kitchen', 
					'hasWhite' => true,
				),
				
				array(
					'name' => 'Office', 
					'hasWhite' => true,
				),
				
				array('name' => 'Boards', 'hasWhite' => false)
			);			
			foreach($rooms as $room){
				$roomName = $room['name']; ?>


				<div class="col-md-6">
						<h3><?=$roomName;?></h3>
						<div class="roomOptions <?=$roomName;?>">
							<?php foreach(array('red','green','blue','lime','yellow','orange','violet', 'pink') as $colorName){?>
								<a class="littleColorBox box<?=$colorName;?>" href="javascript: setCommand('<?=$roomName;?>', '<?=$colorName;?>')" style="background-color: <?=$colorName;?>">&nbsp;</a>
							<?php } ?>
							<?php if($room['hasWhite']){?>
								<a class="littleColorBox whiteOn" href="javascript: setCommand('<?=$roomName;?>', 'white')" >&nbsp;</a>
							<?php } ?>
							<a class="littleColorBox discoOn initial" href="javascript: setCommand('<?=$roomName;?>', 'disco')" >D</a>
							<a class="littleColorBox lightOff" href="javascript: setCommand('<?=$roomName;?>', 'off')" >&nbsp;</a>
							<input type="range" min="0" max="100" id="brightness<?=$roomName;?>" class="brightnessSlider" data-roomName="<?=$roomName;?>"/>
						</div>
				</div>
				<?php } ?>

			</div>


			<div class="row">
				<div class="col-md-6">
					<h3>Cameras <span class="cameraStatus" ></span></h3>
					Off for <a href="javascript: setCommand('cameras off for 2 hours', '');">2 hours</a>
					<a href="javascript: setCommand('cameras off for 4 hours', '');">4 hours</a>
					<a href="javascript: setCommand('cameras off for 6 hours', '');">6 hours</a>
					<a href="javascript: setCommand('cameras off for 8 hours', '');">8 hours</a>
					<a href="javascript: setCommand('cameras auto', '');">Auto</a>
				</div>
				<div class="col-md-6">
					All <a href="javascript: setCommand('lights on','');">On </a> <a href="javascript: setCommand('goodnight', '');"> Off</a>
					
				</div>
			</div>


			<div class="row">
				<h3>Temperature</h3>
				<img src="/plot/cities">
				
			</div>


			<div class="row">
				<h3>Debug</h3>
				<div class="col-md-9">
					<form method="POST" id="form">
						<input type="text" name="command" id="command">
						<button onclick="javascript: doAjaxCall(); return false;">Ajax</button>
						<button onclick="javascript: listen(); return false;">Listen</button>
					</form>
				</div>
				<div class="col-md-3">
					<input type="checkbox" id="speech" value="speech">
				</div>

			</div><!-- End div .row -->

			<div class="row">

			

				<div class="col-md-4">
					<ul id="commandHistory">
						<?php 
							$commands = array("office on", "office off", "kitchen on", "kitchen off", "all disco", "goodnight");
							foreach($commands as $command){ ?>
								<li onclick="javascript: jQuery('#command').val('<?=$command;?>'); doAjaxCall();"><?=$command;?></li>
							<?php 
							} 
						?>
					</ul>
				</div>
			</div>

		<script type="text/javascript">

		</script>


		<div>
			<iframe id="monitors" src="http://ct5130.myfoscam.org/peperompepepe" width="100%" height="70%"></iframe>
		</div>
		</div><!-- Class Container -->
	</body>
</html>
