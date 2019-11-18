const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
const path = require('path');
const db = require('./models');
const fs = require('fs');
const cassandra =  require('cassandra-driver');
const formidable = require('formidable');
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
    sameSite:true }
  }))

const client = new cassandra.Client({contactPoints:['127.0.0.1'], localDataCenter: 'datacenter1',keyspace:"hw6"});
// Serve up static assets (usually on heroku)
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/build"));
}

mongoose.connect("mongodb://localhost/tweeter", { useNewUrlParser: true });

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
       user: 'hnganMailingService356@gmail.com',
       pass: 'Cse356iscool'
    }
  });

app.get("/",(req, res)=>{
  res.sendFile(path.join(__dirname,"index.html"));
})

  app.post("/adduser", (req, res) => {
    db.User.find({username:req.body.username}, (err,resp) => {
      if(resp.length === 0){
        db.User.find({email:req.body.email}).then((data) =>{
         if(data.length === 0){
         db.User.create(req.body).then((dbmodel)=>{
           const message = {
             from: 'hnganMailingService356@gmail.com',
             to:req.body.email,
             subject:"hngan course project sign up!",
             text:`Welcome ${req.body.username} \n,
             Here is your validation key: <abracadabra>`
           }
           transporter.sendMail(message, function (err, info) {
             if(err)
               console.log(err)
             else
               console.log(info);
              });
              res.status(200).json({status:"OK"});
            })}
            else{
              res.status(500).json({status:"error"})
            }
          })}
         else{
           res.status(500).json({status:"error", error:"NOT LOGGED IN"})
         }
       })
      });

      app.post("/verify", (req, res) => {
        if(req.body.key === "abracadabra")
          db.User.updateOne({email:req.body.email}, {verified:true}).then(()=>{
            res.status(200).json({status:"OK"});
          });
        else
          res.status(500).json({status:"error", error:"INCORRECT KEY"});
      });
      
      app.post("/login", (req, res) => {
        var username = req.body.username;
        var password = req.body.password;
        db.User.find({username:username}, (err,resp) =>{
          if (resp.length === 0)
         res.status(200).json({status:"error", error:"INCORRECT USERNAME OR PASSWORD"});
         else{
          let user = resp[0];
          if(user.password === password && user.verified){
            req.session.userId = user._id;
            req.session.username = user.username
            res.status(200).json({status:"OK"})
          }
          else{
            res.status(200).json({status:"error", error:"INCORRECT USERNAME OR PASSWORD"})
          }}
        })
      });
    
    app.post("/logout",(req, res) => {
      req.session.destroy(err =>{
        if(err){
          res.status(500).json({status:"error"});
        }
        res.json({status:"OK"});
      })
    });
 
  app.get("/home", (req, res)=>{
    if(req.session.userId)
    res.sendFile(path.join(__dirname,"home.html"));
    else
    res.sendFile(path.join(__dirname,"error.html"));
  });
 app.post('/additem', (req, res)=>{
     if(req.session.userId){
       req.body.author = req.session.userId;
       req.body.username = req.session.username;
       if(req.body.content){
        db.Tweet.create(req.body).then((tweet) =>{
            let id = tweet._id;
            db.User.findOneAndUpdate({username:req.session.username},{ $push: {tweets: id} }, { new: true }).then((resp)=>{
              if(req.body.childType === "reply")
              db.Tweet.findOneAndUpdate({_id:req.body.parent},{$push:{replies:id}},(resp)=>{res.status(200).json({status:"OK", id:id});});
              else if(req.body.childType === "retweet")
              db.Tweet.findOneAndUpdate({_id:req.body.parent},{$inc:{retweeted: 1}, $inc:{intrest: 1}},(resp)=>{res.status(200).json({status:"OK", id:id});});
              else
              res.status(200).json({status:"OK", id:id});
            })
        })
       }
       else
       res.status(500).json({status:"error", error:"NO CONTENT"})
     }
     else
     res.status(500).json({status:"error", error:"NOT LOGGED IN"})  
     
 });
 
 app.get('/item/:id',(req, res)=>{
    db.Tweet.findById(req.params.id).then((data)=>{
      res.status(200).json({status:"OK", item:data})
        }).catch((err)=>{
          res.status(500).json({status:"error", error:err})  
        })
 });
 
 app.post('/search', (req, res)=>{
    let limit = req.body.limit ? parseInt(req.body.limit) : 25;
    let time = req.body.timestamp ? parseInt(req.body.timestamp) : Date.now()/1000;
    let query ={timestamp: {$lte: time}}
    let ranking = req.body.rank ==="time" ? "interest" : "timestamp"
    let reply = req.body.replies === undefined || req.body.replies === "false" ? "reply" : "takeitall"; 

    if(req.body.q != "" && req.body.q != undefined)
      query.content = { "$regex": req.body.q.split(" ").join("|"), "$options": "i" }
    if(req.body.username)
      query.username = req.body.username;
    else if(req.body.following === false || req.body.following ==="false"){
      db.Tweet.find(query).limit(limit).sort({ranking: -1}).lean().then((data)=>{
        if(data)
          res.json({status:"OK", items:data});
        });
    }
    else
    db.User.find({_id:req.session.userId}).then((data)=>{
      if(data[0])
      query.author = {$in: data[0].following}
      db.Tweet.find(query).where('username').ne(req.session.username).limit(limit).sort({ranking: -1}).lean().then((data)=>{
        if(data){
          res.json({status:"OK", items:data});}
            });
    })
    });

