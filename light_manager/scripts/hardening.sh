#!/bin/bash

## Create special group

my setup... you need to forward port 80 or 443 with your firewall to a unprivileged port of your app or use a proxy i recommend nginx

HOME=/usr/local/ghostblogs/ su -m -c staff www -c 'NODE_ENV=production pm2  start domain.name/index.js --name "domain.name"'
pm2 startup freebsd -u www --hp /usr/local/ghostblogs/
chmod +x /etc/rc.d/pm2
echo 'pm2_enable="YES"' >> /etc/rc.conf
sed -i '' 's/home\/${pm2_user}/usr\/local\/ghostblogs/g' /etc/rc.d/pm2
sed -i '' 's/su - /HOME=\/usr\/local\/ghostblogs\/; PATH=\/usr\/local\/sbin:\/usr\/local\/bin:\/usr\/sbin:\/usr\/bin; su -m -c staff /g' /etc/rc.d/pm2
after you can use it like

service pm2 status

┌──────────────┬────┬──────┬───────┬────────┬─────────┬────────┬─────────────┬──────────┐
│ App name     │ id │ mode │ pid   │ status │ restart │ uptime │ memory      │ watching │
├──────────────┼────┼──────┼───────┼────────┼─────────┼────────┼─────────────┼──────────┤
│ domain.name  │ 0  │ fork │ 38337 │ online │ 23      │ 74m    │ 94.727 MB   │ disabled │
└──────────────┴────┴──────┴───────┴────────┴─────────┴────────┴─────────────┴──────────┘
ps aux | grep node
www   38271   0.0  4.7 632740 35960  -  Ss    1:42PM     0:02.26 PM2 v1.0.0: God Daemon (node)
www   38337   0.0 12.7 682780 96580  -  Is    1:43PM     0:03.63 node /usr/local/ghostblogs/domain.name/index.j
