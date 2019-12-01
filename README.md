FOR CASSANDRA SETUP: https://linuxize.com/post/how-to-install-apache-cassandra-on-ubuntu-18-04/

Cassandra Table: 
CREATE KEYSPACE hw6
CREATE TABLE tweeter ( 
  id text PRIMARY KEY, 
  filename text, 
  type text,
  content Blob,
  user text,
  parent text );

NEED TO APT INSTALL: NODEJS NGINX NPM MONGODB CASSANDRA
NEED TO NPM INSTALL GLOBAL: PM2

https://computingforgeeks.com/how-to-install-and-configure-postfix-as-a-send-only-smtp-server-on-ubuntu-18-04-lts/
https://stackoverflow.com/questions/32264946/sending-email-from-local-host-with-nodemailer/54103349#54103349
