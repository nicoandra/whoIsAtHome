<?php

require_once('inc/config.php');
require_once('programs.php');

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
