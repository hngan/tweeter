FOR CASSANDRA SETUP: https://linuxize.com/post/how-to-install-apache-cassandra-on-ubuntu-18-04/

Cassandra Table: 
CREATE KEYSPACE hw6
  WITH REPLICATION = { 
   'class' : 'NetworkTopologyStrategy', 
   'datacenter1' : 1 
  } ;

CREATE TABLE tweeter ( 
  id text PRIMARY KEY, 
  filename text, 
  type text,
  content Blob,
  user text,
  parent text );

NEED TO APT INSTALL: NODEJS NGINX NPM MONGODB CASSANDRA RABBITMQ POSTFIX MEMCACHE
NEED TO NPM INSTALL GLOBAL: PM2

https://computingforgeeks.com/how-to-install-and-configure-postfix-as-a-send-only-smtp-server-on-ubuntu-18-04-lts/
https://stackoverflow.com/questions/32264946/sending-email-from-local-host-with-nodemailer/54103349#54103349
https://tecadmin.net/install-rabbitmq-server-on-ubuntu/

CONFIGURE POSTFIX AND MEMCACHE
POSTFIX FILE: /etc/postfix/main.cf
MEMCACHE FILE: /etc/memcached.conf

# where to write logging data.
systemLog:
destination: file
logAppend: true
path: /var/log/mongodb/mongos.log

# network interfaces
net:
port: 27017
bindIp: 192.168.122.22

sharding:
configDB: configReplSet/mongo-config-1:27019,mongo-config-2:27019,