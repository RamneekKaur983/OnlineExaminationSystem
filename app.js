require('dotenv').config()
const express= require('express')
const bodyParser= require('body-parser')
const mongoose =require('mongoose')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose =require('passport-local-mongoose')
const app =express()
app.set('view engine' , 'ejs')
app.use(bodyParser.urlencoded({extended:true}))

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
password : String

})
userSchema.plugin(passportLocalMongoose , {usernameField: 'email'})

const adminSchema = new mongoose.Schema({


    firstName : String , 
    lastName : String , 
    email : String , 
    password : String
})
const supervisorSchema = new mongoose.Schema({

    firstName : String , 
    lastName : String , 
    email : String , 
    password : String
})
const Supervisor = new mongoose.model("Supervisor" , supervisorSchema)
const Admin= new mongoose.model("Admin"  , adminSchema)
const admin= new Admin({

    firstName : "Rammneek" , 
    lastName :"Kaur" , 
    email : "ramneek983@gmail.com"  , 
    password:"qwerty"
})
const supervisor = new Supervisor({

    firstName : "Tiksha" , 
    lastName : "Kapoor" , 
    email : "tk@kp.com" , 
    password : "tkkp"

})




const Question = new  mongoose.model("Question" ,QuestionSchema)
const User =  new mongoose.model("User", userSchema)
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const stack1= new Question ({

    title :" What is the space complexity for deleting a linked list?" , 
    option1 : "O(1)" ,
    option2 : " O(n)" , 
    option3 : "Either O(1) or O(n)" , 
    option4 : "O(logn)"
})
//stack1.save();
//question1.save()
const stack2= new Question ({

    title :"Which of the following is not a disadvantage to the usage of array?" , 
    option1 : "Fixed size" ,
    option2 : " There are chances of wastage of memory space if elements inserted in an array are lesser than the allocated size" , 
    option3 : " Insertion based on position" , 
    option4 : "Accessing elements at specified positions"
})
//question2.save()
//stack2.save();
const stack3= new Question ({

    title :"What is the time complexity of inserting at the end in dynamic arrays?" , 
    option1 : " O(1)" ,
    option2 : "O(n)" , 
    option3 : "O(logn)" , 
    option4 : "Either O(1) or O(n)"
})
//question3.save()
//stack3.save();
const stack4 = new Question({
    title :"What is the time complexity to count the number of elements in the linked list?" ,     
    option1 :" O(1)" , 
    option2:"O(n)" , 
    option3 :"O(logn)"  ,
    option4 :"O(n2)"
})
//stack4.save();
const arrayQues=[stack1 , stack2 , stack3 , stack4]

const TopicSchema = new mongoose.Schema({

    title : String , 
    questions : [QuestionSchema]

})
const Topic = mongoose.model("Topic" , TopicSchema)

const Array= new Topic({
    title : "Linked List" , 
    questions :arrayQues
})
//Array.save()
//topic1.save()

app.get('/' , function(req, res)
{
    res.render('home')
})
app.get('/syllabus' , function(req, res)
{
    if(req.isAuthenticated())
    {
        Topic.find({} , function(err, foundItems)
        {
            if(err)
            {
                console.log(err)
            }
            else
            {
                res.render('syllabus' , {topicNames : foundItems})
            }
        })
    }
    else
    {
        res.redirect('login')
    }
   
})
app.get('/adminSyllabus' , function(req, res)
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
app.post('/adminSyllabus' , function(req, res)
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

app.get('/adminSyllabus/:subtopic' , function(req, res)
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
        
            res.render('adminQuestions' , {topicQuestions : foundItems})
        }
    })

})
app.post('/adminSyllabus/:subtopic' , function(req, res)
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
                res.redirect('/')
            }

        })
       
        
        


})
app.get('/topic' , function(req, res)
{
    const topicX= new Topic({
        title : "Linked List" , 
        questions :arrayQues
    })
    console.log(topicX)
    res.render('topic' , {content : topicX})
})
app.get('/syllabus/:subtopic' , function(req, res)
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
            console.log(foundItems)
            res.render('questions' , {topicQuestions : foundItems})
        }
    })
})
app.post('/syllabus/:subtopic' , function(req, res)
{
    var score=0
    console.log(req.body)
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
             
            console.log(key + " -> " + req.body[key])
            if(key=='action')
            {
                continue
            }
            if(req.body[key]==foundItems.questions[key-1].answer)
            {
                score=score+1
            }
            console.log('I am prinitng ' , foundItems.questions[key-1].answer)
            
        }
        
            res.render('score' , {Score : score})
         // console.log(score)

            // res.render('questions' , {topicQuestions : foundItems})
        }
    })

})
app.get('/login' , function(req, res)
{
    
    res.sendFile('/views/login.html' , { root : __dirname});
})
app.get('/register' , function(req, res)
{
    res.sendFile('/views/register.html' , { root : __dirname});
})
const firstUser= new User({
    firstName : "Ramneek" , 
    lastName : "Kaur" , 
    email :" ramneek983@gmail.com" , 
    password : "badliar123"
})
app.post('/login' , function(req, res)
{
    const user = new User({
        firstName :" " , 
        lastName :" "  , 
        email : req.body.email , 
        password :req.body.password
    })
    req.login(user , function(err)
    {
        if(err)
        {
            console.log(err)
        }
        else{
            passport.authenticate("local")(req, res , function(){
                res.redirect('syllabus')
            })
        }
    })
    
})

