require('dotenv').config()
const express= require('express')
const bodyParser= require('body-parser')
const mongoose =require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose =require('passport-local-mongoose')
const app =express()
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const flash= require('express-flash')
const { rmdirSync } = require('fs')
const random = require('mongoose-simple-random')
const bcrypt =require('bcrypt')
const initializePassport= require('./passport-config')
const _=require('lodash')
const fs=require('fs')
const path=require('path')
const multer=require('multer')
const { isEmpty } = require('lodash')
app.set('view engine' , 'ejs')
app.use(bodyParser.urlencoded({extended:true}))
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.raw());

app.use(express.static('public'))
app.use(session({
    secret: 'whyshoulditellyou',
    resave: false,
    saveUninitialized: true,
   
  }))
  app.use(passport.initialize())
  app.use(passport.session())
//mongoose.connect('mongodb+srv://admin_Ramneek:Ramneek123@cluster0.cyzml.mongodb.net/OnlineExaminationSystem', {useNewUrlParser: true});
mongoose.connect('mongodb://localhost:27017/OnlineExamination', {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);


const QuestionSchema = new mongoose.Schema({

    title: String , 
    option1 : String , 
    option2: String , 
    option3 : String , 
    option4 : String  , 
    answer : String , 
    ID : Number
})


const userSchema = new mongoose.Schema({


    firstName : String , 
    lastName : String , 
    email : String , 
    password : String ,
    resetPasswordToken: String,
    resetPasswordExpires: Date , 
    role : Number  , 
    phoneNumber : String, 
    DOB : String

})



QuestionSchema.plugin(random)
const scoreSchema= new mongoose.Schema({
    email : String , 
    topic : String ,
    marks : Number , 
    time : String
})
const Score = new mongoose.model("Score" , scoreSchema)


const Question = new  mongoose.model("Question" ,QuestionSchema)
userSchema.plugin(passportLocalMongoose , {usernameField: 'email'})
const User =  new mongoose.model("User", userSchema)



initializePassport(
    
    passport , 
   function(email)
   {
       
       var promise=User.findOne({email:email} ).exec()
       {
            
       }
       
       return promise

   } , 
   function(id)
   {
       var promise=User.findOne({_id:id}).exec()
       {

       }
       return promise
       
   }
    
    )
  






const TopicSchema = new mongoose.Schema({

    title : String , 
    questions : [QuestionSchema]

})

const Topic = mongoose.model("Topic" , TopicSchema)

const  imageSchema = new mongoose.Schema({ 
    parentId: String, 
 
    img: 
    { 
        data: Buffer, 
        contentType: String 
    } 
}); 

const Image = mongoose.model("Image", imageSchema)
var storage = multer.diskStorage({ 
    destination: (req, file, cb) => { 
        cb(null, 'uploads') 
    }, 
    filename: (req, file, cb) => { 
        cb(null, file.fieldname + '-' + Date.now()) 
    } 
}); 
  
var upload = multer({ storage: storage }); 

app.get('/' , function(req, res)
{
    res.render('home')
})
app.get('/syllabus' ,checkAuthenticated , function(req, res)
{
    
        Topic.find({} , function(err, foundItems)
        {
            if(err)
            {
                console.log(err)
            }
            else
            {
                res.render('modal' , {topicNames : foundItems})
            }
        })
    
   
})
app.get('/adminSyllabus' ,checkAdminOrSupervisor, function(req, res)
{
    Topic.find({} , function(err, foundItems)
        {
            if(err)
            {
                console.log(err)
            }
            else
            {
                res.render('adminSyllabus' , {topicNames : foundItems})
            }
        })
  
})
app.post('/adminSyllabus' ,checkAdminOrSupervisor , function(req, res)
{
    console.log("New topic running")
    console.log(req.body.NewTopic)
    const Addtopic= new Topic ({
        title : req.body.NewTopic ,
        questions :[] 

    })
    
    Addtopic.save()
    res.redirect('/adminSyllabus')
})

app.get('/adminSyllabus/:subtopic' ,checkAdminOrSupervisor,  function(req, res)
{
    console.log(req.params.subtopic)
    Topic.find({title : req.params.subtopic} , function(err, foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
        
            res.render('adminQuestions' , {topicQuestions : foundItems , Topic :req.params.subtopic})
        }
    })

})
app.post('/adminSyllabus/:subtopic' ,checkAdminOrSupervisor,   function(req, res)
{
    console.log("I am runnig")
   
    var size =0
    Topic.findOne({ title : req.params.subtopic} , function(err, foundItems)
        {
            if(err)
            {
                console.log(err)
            }
            else
            {
                console.log("Item length ",foundItems.questions.length)
                size=foundItems.questions.length
                const addQues = new Question({
    
                    title: req.body.Question , 
                    option1 : req.body.Option1 , 
                    option2 : req.body.Option2 ,
                    option3 : req.body.Option3 , 
                    option4 : req.body.Option4 ,
                    answer : req.body.Answer ,
                    ID :  size+1
            
                })
                addQues.save()
                var arr = foundItems.questions
                arr.push(addQues)
                Topic.updateOne({title:req.params.subtopic} , {questions : arr}  , function(err , docs)
                {
                    if(err)
                    {
                        console.log(err)
                    }
                
                })
                
                console.log(addQues)
                var X= req.params.subtopic
                res.redirect('/adminSyllabus'+'/'+X)
            }

        })
       
        
        


})