//MILESTONE 2 STUFF
app.delete('/item/:id', (req, res)=>{
  if(req.session.userId)
  db.Tweet.find({_id: req.params.id}).then((data)=>{
    if(data.length === 0){
      res.status(500).json({status:"error"});
    }
    else{
    if(req.session.username !== data[0].username){
      res.status(500).json({status:"error"});}
      else{
        db.Tweet.deleteOne({_id:req.params.id}, (err)=>{
          if(err){
            console.log("ERROR")
            res.status(500).json({status:"error"});
          }
          else{
            db.User.findOneAndUpdate({username:req.session.username},{ $pull: {tweets: req.params.id} }).then((resp)=>{
              res.status(200).json({status:"OK"});
            })
          }    
        });
      }}
  }) 
  else
    res.status(500).json({status:"error"});
});

app.get('/user/:username', (req, res)=>{
  db.User.find({username:req.params.username}).then(data=>{
    if(data.length === 0)
      res.status(500).json({status:"error"})
    else{
      let user = data[0];
      res.status(200).json({status:"OK", user:{email:user.email, followers:user.followers.length, following:user.following.length}})
    }
  })
});

app.get('/user/:username/posts', (req, res)=>{
  let limit = parseInt(req.query.limit) || 50
  limit = limit > 200 ? 200 : limit
db.User.find({username:req.params.username}).then((data)=>{
  if(data.length > 0){
    let user = data[0]
    let tweets = user.tweets.slice(0, limit);
    res.status(200).json({status:"OK", items:tweets});
  }
  else
    res.status(500).json({status:"error"})
})
});

app.get('/user/:username/followers', (req, res)=>{
  let limit = parseInt(req.query.limit) || 50
  limit = limit > 200 ? 200 : limit
  db.User.find({username:req.params.username}).populate({path:'followers',  options: {
    limit: limit}}).then((data)=>{
    if(data.length > 0){
      let followers = [];
      data[0].followers.forEach(follower => {
        followers.push(follower.username)
      });
      res.status(200).json({status:"OK", users:followers})
    }
  });
});

app.get('/user/:username/following', (req, res)=>{
  let limit = parseInt(req.query.limit) || 50
  limit = limit > 200 ? 200 : limit
  db.User.find({username:req.params.username}).populate({path:'following',  options: {
    limit: limit}}).then((data)=>{
    if(data.length > 0){
      let followings = [];
      data[0].following.forEach(following => {
        followings.push(following.username)
      });
      res.status(200).json({status:"OK", users:followings})
    }
  });
});

