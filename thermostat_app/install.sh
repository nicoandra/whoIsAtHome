sudo aptitude install autoconf;

mkdir tools
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

