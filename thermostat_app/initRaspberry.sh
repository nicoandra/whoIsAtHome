#!/bin/bash

sudo apt-get update;
sudo apt-get upgrade;
sudo apt-get install git aptitude;


curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs



cd ~
cd code
wget http://www.airspayce.com/mikem/bcm2835/bcm2835-1.50.tar.gz 

tar zxvf bcm2835-1.50.tar.gz
cd bcm2835-1.50
./configure
make -j2
sudo make check
sudo make install