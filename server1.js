const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
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
      hosts: ["192.168.122.21:11211", "192.168.122.26:11211", "192.168.122.39:11211", "192.168.122.40:11211", "192.168.122.41:11211", "192.168.122.42:11211", "192.168.122.43:11211"],
      secret: "KWUPPYCAT" // Optionally use transparent encryption for memcache session data
    })
}));

app.use(express.static(__dirname+'/public'));
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

const client = new cassandra.Client({contactPoints:['130.245.171.181'], localDataCenter: 'datacenter1',keyspace:"hw6"});
mongoose.connect("mongodb://192.168.122.26/tweeter", { useUnifiedTopology: true, useNewUrlParser: true });

var transporter = nodemailer.createTransport({
     port: 25,
    host: 'localhost',
    tls: {
      rejectUnauthorized: false
    },
  });

  app.post("/adduser", (req, res) => {
    db.User.find({$or: [{username:req.body.username}, {email:req.body.email}]}, "email username").lean().then((resp) => {
      if(resp.length === 0){
        db.User.create(req.body).then((dbmodel)=>{
            const message = {
                from: 'hnganMailingService356@gmail.com',
                to: req.body.email,
                subject:"hngan course project sign up!",
                text:`Welcome\n,
                Here is your validation key: <abracadabra>`
            }
            transporter.sendMail(message, function (err, info) {
                if(err)
                console.log("mail err",err)
            });   
            res.status(200).json({status:"OK"});
        })
    }
         else{
           res.status(401).json({status:"error", error:"NOT LOGGED IN"})
         }
       })
      });

      app.post("/verify", (req, res) => {
        if(req.body.key === "abracadabra")
          db.User.updateMany({email:req.body.email}, {verified:true}, {multi:true}).then((result)=>{
            if(result.n < 1)
            res.status(401).json({status:"error", error:"Fake user"});
            else
            res.status(200).json({status:"OK"});
          });
        else
          res.status(401).json({status:"error", error:"INCORRECT KEY"});
      });
      
      app.post("/login", (req, res) => {
        var username = req.body.username;
        var password = req.body.password;
        db.User.find({username:username},'username password verified').lean().then((resp) =>{
         if (resp.length === 0)
         res.status(401).json({status:"error", error:"INCORRECT USERNAME OR PASSWORD"});
         else{
          let user = resp[0];
          if(user.password === password && user.verified){
            req.session.userId = user._id;
            req.session.username = user.username
		        res.status(200).json({status:"OK"})
          }
          else{
            res.status(401).json({status:"error", error:"INCORRECT USERNAME OR PASSWORD"})
          }}
        })
      });
    
    app.post("/logout",(req, res) => {
      req.session.destroy(err =>{
        if(err){
          res.status(401).json({status:"error"});
        }
        res.json({status:"OK"});
      })
    });
 
 app.post('/additem', (req, res)=>{
    if(req.session.userId){
       req.body.author = req.session.userId;
       req.body.username = req.session.username;
       if(req.body.childType === "retweet" || req.body.childType === "reply"){
        if(req.body.parent=== null || req.body.parent === undefined || req.body.parent ==="")
        res.status(401).json({status:"error", error:"NO PARENT"})
        return
      }
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
              
              client.execute("UPDATE tweeter SET parent = ? WHERE id = ?", ["TAKEN",result.rows[i].id]).then((result)=>{{
                if(i === result.rowLength -1){
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
          })}
        }
              });

            }
          }
          });
        //no media
        else
        if(req.body.childType === "retweet")    
              db.Tweet.create(req.body).then(tweet =>{
                let id = tweet._id;
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
 
 app.get('/item/:id',(req, res)=>{
    db.Tweet.findById(req.params.id).lean().then((data)=>{
      data.id = data._id
      res.status(200).json({status:"OK", item:data})
        }).catch((err)=>{
          console.log(err);
          res.status(401).json({status:"error", error:err})  
        })
 });
 
 function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

 app.post('/search', (req, res)=>{
    let limit = req.body.limit ? parseInt(req.body.limit) : 25;
    let time = req.body.timestamp ? parseInt(req.body.timestamp) : Date.now()/1000;
    let query ={timestamp: {$lte: time}} //START OF QUERY
    let ranking = req.body.rank === "time" ? {"timestamp":-1} : {"interest": -1} //ORDER BY INTEREST OR TIME
    if(req.body.hasMedia)
      query["media.0"] = { "$exists": true }
    if(req.body.q != "" && req.body.q != undefined){
      let q = escapeRegExp(req.body.q);
      query.content = { "$regex": q.split(" ").join("|"), "$options": "i" }}
    if(req.body.replies == false || req.body.replies ==="false"){
      query.childType = {$ne: "reply"}
    }
    else{
      if(req.body.parent !== "")
        query.parent = req.body.parent
    }
    if(req.body.username)
      query.username = req.body.username;
    //general search
    if(req.body.following === false || req.body.following ==="false"){
      db.Tweet.find(query).limit(limit).sort(ranking).lean().then((data)=>{
        if(data){
        if(data.length === 0)
          console.log("EMPTY SEARCH?", query)
          res.json({status:"OK", items: data})};
        });
    }
    else
    //followers only search
    db.User.find({_id:req.session.userId}, 'following').lean().then((data)=>{
      if(data[0])
      query.author = {$in: data[0].following}
      db.Tweet.find(query).where('username').ne(req.session.username).limit(limit).sort(ranking).lean().then((data)=>{
        if(data){
          if(data.length === 0)
          console.log("EMPTY SEARCH?", query)
          res.json({status:"OK followers", items:data});}
            });
    }).catch(err=>{
      res.status(401).json({status:"error"});
    })
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
  }).catch(err=>{
    res.status(401).json({status:"error"});
  }) 
  else
    res.status(401).json({status:"error"});
});

