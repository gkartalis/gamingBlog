//APP CONFIG
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    methodOverride = require("method-override"),
    passport     = require("passport"),
    LocalStrategy = require("passport-local"),
    User                    = require("./models/user"),
    passportLocalMongoose   = require("passport-local-mongoose"),
    expressSanitizer = require("express-sanitizer");
    
    
var promise = mongoose.connect('mongodb://localhost/gamingBlog1', {
  useMongoClient: true,
  /* other options */
});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer());
app.use(require("express-session")({
    secret: "p65floyd83",
    resave: false,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res, next){
   res.locals.currentUser = req.user;
   next();
});


// MONGOOSE/MODEL CONFIG
var blogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    created: {type: Date, default: Date.now}
});

//Compile it into a model!
var Blog = mongoose.model("Blog", blogSchema)



//=================
//RESTful ROUTES!!!
//=================

app.get("/",function(req, res){
   res.redirect("/blogs");
});
//INDEX ROUTE
app.get("/blogs",function(req, res){
    
    Blog.find({}, function(err, blogs){
       if(err){
           console.log(err);
       }else{
            res.render("index",{blogs: blogs, currentUser: req.user});
       }
    });
});
// NEW ROUTE
app.get("/blogs/new", isLoggedIn, function(req, res){
   res.render("new");
});

// CREATE ROUTE

app.post("/blogs", isLoggedIn, function(req, res){
   req.body.blog.body = req.sanitize(req.body.blog.body);
   Blog.create(req.body.blog,function(err, newBlog){
       if(err){
           res.render("new");
       }else{
           res.redirect("/blogs");
       }
   });
});


//SHOW ROUTE
app.get("/blogs/:id", function(req, res){
   Blog.findById(req.params.id,function(err, foundBlog){
      if(err){
          res.redirect("/blogs");
      }else{
          res.render("show", {blog: foundBlog});
      }
   })
});

//EDIT ROUTE

app.get("/blogs/:id/edit", isLoggedIn, function(req,res){
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
        }else{
                res.render("edit", {blog: foundBlog});
        }
    })
});

// UPDATE ROUTE
app.put("/blogs/:id", isLoggedIn,function(req, res){
       req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id,req.body.blog, function(err, updatedBlog){
        if(err){
            res.redirect("/blogs");
        }else{
            res.redirect("/blogs/"+req.params.id);
        }
    });
});

//DELETE ROUTE

app.delete("/blogs/:id", isLoggedIn,function(req, res){
   Blog.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/blogs");
      }else {
          res.redirect("/blogs");
      }
   });
});


//============================================
// LOGIN ROUTES
//============================================
app.get("/register", function(req,res){
    res.render("register");
});

app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err,user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
           res.redirect("/blogs");
        });
    });
});

app.get("/login", function(req, res){
    res.render("login");
});

app.post("/login", passport.authenticate("local",{
    successRedirect: "/blogs",
    failureRedirect: "/login"
}),
function(req, res){
    
});

app.get("/logout", function(req, res){
    req.logout();
    res.redirect("/");
    
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login")
}

app.listen(process.env.PORT,process.env.IP,function(){
    console.log("Server is running");
});