app.post('/register' , function(req, res)
{
   
 
    User.register({ email :req.body.email , firstName : req.body.firstName , lastName:req.body.lastName } , req.body.password,function(err , user)
   {
       if(err)
       {
           console.log(err)
           res.redirect('/')
       }
       else
       {
           passport.authenticate("local")(req, res , function(){
               res.redirect('syllabus')
           })
       }
   } )
   
})
app.get('/adminLogin' , function(req, res)
{
    res.sendFile('/views/adminLogin.html' , { root : __dirname});
})
app.post('/adminLogin' , function(req, res)
{
    console.log(req.body.email)
    Admin.findOne({email : req.body.email} , function(err, items)
    {
        console.log(items)
        if(err)
        {

            console.log(err)
        }
        else
        {
            if(req.body.password==items.password)
            {
                res.redirect('/adminSyllabus')
            }
        }
    })
})
app.get('/supervisorLogin' , function(req, res)
{
    res.sendFile('/views/supervisorLogin.html' , { root : __dirname});
})

app.post('/supervisorLogin' , function(req, res)
{
    console.log(req.body.email)
    Supervisor.findOne({email : req.body.email} , function(err, items)
    {
        console.log(items)
        if(err)
        {

            console.log(err)
        }
        else
        {
            if(req.body.password==items.password)
            {
                res.render('supervisorPannel')
            }
        }
    })



})


app.get('/delete' , function(req, res)
{
    console.log("Delete Get Running")
})

app.get('/logout' , function(req, res)
{
    req.logout() 
    res.redirect('/')
})


app.get('/studentDel' , function(req, res)
{
    User.find({} , function(err , foundItems)
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
    User.deleteOne({firstName : req.body.Input} ,function(err)
    {
        if(err)
        {
            console.log(err)
        }
        
    })
    res.redirect('studentDel')

})
app.get('/studentUpdate' , function(req, res)
{
    User.find({} , function(err , foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(foundItems)
            {
                res.render('studentUpdate' , {Students : foundItems})
            }
        }
    })
})

app.get('/studentUpdate/:name' , function(req, res)
{
    User.findOne({firstName:req.params.name} , function(err , foundItems)
    {
        if(err)
        {
            console.log(err)
        }
        else
        {
            if(foundItems)
            {
                res.render('updateform', {Name:req.params.name , Student:foundItems})
            }
        }
    })
    
})
app.get('/supervisorPannel' , function(req, res)
{
    res.render('supervisorPannel')
})
app.post('/studentUpdate/:name' , function(req, res)
{
    console.log("i am in update column")
    User.updateOne({firstName:req.params.name},{email:req.body.email , firstName:req.body.firstName ,lastName:req.body.lastName , password:req.body.params} , function(err)
    {
        if(err)
        {
            console.log(err)
        }
    })
    res.redirect('/')
})

app.get('/studentAdd' , function(req, res)
{
    res.render('addform')
})
app.post('/studentAdd' ,function(req, res)
{
    const addUser= new User({

        firstName : req.body.firstName , 
        lastName : req.body.lastName , 
        email : req.body.email , 
        password : req.body.password
    })
    addUser.save()
    res.redirect('supervisorPannel')
})
app.get('/adminDel' , function(req, res)
{

    Admin.find({} , function(err,items)
    {
        res.render('adminDel' , {Admins: items})
    })
   
})
app.post('/adminDel' , function(req, res)
{
    console.log("Put delete running")
    console.log(req.body)
    User.deleteOne({firstName : req.body.Input} ,function(err)
    {
        if(err)
        {
            console.log(err)
        }
        
    })
    res.redirect('adminDel')
})
app.get('/adminAdd' , function(req, res)
{
    res.render('adminAdd')
})
app.post('/adminAdd' , function(req, res)
{
    const addAdmin= new Admin({
        firstName : req.body.firstName , 
        lastName : req.body.lastName , 
        email : req.body.email , 
        password : req.body.password
    })
    addAdmin.save()
    res.render('supervisorPannel')
})
app.listen(3000 , function()
{
    console.log("Server running on port 3000")
})