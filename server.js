const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
const path = require('path');
const db = require('./models');
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
      console.log(data);
      data.id = data._id;
      res.status(200).json({status:"OK", item:data})
        }).catch((err)=>{
          res.status(500).json({status:"error", error:err})  
        })
 });
 
 app.post('/search', (req, res)=>{
    let limit = req.body.limit ? parseInt(req.body.limit) : 25;
    let time = req.body.timestamp ? parseInt(req.body.timestamp) : Date.now()/1000;
    let query ={timestamp: {$lte: time}}
    console.log(req.body.q);
    if(req.body.q != "" && req.body.q != undefined)
      query.content = { "$regex": req.body.q.split(" ").join("|"), "$options": "i" }
    if(req.body.username)
      query.username = req.body.username;
    if(req.body.following === false || req.body.following ==="false"){
      db.Tweet.find(query).limit(limit).sort({timestamp: -1}).then((data)=>{
        if(data){
          for(let i = 0; i< data.length; i++){
            data[i].id = data[i]._id
            }
          res.json({status:"OK", items:data});}
            });
    }
    else
    db.User.find({_id:req.session.userId}).then((data)=>{
      if(data[0])
      query.author = {$in: data[0].following}
      console.log(query);
      db.Tweet.find(query).where('username').ne(req.session.username).limit(limit).sort({timestamp: -1}).then((data)=>{
        if(data){
          for(let i = 0; i< data.length; i++){
            data[i].id = data[i]._id
            }
          res.json({status:"OK", items:data});}
            });
    })
    });

//MILESTONE 2 STUFF
app.delete('/item/:id', (req, res)=>{
  if(req.session.id)
  db.Tweet.deleteOne({_id:req.params.id, username:req.session.username}, (err)=>{
    if(err)
      res.status(500).json({status:"error"});
    else{
      db.User.findOneAndUpdate({username:req.session.username},{ $pull: {tweets: req.params.id} }).then((resp)=>{
        res.status(200).json({status:"OK"});
      })
      res.status(200).json({status:"OK"});
    }    
  });
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
  let limit = parseInt(req.body.limit) || 50
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
  let limit = parseInt(req.body.limit) || 50
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
  let limit = parseInt(req.body.limit) || 50
  limit = limit > 200 ? 200 : limit
  db.User.find({username:req.params.username}).populate({path:'following',  options: {
    limit: limit}}).then((data)=>{
    if(data.length > 0){
      let following = [];
      data[0].following.forEach(following => {
        followers.push(following.username)
      });
      res.status(200).json({status:"OK", users:following})
    }
  });
});

app.post('/follow', (req, res)=>{
if(req.session.id){
  if(req.body.username){
  let follow = req.body.follow || true
  if(follow){
    db.User.find({username: req.body.username}).then(data=>{
      if(data.length > 0 ){
        let user = data [0];
        if(user.followers.includes(req.sessions.id))
          res.status(500).json({status:"error"});
        else
        db.User.findOneAndUpdate({username:req.session.username},{ $push: {followers: req.session.id} }).then((resp)=>{
          res.status(200).json({status:"OK"});
        })
      }
      else
        res.status(500).json({status:"error"});
    })
  }
  else{
    db.User.find({username: req.body.username}).then(data=>{
      if(data.length > 0 ){
        let user = data [0];
        if(user.followers.includes(req.sessions.id)){
          db.User.findOneAndUpdate({username:req.session.username},{ $pull: {followers: req.session.id} }).then((resp)=>{
            res.status(200).json({status:"OK"});
          })
        }   
        else
          res.status(500).json({status:"error"});
      }
      else
        res.status(500).json({status:"error"});
    })
  }
  }
}
else
res.status(500).json({status:"error"})
});

// Start the API server
app.listen(PORT, function() {
  console.log(`API Server now listening on PORT ${PORT}!`);
});