app.get('/syllabus/:subtopic' ,checkAuthenticated , function(req, res)
{
   

    Topic.findOne({title : req.params.subtopic} , function(err, foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            
            const array=foundItems.questions
            // Shuffle array
        const shuffled = array.sort(() => 0.5 - Math.random());

    // Get sub-array of first n elements after shuffled
            let selected = shuffled.slice(0, 5);
            //console.log(selected)
            res.render('questions' , {topicQuestions : selected , Topic:req.params.subtopic})
        }
    })
    //res.render('questions', {topicQuestions:items})
})
app.post('/syllabus/:subtopic' , checkAuthenticated , function(req, res)
{
    var score=0
    console.log(req.user.email)
    Topic.findOne({title : req.params.subtopic} , function(err, foundItems)
    {
        //const Items = foundItems.toObject({ getters: true });

        if(err)
        {
            console.log(err)
        }
        else
        {
           console.log(foundItems.title)
           console.log(foundItems.questions[0].title)
           console.log(foundItems.questions[0].answer)
          var Q= foundItems.questions[0].title
        
          for (var key of Object.keys(req.body)) {
             
            //console.log(key + " -> " + req.body[key])
            if(key=='action')
            {
                continue
            }
            if(req.body[key]==foundItems.questions[key-1].answer)
            {
                score=score+1
            }
           // console.log('I am prinitng ' , foundItems.questions[key-1].answer)
            
        }
        const newScore = new Score({
            email : req.user.email , 
            topic : req.params.subtopic  , 
            marks : score ,
            time :  new Date().toLocaleString()
        })
        console.log(newScore)
        newScore.save()
        
            res.render('score' , {Score : score})
         // console.log(score)

            // res.render('questions' , {topicQuestions : foundItems})
        }
    })

})
app.get('/login' , checkNotAuthenticated ,function(req, res)
{
    res.render('login' ,{ root : __dirname})
    //res.sendFile('/views/login.html' , { root : __dirname});
})
app.get('/Suplogin' , checkNotSupervisor,function(req, res)
{
    res.render('Suplogin' )
    //res.sendFile('/views/login.html' , { root : __dirname});
})
app.get('/register' , function(req, res)
{
    res.sendFile('/views/register.html' , { root : __dirname});
})

app.post('/login' , checkNotAuthenticated ,passport.authenticate('local', {
    
    successRedirect :'/syllabus' , 
    failureRedirect :'/login' ,
    failureFlash : true
   
}))
app.post('/Suplogin' ,checkNotSupervisor ,passport.authenticate('local', {
    
    successRedirect :'/supervisorPannel' , 
    failureRedirect :'/Suplogin' ,
    failureFlash : true
   
}))

