const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const dotenv = require("dotenv").config();
const Razorpay = require("razorpay");
const auth = require("./assets/auth");
const connectDB = require("./config/connectDB");
const app = express();
app.use(cookieParser());


// EXPRESS SPECIFIC STUFF
app.use('/assets', express.static('assets')); // For serving static files
app.use(bodyParser.urlencoded({ extended: true }));


// EJS SPECIFIC STUFF
app.set('view engine', 'ejs'); // Set the template engine as pug
app.set('views', path.join(__dirname, 'views')); // Set the views directory


//DATABASE
connectDB(process.env.DATABASE_URL);
const contactSchema = new mongoose.Schema({
    userName: { type: String, trim: true, required: true },
    mob: { type: String, trim: true, required: true, unique: true },
    email: { type: String, unique: true, lowercase: true, trim: true, required: true },
    address: { type: String },
    created: { type: Date, default: Date.now },
},
    { versionKey: false }
)

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true, required: true },
    email: { type: String, unique: true, lowercase: true, trim: true, required: true },
    password: { type: String },
    created: { type: Date, default: Date.now },
    token: { type: String, required: true },
    order_id: { type: String },
    amount: { type: String },
    order_date: { type: String },
    payment_id: { type: String }
},
    { versionKey: false }
)

userSchema.methods.generateAuthToken = async function () {
    try {
        const token = jwt.sign({ _id: this._id.toString }, process.env.SECRET_KEY, { expiresIn: '5m' });
        this.token = token;
        await this.save();
        return token;
    }
    catch (error) {
        console.log("the error part" + error);
    }
}

userSchema.methods.payments = async function (orderdetails, orderGen) {
    try {
        const order_id = orderGen.id;
        const amount = (orderGen.amount / 100);
        const payment_id = orderdetails.razorpay_payment_id;
        var today = new Date();
        var date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
        const order_date = date;
        this.order_id = order_id;
        this.amount = amount;
        this.payment_id = payment_id;
        this.order_date = order_date;
        await this.save();
        return payment_id;
    } catch (error) {
        console.log(error);
    }
}

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
})

var contact = mongoose.model('contact', contactSchema);
var user = mongoose.model('user', userSchema);


// ENDPOINTS
app.get('/', (req, res) => {
    res.status(200).render('home', { error: '' });
})

app.post("/", (req, res) => {
    var gymData = new contact(req.body);
    gymData.save().then(() => {
        res.status(200).render('redirect');
    }).catch(() => res.render("home", { error: 'Email and Mob already exist!' }));
})

app.get('/about', (req, res) => {
    res.status(200).render('about');
})

app.get('/login', (req, res) => {
    res.status(200).render('login', { error: '' });
})

app.post('/login', async (req, res) => {
    try {
        const email = req.body.email;
        const password = req.body.password;
        const result = await user.findOne({ email: email });
        const passwardMatch = await bcrypt.compare(password, result.password);
        const token = await result.generateAuthToken();
        res.cookie("jwt", token, { expires: new Date(Date.now() + 300000), httpOnly: true });
        if (result.email == email && passwardMatch) {
            var Amount = result.amount;
            var purchaseDate = result.order_date;
            var paymentId = result.payment_id;
            console.log(result.payment_id);
            function addDays(date, days) {
                var result = new Date(date);
                result.setDate(result.getDate() + days);
                return result;
            }
            var nextDate = addDays(purchaseDate, 30);
            var expiry = nextDate.getFullYear() + '-' + (nextDate.getMonth() + 1) + '-' + nextDate.getDate();
            if (paymentId == undefined) {
                res.render('profile', { active: '', buy: 'a' });
            }
            else {
                res.render('profile', { active: 'a', a: Amount, b: paymentId, c: purchaseDate, d: expiry, buy: '' });
            }
        }
        else {
            res.render('login', { error: 'Wrong Email id or passward!' });
        }
    }
    catch {
        res.render('login', { error: 'Wrong Email id or passward!' });
    }
})

app.get('/profile', auth, async (req, res) => {
    res.status(200).render('profile');
})

app.get('/signup', (req, res) => {
    res.status(200).render('signup');
})

app.post('/signup', async (req, res) => {
    var userData = new user(req.body);
    const token = await userData.generateAuthToken();
    res.cookie("jwt", token, { expires: new Date(Date.now() + 300000), httpOnly: true });
    userData.save().then(() => {
        res.redirect('/login');
    }).catch(() => res.render("login", { error: 'User already exist! Please login here.' }));
})

app.get("/logout", auth, async (req, res) => {
    try {
        res.clearCookie("jwt");
        console.log("logout success");
        res.redirect('/login');
    } catch (error) {
        res.status(500).send(error);
    }
})

app.post("/order", (req, res) => {
    const razorpay = new Razorpay({
        key_id: process.env.KEY_ID,
        key_secret: process.env.KEY_SECRET
    })
    let options = {
        amount: 150000,
        currency: "INR",
    };
    razorpay.orders.create(options, function (err, order) {
        console.log(order);
        global.orderGen = order;
        res.json(order);
    })
})

app.post("/verifyorder", async (req, res) => {
    var orderdetails = req.body;
    console.log(orderGen);
    console.log(orderdetails);
    const Token = req.cookies.jwt;
    console.log(Token);
    const result = await user.findOne({ token: Token });
    console.log(result)
    const payment_id = await result.payments(orderdetails, orderGen);
    res.render('login', { error: '' });
})


//STARTING SERVER
app.listen(process.env.PORT, (req, res) => {
    console.log("Server Started.");
})


module.exports = user;