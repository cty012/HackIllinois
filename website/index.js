const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const path = require("path");
const process = require("process");
const sessions = require('express-session');

const db = require("./utils/database.js");

// Change default folder
process.chdir(path.join(__dirname, "public"));

// Set up server
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.listen("8080");

// Set up the login sessions
const SECRET_KEY = "averylongandrandomsecretkeyOIJBVSFDALLOSBVNLS";
app.use(sessions({
    secret: SECRET_KEY,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 2 },  // 2 hour
    resave: false
}));
app.use(cookieParser());

// Set up the database
var dbManager = new db.DBManager("irrigation", "hackillinois", "precise_irrigation");

// GET requests
app.get("/", (req, res) => { res.redirect("/home"); });

app.get("/home", (req, res) => {
    if (req.session.username) {
        res.sendFile(path.join(__dirname, "/public/views/home/index.html"));
    } else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/views/login/index.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "/public/views/register/index.html"));
});

app.get("/user", (req, res) => {
    if (req.session.username) {
        res.sendFile(path.join(__dirname, "/public/views/profile/index.html"));
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

app.get("/user/profile", (req, res) => {
    // check password
    if (!req.session.username) return;
    dbManager.getProfileByUsername(profile => { res.json(profile); });
});

// POST request
app.post("/login/check", (req, res) => {
    // check password
    let username = req.body.username;
    let password = req.body.password;
    dbManager.getUserPassword(username, actual_password => {
        if (password != actual_password) {
            res.redirect("/login");
            return;
        }
        // Set up a session
        req.session.username = username;
        res.redirect("/user");
    });
});