app.post('/register',async(req, res)=>{
    

 
    try{
        const hashedPassword=  await bcrypt.hash(req.body.password , 10)
        const newUser= new User({
            firstName: req.body.firstName , 
            lastName:req.body.lastName , 
            email:req.body.email,  
            role :0 ,
            password:hashedPassword

        })
        console.log(newUser.firstName)
        newUser.save()
        res.redirect('/login')
    }
    catch
    {
        res.redirect('/register')
    }
       



})
app.get('/Supregister' , function(req, res)
{
    res.render('supervisorRegister')
})
app.post('/Supregister',async(req, res)=>{
    

 
    try{
        const hashedPassword=  await bcrypt.hash(req.body.password , 10)
        const newUser= new User({
            firstName: req.body.firstName , 
            lastName:req.body.lastName , 
            email:req.body.email,  
            role :2 ,
            password:hashedPassword

        })
        console.log(newUser.firstName)
        newUser.save()
        res.redirect('/Suplogin')
    }
    catch
    {
        res.redirect('/Supregister')
    }
       



})

app.get('/adminLogin' , checkNotAdmin  , function(req, res)
{
    res.render('adminLogin')
   // res.sendFile('/views/adminLogin.html' , { root : __dirname});
})
app.post('/adminLogin' , checkNotAdmin ,passport.authenticate('local', {
    
    successRedirect :'/adminSyllabus' , 
    failureRedirect :'/adminLogin' ,
    failureFlash : true
   
}))


app.get('/logout' , function(req, res)
{
    req.logout() 
    res.redirect('/')
})


app.get('/studentDel' ,checkSupervisor  ,  function(req, res)
{
    User.find({role:0} , function(err , foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(foundItems)
            {
                res.render('studentDel' , {Students : foundItems})
            }
        }
    })

})
app.post('/delete' , function(req, res)
{
    console.log("Put delete running")
    console.log(req.body)
    User.deleteOne({firstName : req.body.Input , role:0} ,function(err)
    {
        if(err)
        {
            console.log(err)
        }
        
    })
    res.redirect('studentDel')

})
app.get('/studentUpdate' ,  checkSupervisor , function(req, res)
{
    User.find({role:0} , function(err , foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(foundItems)
            {
                console.log(foundItems)
                
                res.render('studentUpdate' , {Students : foundItems})
            }
        }
    })
})

app.get('/studentUpdate/:name' ,checkSupervisor ,  function(req, res)
{
    User.findOne({firstName:req.params.name ,role:0} , function(err , foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(foundItems)
            {
                Image.findOne({parentId: foundItems.email}, (err, pic) => { 
                    if (err) { 
                        console.log(err); 
                    } 
                    else { 
                       console.log(pic)
                        res.render('EditMyAccount' , {Item:foundItems  , Pic : pic})
                    } 
                }); 
              
            }
        }
    })
    
})
app.get('/supervisorPannel' ,  function(req, res)
{
    res.render('supervisorPannel')
})
app.post('/studentUpdate/:name' ,  checkSupervisor ,   function(req, res)
{
    console.log("i am in update column")
   
    User.updateOne({firstName:req.params.name , role:0},{email:req.body.email , firstName:req.body.firstName ,lastName:req.body.lastName , password:req.body.params} , function(err)
    {
        if(err)
        {
            console.log(err)
        }
    })
    res.redirect('/')
})

app.get('/studentAdd' , checkSupervisor , function(req, res)
{
    res.render('addform')
})
app.post('/studentAdd', checkSupervisor , async(req, res)=>{
    

 
    try{
        const hashedPassword=  await bcrypt.hash(req.body.password , 10)
        const newUser= new User({
            firstName: req.body.firstName , 
            lastName:req.body.lastName , 
            email:req.body.email, 
            role :0 ,
            password:hashedPassword

        })
        console.log(newUser)
        newUser.save()
        res.redirect('/supervisorPannel')
    }
    catch
    {
        res.redirect('/')
    }
       



})

