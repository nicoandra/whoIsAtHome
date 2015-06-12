<?php

function isScriptAlreadyRunning($scriptName){
	return file_exists('/tmp/'.$scriptName.'.pid');
}

function createPidFile($scriptName){
	$h = fopen('/tmp/'.$scriptName.'.pid', 'w');
	fwrite($h, time());
	fclose($h);
	return true;
}

function removePidFile($scriptName){
	echo "Going to unlink...";
	unlink('/tmp/'.$scriptName.'.pid');
}

if(isScriptAlreadyRunning($scriptName)){
	echo "Script already running\n";
	die();
}

createPidFile($scriptName);

if(isset($scriptName)){
	echo "Function registered";
	register_shutdown_function('removePidFile', $scriptName);
}

