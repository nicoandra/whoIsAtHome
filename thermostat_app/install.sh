
HOST=`hostname`;

if [ "HOST" != "thermo1" ]; then
	
	echo "To be executed in the Raspberry Thermo only";
	ssh-copy-id pi@192.168.1.125

	TARGET_DIR="/home/pi/code/whoIsAtHome";
	ssh pi@192.168.1.125 'if [ ! -d "$TARGET_DIR" ]; then mkdir "$TARGET_DIR" -p; git clone git@github.com:nicoandra/whoIsAtHome.git "$TARGET_DIR" ; else cd "$TARGET_DIR"; git pull;	fi; cd "$TARGET_DIR"; cd thermostat_app; install.sh'
	exit 1;
fi;


echo "In Raspberry";
exit 1

sudo aptitude install autoconf;


cd;
mkdir tools -p
cd tools;

mkdir gpio-admin;
cd gpio-admin;
git clone git://github.com/quick2wire/quick2wire-gpio-admin.git
cd quick2wire-gpio-admin
make
sudo make install
sudo adduser $USER gpio
cd ..

mkdir pi-blaster
cd pi-blaster;
git clone https://github.com/sarfata/pi-blaster.git .
./autogen.sh
./configure
make  
sudo make install 



cp thermo-service /etc/init.d/thermo
chmod +x /etc/init.d/thermo;