app.get('/adminDel' ,checkSupervisor , function(req, res)
{

    User.find({role:1} , function(err,items)
    {
        res.render('adminDel' , {Admins: items})
    })
   
})
app.post('/adminDel' ,checkSupervisor , function(req, res)
{
    console.log("Put delete running")
    console.log(req.body)
    User.deleteOne({firstName : req.body.Input ,role:1} ,function(err)
    {
        if(err)
        {
            console.log(err)
        }
        
    })
    res.redirect('adminDel')
})
app.get('/adminAdd' ,checkSupervisor , function(req, res)
{
    res.render('adminAdd')
})
app.post('/adminAdd',checkSupervisor , async(req, res)=>{
    

 
    try{
        const hashedPassword=  await bcrypt.hash(req.body.password , 10)
        const newUser= new User({
            firstName: req.body.firstName , 
            lastName:req.body.lastName , 
            email:req.body.email, 
            role :1 ,
            password:hashedPassword

        })
        console.log(newUser)
        newUser.save()
        res.redirect('/supervisorPannel')
    }
    catch
    {
        res.redirect('/')
    }
       



})

app.get('/adminUpdate' ,checkSupervisor ,  function(req, res)
{
    User.find({role:1} , function(err, items)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            res.render('adminUpdate' , {Admins:items})
        }

    })
})
app.get('/adminUpdate/:name' ,checkSupervisor, function(req , res){



    User.findOne({firstName:req.params.name ,role:1} , function(err , foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(foundItems)
            {
                Image.findOne({parentId: foundItems.email}, (err, pic) => { 
                    if (err) { 
                        console.log(err); 
                    } 
                    else { 
                       console.log(pic)
                        res.render('EditMyAccount' , {Item:foundItems  , Pic : pic})
                    } 
                }); 
              
            }
        }
    })


    
})
app.post('/adminUpdate/:name' ,checkSupervisor , function(req, res)
{
    console.log("I am in POST route")
    console.log(req.params.name)
    User.updateOne({firstName:req.params.name ,role:1} , {firstName:req.body.firstName , lastName:req.body.lastName , email:req.body.email ,password:req.body.password} ,function(err){
        if(err)
        {
            console.log(err)
        }
       
    })
    res.redirect('/supervisorPannel')
})

app.get('/myScore' ,checkAuthenticated , function(req, res)
{
    Score.find({email : req.user.email}, function(err , items){

        if(err)
        {
            console.log(err)
        }
        else
        {
            console.log("i am in get " , items)
            res.render('myScores', {Scores: items})
        }
    } )
})
app.get('/myScore/:email' ,checkAdminOrSupervisor  ,  function(req, res)
{

    Score.find({email : req.params.email}, function(err , items){

        if(err)
        {
            console.log(err)
        }
        else
        {
           
            res.render('myScores', {Scores: items})
        }
    } )
})
app.get('/studentList' ,checkAdminOrSupervisor , function(req, res)
{
    User.find({role:0} , function(err, items)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(items)
            {
                res.render('studentList' , {Students:items})
            }
        }
    })
})


