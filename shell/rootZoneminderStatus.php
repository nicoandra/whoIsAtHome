<?php

$scriptName = 'rootZoneminderStatus';
include('pid.php');

$redis = new Redis();
$redis->connect('127.0.0.1');


function handleMessages($redis, $channel, $message){
	list($command, $hash) = explode('-',$message.'-');

	if(!strlen($hash)){
		echo "Invalid hash for command {$command}\n";
		return;
	}

	switch($command){
		case "NadieEnCasa":
			setNadieEnCasa();
			break ;
		case "Periferia":
			setPeriferia();
			break;
	}
}


function setNadieEnCasa(){
	system("/usr/bin/zmpkg.pl NadieEnCasa");
}

function setPeriferia(){
	system("/usr/bin/zmpkg.pl Periferia");
}

$redis->subscribe(array('zoneminder.status'), 'handleMessages');

