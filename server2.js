const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const db = require('./models');
const fs = require('fs');
const exphbs = require('express-handlebars');
const cassandra =  require('cassandra-driver');
const formidable = require('formidable');
const MemcachedStore = require("connect-memcached")(session);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    name: 'sid',
    path: '/',
    secret: 'ihateTwitter :(',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false,
    sameSite:true },
    store: new MemcachedStore({
      hosts: ["192.168.122.21:11211", "192.168.122.39:11211", "192.168.122.40:11211", "192.168.122.41:11211", "192.168.122.42:11211", "192.168.122.43:11211"],
      secret: "KWUPPYCAT" // Optionally use transparent encryption for memcache session data
    })
}));

app.use(express.static(__dirname+'/public'));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const client = new cassandra.Client({contactPoints:['127.0.0.1'], localDataCenter: 'datacenter1',keyspace:"hw6"});
mongoose.connect("mongodb://192.168.122.26/tweeter", { useUnifiedTopology: true, useNewUrlParser: true });

 app.post('/additem', (req, res)=>{
    if(req.session.userId){
       req.body.author = req.session.userId;
       req.body.username = req.session.username;
       if(req.body.content){
         let query = "SELECT id, user, parent from tweeter WHERE id IN ?"
        if(req.body.media)
          client.execute(query, [req.body.media]).then((result)=>{
            if(result.rowLength > 0){
              for(let i = 0; i <  result.rowLength; i++){
              let user = result.rows[i].user;
              let parent = result.rows[i].parent;
              if(parent !== "" || user !== req.session.username){
              res.status(401).json({status:"error", error:"Bad media"})
              return;}
            }
            for(let i = 0; i < result.rowLength; i++){
              client.execute("UPDATE tweeter SET parent = ? WHERE id = ?", ["TAKEN",result.rows[i].id]).then((result)=>{
              })
            }
            if(req.body.childType === "retweet")
              db.Tweet.create(req.body).then(tweet =>{
                let id = tweet._id;
                db.Tweet.updateOne({_id:req.body.parent},{$inc:{retweeted: 1, interest: 1}},(resp)=>{
                  db.User.updateOne({_id:req.session.userId},{ $push: {tweets: id} }, { new: true }).then((resp)=>{
                    res.status(200).json({status:"OK", id:id});
                  })
                 });
              })
            else
            db.Tweet.create(req.body).then((tweet) =>{
              let id = tweet._id;
              db.User.updateOne({_id:req.session.userId},{ $push: {tweets: id} }, { new: true }).then((resp)=>{
                if(req.body.childType === "reply")
                db.Tweet.updateOne({_id:req.body.parent},{ $push:{replies:id} }, {new: true}).then((resp)=>{res.status(200).json({status:"OK", id:id});});
                else
                res.status(200).json({status:"OK", id:id});
              })
          })
          }
          });
        //no media
        else
        if(req.body.childType === "retweet")    
              db.Tweet.create(req.body).then(tweet =>{
                db.Tweet.updateOne({_id:req.body.parent},{$inc:{retweeted: 1, interest: 1},},(resp)=>{
                  db.User.updateOne({_id:req.session.userId},{ $push: {tweets: id} }, { new: true }).then((resp)=>{
                    res.status(200).json({status:"OK", id:tweet._id});
                  })
                  });
              })
            else
            db.Tweet.create(req.body).then((tweet) =>{
              let id = tweet._id;
              db.User.updateOne({_id:req.session.userId},{ $push: {tweets: id} }, { new: true }).then((resp)=>{
                if(req.body.childType === "reply")
                db.Tweet.updateOne({_id:req.body.parent},{$push:{replies:id}}, { new: true }).then((resp)=>{res.status(200).json({status:"OK", id:tweet._id});});
                else
                res.status(200).json({status:"OK", id:id});
              })
          })
       }
       else
       res.status(401).json({status:"error", error:"NO CONTENT"})
     }
     else
     res.status(401).json({status:"error", error:"NOT LOGGED IN"})  
     
 });


//MILESTONE 2 STUFF
app.delete('/item/:id', (req, res)=>{
  if(req.session.userId)
  db.Tweet.find({_id: req.params.id}, 'media username').lean().then((data)=>{
    if(data.length === 0){
      res.status(401).json({status:"error"});
    }
    else{
    if(req.session.username !== data[0].username){
      res.status(401).json({status:"error"});}
      else{
        let query = "DELETE FROM tweeter WHERE id = ?";
      if(data[0].media)
      for(let i = 0; i < data[0].media.length; i++){
          client.execute(query, [data[0].media[i]]).then((err)=>{
            if(err)
            console.log(err)
          });
        }
        db.Tweet.deleteOne({_id:req.params.id}, (err)=>{
          if(err){
            res.status(401).json({status:"error"});
          }
          else{
            db.User.updateMany({username:req.session.username},{ $pull: {tweets: req.params.id} }).then((resp)=>{
              res.status(200).json({status:"OK"});
            })
          }    
        });
      }}
  }) 
  else
    res.status(401).json({status:"error"});
});


app.post("/addmedia", (req, res)=>{
  if(req.session.userId){
  new formidable.IncomingForm().parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error', err)
      throw err
    }
    let file =  files.content
    var id = file.name+String(Date.now())
    file.idds = id;
    file.user = req.session.username;
    let type = file.type;
    if(file.type){
      
    let name = file.name;
    var img = fs.readFileSync(file.path);
    var encode_image = img.toString('base64');
    var imgfile =new Buffer(encode_image, 'base64');
    var id = file.idds
    let query = 'INSERT INTO tweeter (id, filename, content, type, user, parent) VALUES (?, ?, ?, ?, ?, ?)';
    let params = [id, name , imgfile, type, file.user, ""]
    client.execute(query, params, { prepare: true })
    .then(result => {
        res.status(200).json({status:"OK", id: id});
    });}
    else
    res.status(401).json({status:"error"})
//     amqp.connect('amqp://localhost', function(error0, connection) {
//     if (error0) {
//         throw error0;
//     }
//       connection.createChannel(function(error1, channel) {
//         if (error1) {
//             throw error1;
//         }
//         var queue ='cassandra_queues';
//         channel.assertQueue(queue, {
//             durable: true
//         });
//         channel.sendToQueue(queue, Buffer.from(JSON.stringify(file)), {
//             persistent: true
//         });
//     });
//     setTimeout(function() { 
//       connection.close(); 
//       }, 100);
// });
   
  })
}
else{
res.status(401).json({status:"error"})}
});

app.get("/deletemedia",(req, res)=>{
    let query = 'TRUNCATE tweeter;';
    client.execute(query).then(res.json({status:"OK"}))
})

app.get("/media/:id", (req, res)=>{
  let query = 'SELECT content, type from tweeter WHERE id = ?';
    let params = [req.params.id];
    client.execute(query, params)
    .then(result => {
        if(result.rowLength > 0){
        let image = result.rows[0].content;
        let type = result.rows[0].type ? result.rows[0].type : "jpg"
        res.contentType(type).status(200).send(image);
    }
    else
      res.status(400).json({status:"ERROR", msg:"Media not found"});
    });
});

// Start the API server
app.listen(PORT, function() {
  console.log(`API Server now listening on PORT ${PORT}!`);
});