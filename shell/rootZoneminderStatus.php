<?php

$scriptName = 'rootZoneminderStatus';
include('pid.php');

$redis = new Redis();
$redis->connect('127.0.0.1');

$message = $redis->hGet('zoneminder','newStatus');
$redis->hdel('zoneminder', 'newStatus');

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

function setNadieEnCasa(){
	$redis = new Redis();
	$redis->connect('127.0.0.1');

	if($redis->hGet('zoneminder', 'status') == 'NadieEnCasa'){
		echo "Status is NadieEnCasa, not changing\n";
		return;
	}

	system("/usr/bin/zmpkg.pl NadieEnCasa");
	$redis->hset('zoneminder', 'status', 'NadieEnCasa');
}

function setPeriferia(){
	$redis = new Redis();
	$redis->connect('127.0.0.1');

	if($redis->hGet('zoneminder', 'status') == 'Periferia'){
		echo "Status is Periferia, not changing\n";
		return;
	}


	system("/usr/bin/zmpkg.pl Periferia");
	$redis->hset('zoneminder', 'status', 'Periferia');
}


