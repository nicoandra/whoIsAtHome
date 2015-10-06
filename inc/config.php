<?php
require_once('milight.php');
require_once('ping.php');

class Config {
	static public $config;

	static public function init(){
		self::$config['redis'] = array(
				'host' => '127.0.0.1',
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
			self::$connection = new Redis();
			self::$connection->connect($config['host'], $config['port']);
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
	// Return true or false from cache:
	$redis = RedisConn::getConnection();
	$ip = '192.168.1.141';
	$status = $redis->hGet('deviceStatus', $ip.'.status');
	$expire = $redis->hGet('deviceStatus', $ip.'.expire');

	if($expire + 10 > time()){
		return $status == 'online';
	}

	$ping = new \JJG\Ping('192.168.1.141', 1);
	$return = $ping->ping() ? true : false;
	$status = $return ? 'online' : 'offline';
	$redis->hMSet('deviceStatus', array($ip.'.status' => $status, $ip.'.expire' => time()));
	return $return;
}



function makeNicoOutForHours($hours){
	$hours = (int) $hours;
        $redis = RedisConn::getConnection();
        $ip = '192.168.1.141';
        $redis->hMSet('deviceStatus', array($ip.'.status' => 'offline', $ip.'.expire' => time() + 3600 * $hours));
}

function makeNicoInForHours($hours){
        $hours = (int) $hours;
        $redis = RedisConn::getConnection();
        $ip = '192.168.1.141';
        $redis->hMSet('deviceStatus', array($ip.'.status' => 'online', $ip.'.expire' => time() + 3600 * $hours));
}