app.post('/deleteTitle' , function(req, res)
{
    var array =[]
    //array=req.body.TopicToDelete
    var newArr= array.concat(req.body.TopicToDelete)
    

    newArr.forEach(function(item)
    {
        Topic.findOne({title:item} ,function(err,  items)
        {
            if(err)
            {
                console.log(err)
            }
            else
            {
                if(items)
                {
                    var arr= items.questions
                    for(var i=0;i<arr.length;i++)
                    {
                        Question.deleteOne({title:arr[i].title} ,function(err)
                        {
                            if(err)
                            {
                                console.log(err)
                            }
                        })
                    }
                }
            }
        })
       
        Topic.deleteOne({title:item} ,function(err)
        {
            if(err)
            {
                console.log(err)
            }
        })
    })

   res.redirect('/adminSyllabus')
})
app.post('/deleteQuestions' , function(req, res)
{
   var arr=[]
   var Y=[]
    var Q= Y.concat(req.body.QuesToDelete)
    Q.forEach(function(ques)
    {
        Question.deleteOne({title:ques}, function(err)
        {
            if(err)
            {
                console.log
            }

        })
    })



   Topic.findOne({title:req.body.Topic} , function(err, items)
   {
       if(err)
       {
           console.log(err)
       }
       else
       {   var Z=[] 
           var array= Z.concat(items.questions)
           array.forEach(function(item)
           {
               //console.log(item.title)
               arr.push(item.title)
           })
           //console.log(arr)
       
      // console.log(arr)
       var newArray=[]
       var X=[]
       var questions= X.concat( req.body.QuesToDelete)
       questions.forEach(function(question)
       {
           var index= arr.indexOf(question)
           if(index>-1)
           {
              // console.log("Found" , index)
               //console.log(question)
               //array.splice(index, 1);
               delete array[index]
               //console.log(array)
               
            }
              
       })
    }
    var tempArr=[]
    for(var i=0;i<array.length;i++)
    {

        if(typeof array[i] != 'undefined')
        {
           // console.log("Is Empty")
            tempArr.push(array[i])
        }
    }
    //console.log(tempArr)
    Topic.updateOne({title:req.body.Topic} ,{questions:tempArr} , function(err)
    {
        if(err)
        {
            console.log(err)
        }
      
    })
      // console.log(array)

   })
   //console.log(arr)
   res.redirect('/adminSyllabus')
})

app.get('/modal' , function(req, res)
{
    Topic.find({} , function(err ,items)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            res.render('modal' , {topicNames:items})
        }
    })
    
})

app.get('/editAccount'  , checkUSA , function(req, res)
{
    User.findOne({email:req.user.email}  , function(err ,items)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(items)
            {



                Image.findOne({parentId: req.user.email}, (err, pic) => { 
                    if (err) { 
                        console.log(err); 
                    } 
                    else { 
                       console.log(pic)
                        res.render('EditMyAccount' , {Item:items  , Pic : pic})
                    } 
                }); 


                
            }
        }
    })


})
// To edit Profile
app.post('/edit' , checkUSA ,  function(req, res)
{
    console.log("Edit Profile" , req.body)
    User.findOneAndUpdate({email:req.body.Email2} , {firstName:req.body.FirstName , lastName:req.body.LastName , DOB:req.body.DateOfBirth , phoneNumber:req.body.PhoneNumber} ,function(err)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(req.user.role==0 || req.user.role==1)
            {
                res.redirect('/editAccount')
            }
            if(req.user.role==2)
            {
                res.redirect('/supervisorPannel')
            }
        }
    
    })
  
})

// To edit Image
app.post('/editAccount' ,checkUSA,  upload.single('image'), (req, res, next) => { 
  
    
    var obj = { 
        parentId: req.body.Email ,
        img: { 
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
            contentType: 'image/png'
        } 
    } 
    Image.findOne({parentId:req.body.Email} , function(err , Item)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(Item)
            {
                Image.findOneAndUpdate( {parentId:req.body.Email},{img : { 
                    data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
                    contentType: 'image/png'
                } }, (err, item) => { 
                    if (err) { 
                        console.log(err); 
                    } 
                    else { 
                        // item.save(); 
                        if(req.user.role==0||req.user.role==1)
                        {
                            res.redirect('/editAccount'); 
                        }
                        if(req.user.role==2)
                        {
                            res.redirect('supervisorPannel');
                        }

                       
                    } 
                }); 
            }
            else
            {
                var obj = { 
                   parentId : req.body.Email ,
                    img: { 
                        data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)), 
                        contentType: 'image/png'
                    } 
                } 
                Image.create(obj, (err, item) => { 
                    if (err) { 
                        console.log(err); 
                    } 
                    else { 
                        // item.save(); 
                        if(req.user.role==0||req.user.role==1)
                        {
                            res.redirect('/editAccount'); 
                        }
                        if(req.user.role==2)
                        {
                            res.redirect('/supervisorPannel');
                        }
                    } 
                }); 
            }
        }
    })
  
}); 

