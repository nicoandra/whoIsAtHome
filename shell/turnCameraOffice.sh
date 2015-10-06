#!/bin/bash

if [ "$1" == "window" ]; then
	wget "http://192.168.1.124/decoder_control.cgi?command=4&user=admin&pwd=admin" -O- > /dev/null;
else
	wget "http://192.168.1.124/decoder_control.cgi?command=6&user=admin&pwd=admin" -O- > /dev/null;
fi;
sleep 16;

wget "http://192.168.1.124/decoder_control.cgi?command=1&user=admin&pwd=admin" -O- > /dev/null;

