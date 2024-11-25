import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'

const users = [];
const app = express();

// Setting up view engine as EJS
app.set("view engine", "ejs");
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), "public")));

// Database connection
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017', {
        dbName: "backend",
    });
    console.log('Database connected');
}

main()
    .then(() => console.log("Database connected successfully"))
    .catch(e => console.log(e));

// Mongoose Schema and Model
const messageSchema = new mongoose.Schema({
    name: String,
    password: String,
});
const Message = mongoose.model("Message", messageSchema);

// Middleware to check authentication
const isAuth = (req, res, next) => {
    const { umesh } = req.cookies;
    if (umesh) {
        jwt.verify(umesh,"umeshchandra",(err,decoded)=>{
            if(err){
                return res.render("index")
            }
            console.log(decoded);
            req.user=decoded
        })
        next();
    } else {
        res.render("index"); // Redirect to login.ejs if not authenticated
    }
};

// Routes
app.get("/", isAuth, (req, res) => {
    res.render("logout",  {name:req.user.name}); // Render logout.ejs if authenticated
});

app.post("/login", async (req, res) => {
    const { name, password } = req.body;

    try {
        // Use async/await to find the user
        const user = await Message.findOne({ name});
        if (user) {

            const ismatched=await bcrypt.compare(password,user.password)
            if(!ismatched){
                res.redirect("/",{error:"password i in correct"});

            }
            //then we can create token
            const token =jwt.sign(
                {id:user._id,name:user.name},////this is payload user info
                "umeshchandra",
               
            )
            console.log("the token just creted is",token);
            res.cookie("umesh", token, {
                httpOnly: true, // Prevent access by JavaScript
                maxAge: 3600000, // 1 hour
            });
            res.redirect("/");///logout button
        } else {
            res.render("index", { error: "Invalid credentials!" });
        }
    } catch (err) {
        console.log(err);
        res.render("index", { error: "An error occurred!" });
    }
});


app.get("/logout", (req, res) => {
    res.cookie("umesh", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });
    res.render("index");
});

app.get("/success", (req, res) => {
    res.send("Data added successfully");
});

app.get("/signup",(req,res)=>{
    res.render("signup");
})

app.post("/createaccount", async (req, res) => {
    const { name, password } = req.body;

    try {
        const existinguser=await Message.findOne({name:name})
        // Add the user to the database
        if(existinguser){
           return res.redirect("/");
        }
        else{
           const hassedPassword=await bcrypt.hash(password,10)
        await Message.create({ name,password: hassedPassword   });
        //users.push({ name, password }); // Optional if users array is needed
        res.redirect("/");
        }
    } catch (err) {
        console.log(err);
        res.send("Error while adding user.");
    }
});


// Server
app.listen(1111, () => {
    console.log("Server is listening to the requests on port 1111");
});
