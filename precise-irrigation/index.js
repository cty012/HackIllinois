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
app.use(bodyParser.urlencoded({extended: false}));
app.listen("80");

// Set up the login sessions
const SECRET_KEY = "averylongandrandomsecretkeyOIJBVSFDALLOSBVNLS";
app.use(sessions({
    secret: SECRET_KEY,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 },  // 1 hour
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
        res.sendFile(path.join(__dirname, "/public/views/user/index.html"));
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
    dbManager.findUser(username, exist => {
        if (!exist) {
            res.redirect("/login");
            return;
        }
        dbManager.getUserPassword(username, actual_password => {
            if (password != actual_password) {
                res.redirect("/login");
                return;
            }
            // set up a session
            req.session.username = username;
            res.redirect("/home");
        });
    });
});

app.post("/register/check", (req, res) => {
    // check if exist
    let username = req.body.username;
    let password = req.body.password;
    let zipcode = req.body.zipcode;
    // check if password matches
    if (password != req.body.cpassword) {
        res.redirect("/register");
        return;
    }
    dbManager.findUser(username, exist => {
        if (exist) {
            res.redirect("/register");
            return;
        }
        // register
        dbManager.addUser(username, password, insertId => {
            dbManager.getPlantTypes(plant_types => {
                user_plant_types = [];
                plant_types.forEach(plant_type => {
                    if (req.body[plant_type.name]) user_plant_types.push(plant_type.id);
                });
                dbManager.createProfile(insertId, zipcode, user_plant_types);
                res.redirect("/login");
            });
        });
    });
});
