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
