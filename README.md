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

NEED TO APT INSTALL: NODEJS NGINX NPM MONGODB CASSANDRA POSTFIX MEMCACHE
NEED TO NPM INSTALL GLOBAL: PM2

https://computingforgeeks.com/how-to-install-and-configure-postfix-as-a-send-only-smtp-server-on-ubuntu-18-04-lts/
https://stackoverflow.com/questions/32264946/sending-email-from-local-host-with-nodemailer/54103349#54103349
https://tecadmin.net/install-rabbitmq-server-on-ubuntu/

CONFIGURE POSTFIX AND MEMCACHE
POSTFIX FILE: /etc/postfix/main.cf
MEMCACHE FILE: /etc/memcached.conf

git config --global credential.helper "cache --timeout=360000"

https://www.linode.com/docs/databases/mongodb/build-database-clusters-with-mongodb/

sh.enableSharding("tweeter")

db.users.ensureIndex( { _id : "hashed" } )

db.tweets.ensureIndex( { _id : "hashed" } )


for (var i = 1; i <= 10; i++) db.tweets.insert( { x : i } )
db.users.getShardDistribution()


sh.shardCollection( "tweeter.tweets", { "_id" : "hashed" } )
sh.shardCollection( "tweeter.users", { "_id" : "hashed" } )

upstream blah{
server 192.168.122.21:3000;
server 192.168.122.26:3000;
server 192.168.122.28:3000;
server 192.168.122.30:3000;
server 192.168.122.31:3000;
server 192.168.122.32:3000;
server 192.168.122.34:3000;
server 192.168.122.35:3000;
}
server {
    listen 80;
    server_name 130.245.171.151;

    location / {
        proxy_pass http://blah;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }
}



# where to write logging data.
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongos.log

# network interfaces
net:
  port: 27017
  bindIp: 192.0.2.4

sharding:
configDB: configReplSet/mongo-config-1:27019



192.168.122.21 mongo-config-1
192.168.122.42 mongo-config-2
192.168.122.39 mongo-shard-1
192.168.122.40 mongo-shard-2
192.168.122.26 mongo-query-router
192.168.122.37 mongo-shard-3
192.168.122.41 mongo-shard-3
192.168.122.42 mongo-shard-4
192.168.122.43 mongo-shard-5



upstream blah{
server 192.168.122.21:3000;
server 130.245.171.177;
server 130.245.171.179;
}
server {
    listen 80;
    server_name 130.245.171.151;

    location /additem {
        proxy_pass http://blah;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }

     location /item {
        proxy_pass http://blah;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }

     location /media {
        proxy_pass http://blah;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }

     location /addmedia {
        proxy_pass http://blah;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }

    location / {
        proxy_pass http://130.245.171.181;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
     }
}  
