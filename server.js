const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const nodemailer = require('nodemailer');
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
  res.send("HELLO");
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

app.post('/additem', (req, res)=>{
    if(req.session.userId){
      req.body.author = req.session.userId;
      console.log(req.session.username);
      req.body.username = req.session.username;
      if(req.body.content){
       db.Tweet.create(req.body).then((tweet) =>{
           let id = tweet._id;
           db.User.findOneAndUpdate({username:req.session.userId},{ $push: { tweets: id } }, { new: true }).then((resp)=>{
               res.json({status:"OK", id:id});
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
  console.log(req.params.id)
       db.Tweet.findById(req.params.id).then((data)=>{
         console.log(data);
         data.id = data._id;
					res.status(200).json({status:"OK", item:data})
          }).catch((err)=>{
            res.status(500).json({status:"error", error:err})  
          })
});

app.post('/search', (req, res)=>{
			let limit = req.body.limit || 25;
			let time = req.body.timestamp || Date.now()/1000;
       db.Tweet.find({timestamp: {$lte: time}}).limit(limit).sort({timestamp: -1}).then((data)=>{
         if(data){
         for(let i = 0; i< data.length; i++){
         data[i].id = data[i]._id
      }
					res.json({status:"OK", items:data});}
			 });
});

// Start the API server
app.listen(PORT, function() {
  console.log(`API Server now listening on PORT ${PORT}!`);
});