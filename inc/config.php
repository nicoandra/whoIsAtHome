<?php
require_once('inc/milight.php');
require_once('inc/ping.php');

class Config {
	static public $config;

	static public function init(){
		self::$config['redis'] = array(
				'host' => 'zoneminder.home',
				'port' => 6379,
				'db' => 0
		);
	}
}


Config::init();

class RedisConn {
	static private $connection = false;

	static public function getConnection(){
		if(!self::$connection){
			$config = Config::$config['redis'];
			self::$connection = new Redis($config['host'], $config['port']);
		}
		return self::$connection;
	}
}

class MiLightHome {

	static private $milight = false;

	static public function getInstance(){
		return new Milight('192.168.1.148');

		
		if(!self::$milight){
			self::$milight = new Milight('192.168.1.148');
		}
		return self::$milight;
	}
}



function isNicoAtHome(){
	$ping = new \JJG\Ping('192.168.1.141', 1);
	return $ping->ping() ? true : false;
}