app.post('/updatePassword'  ,checkUSA,  async function(req, res)
{
    console.log(req.body);
    try{
        const hashedPassword=  await bcrypt.hash(req.body.password , 10)
        User.findOneAndUpdate({email:req.body.Email3} , {password:hashedPassword} , function(err)
        {
            console.log("Updated Password")
            if(err)
            {
                console.log(err)
            }
            if(req.user.role==0 || req.user.role==1)
            {
                res.redirect('/editAccount')
            }
            if(req.user.role==2)
            {
                res.redirect('/supervisorPannel')
            }
          
        })
     
    }
    catch
    {
        res.redirect('/syllabus')
    }


})



//Adding here



app.get('/forgot', function(req, res) {
    res.render('forgot');
  });
  
  app.post('/forgot', function(req, res, next) {
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/forgot');
          }
  
          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'bytecodebytes@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'bytecodebytes@gmail.com',
          subject: 'Code Bytes  Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/reset/' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          console.log('mail sent');
          req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/login');
    });
  });
  
  app.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('/forgot');
      }
      res.render('reset', {token: req.params.token});
    });
  });
  
  app.post('/reset/:token', function(req, res) {
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, async function(err, user) {
          if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/');
          }
          if(req.body.password === req.body.confirm) {

            
            try
            {const tempPass= await bcrypt.hash(req.body.password ,10)
                User.updateOne({email:user.email} , {password:tempPass} , function(err)
                {
                    console.log(err)
                })
            }
            catch(e){
                console.log(e)
            }
           
            user.setPassword(req.body.password, function(err) {
                if(err)
                {
                    console.log(err)
                }
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;
  
              user.save(function(err) {
                req.logIn(user, function(err) {
                    if(err)
                    {
                        console.log(err)
                    }
                  done(err, user);
                });
              });
            })
          } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect('/');
          }
        });
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'Gmail', 
          auth: {
            user: 'bytecodebytes@gmail.com',
            pass: process.env.GMAILPW
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'bytecodebytes@gmail.com',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('success', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/login');
    });
  });












  function checkAuthenticated(req, res, next)
  {
      if(req.isAuthenticated())
      {
          if(req.user.role==0)
          {
            return next()
        }
          }
          
      res.redirect('/login')
  }
  function checkNotAuthenticated(req, res, next)
  {
      if(req.isAuthenticated())
      {
          return    res.redirect('/syllabus')
      }
     
       next()
  }
  function checkNotAdmin(req, res, next)
  {
      if(req.isAuthenticated())
      {
          return    res.redirect('/adminSyllabus')
      }
     
       next()
  }
  function checkNotSupervisor(req, res, next)
  {
      if(req.isAuthenticated())
      {
          return    res.redirect('/supervisorPannel')
      }
     
       next()
  }
  

  function checkAdmin(req, res, next)
  {
      
        if(req.isAuthenticated())
        {
            if(req.user.role==1)
            {
                return next()
            }
            
        }
      
   
      res.redirect('/adminLogin')
  }
  function checkSupervisor(req, res, next)
  {
      
        if(req.isAuthenticated())
        {
            if(req.user.role==2)
            {
                return next()
            }
            
        }
      
   
      res.redirect('/supervisorLogin')
  }
  function checkUSA(req, res, next)
  {
      
        if(req.isAuthenticated())
        {
            
                return next()
            
            
        }
      
   
      res.redirect('/')
  }
function checkAdminOrSupervisor(req, res, next)
{
    if(req.isAuthenticated())
    {
        if(req.user.role==2 || req.user.role==1)
        {
            return next()
        }
        
    }

}

let port =process.env.PORT
if(port==null || port =="")
{
    port =3000;
}

app.listen(port , function()
{
    console.log("Server has started successfully")
})