const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
function initialize(passport, getUserByEmail , getUserById){

    const authenticateUser=  async (email, password, done) =>
    {
        
        const promise =getUserByEmail(email)
        // console.log("Inside config" ,promise)
        promise.then( async function(user)
        {
            //onsole.log(user)
        
        // console.log(email)
        //  console.log("error area")
        //  console.log("Inside authuser" ,user.password)
        //  console.log(password)
        if(user==null)
        {
            return done(null , false , {message:'No User With That Email'})
        }

       
        try{
            if( await  bcrypt.compare( password , user.password)){
                return done(null , user)
            }
            else
            {
                return done(null , false , {message:'Password incorrect'})
            }
        }
        catch(e)
        {
            console.log(e)
        }
        
            
            


        
    })


    }

    passport.use(new LocalStrategy({usernameField:'email'  , passwordField:'password'}, authenticateUser))

    passport.serializeUser(function(user ,done)
    {
            done(null , user._id)
    })
    passport.deserializeUser(function(id, done)
    {
        const promise=getUserById(id)
        promise.then(function(user)
        {
            return done(null , user)
        })
       
    })

}
module.exports = initialize