app.get('/user/:username', (req, res)=>{
  db.User.find({username:req.params.username}, 'email followers following').lean().then(data=>{
    if(data.length === 0)
      res.status(401).json({status:"error"})
    else{
      let user = data[0];
      res.status(200).json({status:"OK", user:{email:user.email, followers:user.followers.length, following:user.following.length}})
    }
  })
});

app.get('/user/:username/posts', (req, res)=>{
  let limit = parseInt(req.query.limit) || 50
  limit = limit > 200 ? 200 : limit
db.User.find({username:req.params.username}, 'tweets').lean().then((data)=>{
  if(data.length > 0){
    let user = data[0]
    let tweets = user.tweets.slice(0, limit);
    res.status(200).json({status:"OK", items:tweets});
  }
  else
    res.status(401).json({status:"error"})
})
});

app.get('/user/:username/followers', (req, res)=>{
  let limit = parseInt(req.query.limit) || 50
  limit = limit > 200 ? 200 : limit
  db.User.find({username:req.params.username}).populate({path:'followers',  options: {
    limit: limit}}).lean().then((data)=>{
    if(data.length > 0){
      let followers = [];
      data[0].followers.forEach(follower => {
        followers.push(follower.username)
      });
      res.status(200).json({status:"OK", users:followers})
    }
    else
    res.status(401).json({status:"error"})
  });
});

app.get('/user/:username/following', (req, res)=>{
  let limit = parseInt(req.query.limit) || 50
  limit = limit > 200 ? 200 : limit
  db.User.find({username:req.params.username}).populate({path:'following',  options: {
    limit: limit}}).lean().then((data)=>{
    if(data.length > 0){
      let followings = [];
      data[0].following.forEach(following => {
        followings.push(following.username)
      });
      res.status(200).json({status:"OK", users:followings})
    }
    else
    res.status(401).json({status:"error"})
  });
});

app.post('/follow', (req, res)=>{
if(req.session.userId && req.body.username && req.body.username !== req.session.username){
  let follow = true
  if(req.body.follow === false || req.body.follow === "false")
    follow = false
  if(follow){
    db.User.find({username: req.body.username}).lean().then(data=>{
      if(data.length > 0 ){
        let user = data [0];
        if(user.followers.includes(req.session.userId))
          res.status(200).json({status:"OK"});
        else{
        db.User.updateMany({username:req.body.username},{ $push: {followers: req.session.userId} }).then((resp)=>{
          db.User.updateMany({username: req.session.username},{ $push: {following: user._id} }).then((resp)=>{
            res.status(200).json({status:"OK"});
          })        
        })
      }
      }
      else
        res.status(401).json({status:"error"});
    })
  }
  //unfollow
  else{
    db.User.find({username: req.body.username}).lean().then(data=>{
      if(data.length > 0 ){
        let user = data [0];
        if(user.followers.includes(req.session.userId)){
          db.User.updateMany({username:req.session.username},{ $pull: {following: user._id} }).then((resp)=>{
            db.User.updateMany({username:user.username},{$pull:{followers:req.session.userId}}).then((resp)=>{
              res.status(200).json({status:"OK"});
            })
          })
        }   
        else
          res.status(200).json({status:"OK"});
      }
      else
        res.status(401).json({status:"error"});
    })
  }
}
else
res.status(401).json({status:"error"})
});

