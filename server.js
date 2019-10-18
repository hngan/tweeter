const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
const db = require('./models');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createServer({});
const app = express();
const PORT = process.env.PORT || 3001;
 
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
           res.status(500).json({status:"ERROR"})
         }
       })}
      else{
        res.status(500).json({status:"ERROR"})
      }
    })
   });
   
   app.post("/verify", (req, res) => {
     if(req.body.key === "abracadabra")
       db.User.updateOne({email:req.body.email}, {verified:true}).then(()=>{
         res.status(200).json({status:"OK"});
       });
     else
       res.status(500).json({status:"ERROR"});
   });
   
   app.post("/login", (req, res) => {
     var username = req.body.username;
     var password = req.body.password;
     db.User.find({username:username}, (err,resp) =>{
       let user = resp[0];
       if(user.password === password && user.verified){
         req.session.userId = user._id;
         res.status(200).json({status:"OK"})
       }
       else{
         console.log("login failed");
         res.status(500).json({status:"ERROR"})
       }
     })
   });
   
   app.post("/logout",(req, res) => {
     req.session.destroy(err =>{
       if(err){
         res.status(500).json({status:"ERROR"});
       }
       res.json({status:"OK"});
     })
   });

app.post('/additem', (req, res)=>{
    if(req.session.userId){
			req.body.author = req.session.userId;
       db.Tweet.create(req.body).then((tweet) =>{
           let id = tweet._id;
           db.User.findOneAndUpdate({username:req.session.userId},{ $push: { tweets: id } }, { new: true }).then((resp)=>{
               res.json({status:"OK", id:id});
           })
       })
        
    }
    else
    res.status(500).json({status:"ERROR"})  
    
});

app.get('/item/:id',(req, res)=>{
    if(req.session.userId){
       db.Tweet.find({id:req.params.id}).then((data)=>{
        if(data.length < 1)
         res.json({status:"ERROR"});
         else
					res.json({status:"OK", item:data[0]})
       });
        
    }
    else
    res.status(500).json({status:"ERROR"}) 
});

app.post('/search', (req, res)=>{
    if(req.session.userId){
			let limit = req.body.limit || 25;
			let time = req.body.timestamp || Date.now();
       db.Tweet.find({timestamp: {$lte: time}}).limit(limit).sort({timestamp: -1}).then((data)=>{
					res.json({status:"OK", items:data[0]});
			 });
        
    }
    else
    res.status(500).json({status:"ERROR"}) 
});

// Start the API server
app.listen(PORT, function() {
  console.log(`API Server now listening on PORT ${PORT}!`);
});