app.post('/follow', (req, res)=>{
if(req.session.userId && req.body.username && req.body.username !== req.session.username){
  let follow = true
  if(req.body.follow === false || req.body.follow === "false")
    follow = false
  if(follow){
    db.User.find({username: req.body.username}).then(data=>{
      if(data.length > 0 ){
        let user = data [0];
        if(user.followers.includes(req.session.userId))
          res.status(200).json({status:"OK"});
        else{
        db.User.findOneAndUpdate({username:req.body.username},{ $push: {followers: req.session.userId} }).then((resp)=>{
          db.User.findOneAndUpdate({username: req.session.username},{ $push: {following: user._id} }).then((resp)=>{
            res.status(200).json({status:"OK"});
          })        
        })
      }
      }
      else
        res.status(500).json({status:"error"});
    })
  }
  //unfollow
  else{
    db.User.find({username: req.body.username}).then(data=>{
      if(data.length > 0 ){
        let user = data [0];
        if(user.followers.includes(req.session.userId)){
          db.User.findOneAndUpdate({username:req.session.username},{ $pull: {following: user._id} }).then((resp)=>{
            db.User.findOneAndUpdate({username:user.username},{$pull:{followers:req.session.userId}}).then((resp)=>{
              res.status(200).json({status:"OK"});
            })
          })
        }   
        else
          res.status(200).json({status:"OK"});
      }
      else
        res.status(500).json({status:"error"});
    })
  }
}
else
res.status(500).json({status:"error"})
});

app.get("/user",(req, res)=>{
  if(req.session.userId)
  res.sendFile(path.join(__dirname,"users.html"));
  else
  res.sendFile(path.join(__dirname,"nusers.html"));
})

//MILESTONE 3 STUFF
app.post("/item/:id/like", (req, res)=>{
  if(req.session.userId){
    let like = true
    if(req.body.like === false || req.body.like === "false")
      like = false
    if(like){
      db.Tweet.find({_id:req.params.id}).then(data=>{
        if(data.length > 0 ){
          let tweet = data [0];
          if(tweet.users.includes(req.session.userId))
            res.status(200).json({status:"OK"});
          else{
          let likes = tweet.property.likes + 1;
          db.Tweet.findOneAndUpdate({_id:req.params.id},{ 'property.likes':likes,$push: {users: req.session.userId}, $inc:{interest: 1} }).then((resp)=>{
              res.status(200).json({status:"OK"});       
          })
        }
        }
        else
          res.status(500).json({status:"error"});
      })
    }
    //unlike
    else{
      db.Tweet.find({_id: req.params.id}).then(data=>{
        if(data.length > 0 ){
          let tweet = data [0];
          if(tweet.users.includes(req.session.userId)){
            let likes = tweet.property.likes - 1;
            db.Tweet.findOneAndUpdate({_id:req.params.id},{'property.likes': likes, $pull: {users: req.session.userId},$inc:{interest: -1} }).then((resp)=>{
                res.status(200).json({status:"OK"});
            })
          }   
          else
            res.status(200).json({status:"OK"});
        }
        else
          res.status(500).json({status:"error"});
      })
    }
  }
  else
  res.status(500).json({status:"error"})
});

app.post("/addmedia", (req, res)=>{
  new formidable.IncomingForm().parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error', err)
      throw err
    }
    let query = 'INSERT INTO imgs (filename, contents, type) VALUES (?, ?, ?)';
    let name = fields.filename;
    let file = files.contents;
    let type = file.type;
    var img = fs.readFileSync(file.path);
    var encode_image = img.toString('base64');
    var imgfile =new Buffer(encode_image, 'base64')
    let params = [name , imgfile, type]
    client.execute(query, params, { prepare: true })
    .then(result => console.log(result));
    res.status(200).json({status:"OK"});
  })
});

app.get("/media/:id", (req, res)=>{
  let query = 'SELECT contents, type from imgs WHERE id = ?';
    let params = [req.params.ids];
    client.execute(query, params)
    .then(result => {
        if(result.rowLength > 0){
        let image = result.rows[0].contents;
        res.contentType(result.rows[0].type).status(200).send(image);
    }
    ;});
});

// Start the API server
app.listen(PORT, function() {
  console.log(`API Server now listening on PORT ${PORT}!`);
});