//MILESTONE 3 STUFF
app.post("/item/:id/like", (req, res)=>{
  if(req.session.userId){
    let like = true
    if(req.body.like === false || req.body.like === "false")
      like = false
    if(like){
      db.Tweet.find({_id:req.params.id}, "users property").then(data=>{
        if(data.length > 0 ){
          let tweet = data [0];
          if(tweet.users.includes(req.session.userId))
            res.status(200).json({status:"OK"});
          else{
          let likes = tweet.property.likes + 1;
          db.Tweet.updateOne({_id:req.params.id},{ 'property.likes':likes,$push: {users: req.session.userId}, $inc:{interest: 1} }).then((resp)=>{
              res.status(200).json({status:"OK"});       
          })
        }
        }
        else
          res.status(401).json({status:"error"});
      }).catch(err=>{
        res.status(401).json({status:"error"});
      })
    }
    //unlike
    else{
      db.Tweet.find({_id: req.params.id}, "users property").then(data=>{
        if(data.length > 0 ){
          let tweet = data [0];
          if(tweet.users.includes(req.session.userId)){
            let likes = tweet.property.likes - 1;
            db.Tweet.updateOne({_id:req.params.id},{'property.likes': likes, $pull: {users: req.session.userId},$inc:{interest: -1} }).then((resp)=>{
                res.status(200).json({status:"OK"});
            })
          }   
          else
            res.status(200).json({status:"OK"});
        }
        else
          res.status(401).json({status:"error"});
      }).catch(err=>{
        res.status(401).json({status:"error"});
      })
    }
  }
  else
  res.status(401).json({status:"error"})
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
      console.log("added");
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

// amqp.connect('amqp://localhost', function(error, connection) {
//     connection.createChannel(function(error, channel) {
//         var queue = 'cassandra_queues';
//         channel.assertQueue(queue, {
//             durable: true
//         });
//         channel.prefetch(1);
//         console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
//         channel.consume(queue, function(files) {
//           file = JSON.parse(files.content.toString())
          
//           channel.ack(files);
//         }, {
//             noAck: false
//         });
//     });
// });

// amqp.connect('amqp://localhost', function(error, connection) {
//     connection.createChannel(function(error, channel) {
//         var queue = 'signup_queue';
//         channel.assertQueue(queue, {
//             durable: true
//         });
//         channel.prefetch(1);
//         console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
//         channel.consume(queue, function(files) {
//           let newUser =JSON.parse(files.content.toString())
//           db.User.create(newUser).then((dbmodel)=>{})
//             channel.ack(files);
//             const message = {
//               from: 'hnganMailingService356@gmail.com',
//               to:newUser.email,
//               subject:"hngan course project sign up!",
//               text:`Welcome ${newUser.username} \n,
//               Here is your validation key: <abracadabra>`
//             }
//             transporter.sendMail(message, function (err, info) {
//               if(err)
//                 console.log(err)
//                });   
//           })
//         }, {
//             noAck: false
//         });
//     });
// });









































//UI STUFF
app.get("/",(req, res)=>{
  res.render("index");
})

app.get("/login",(req, res)=>{
  res.render("login")
});

app.get("/register",(req, res)=>{
  res.render("signup")
});

app.get("/verify",(req, res)=>{
  res.render("verify")
});

app.get("/additem",(req, res)=>{
  res.render("additem")
});

app.get("/searchpage",(req, res)=>{
  if(req.session.id){
    res.render("ssearch")
  }
  else
    res.render("search")
});

app.get("/getuser",(req, res)=>{
  res.render("user")
});

app.get("/getuserfollowers",(req, res)=>{
  res.render("followers")
});

app.get("/getuserposts",(req, res)=>{
  res.render("posts")
});

app.get("/getuserfollowing",(req, res)=>{
 res.render("following");
});

app.get("/getitem",(req, res)=>{
  res.render("getitem")
});

app.get("/getmedia",(req, res)=>{
  res.render("getmedia");
});

app.get("/likeuser",(req, res)=>{
  res.render("like")
});

app.get("/deleteitem",(req, res)=>{
  res.render("delete")
});

app.get("/follow",(req, res)=>{
  res.render("follow");
})
// Start the API server
app.listen(PORT, function() {
  console.log(`API Server now listening on PORT ${PORT}!`);
});