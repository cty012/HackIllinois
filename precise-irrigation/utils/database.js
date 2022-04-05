const mysql = require("mysql");

// Database Manager
class DBManager {
    constructor(user, password, database) {
        this.user = user;
        this.password = password;
        this.database = database;
        this.conn = mysql.createConnection({
            host: "localhost",
            user: this.user,
            password: this.password,
            database: this.database,
        });
        this.conn.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
        });
    }

    addUser(username, password, callback) {
        let query = `INSERT INTO users (username, password) VALUES ?;`;
        this.conn.query(query, [[[username, password]]], (err, result) => {
            if (err) throw err;
            console.log("Number of records inserted: " + result.affectedRows);
            console.log("Id: " + result.insertId);
            callback(result.insertId);
        });
    }

    findUser(username, callback) {
        let query = `SELECT * FROM users WHERE username=?;`;
        this.conn.query(query, [username], (err, result) => {
            callback(result.length > 0);
        });
    }

    getUserId(username, callback) {
        let query = `SELECT id FROM users WHERE username=?;`;
        this.conn.query(query, [username], (err, result) => {
            if (err) throw err;
            if (result.length == 0) return;
            callback(result[0].id);
        });
    }

    getUserPassword(username, callback) {
        let query = `SELECT password FROM users WHERE username=?;`;
        this.conn.query(query, [username], (err, result) => {
            if (err) throw err;
            if (result.length == 0) return;
            callback(result[0].password);
        });
    }

    createProfile(user_id, zipcode, plant_types) {
        let query_profile = `INSERT INTO profiles (user_id, zipcode) VALUES ?;`;
        this.conn.query(query_profile, [[[user_id, zipcode]]], (err, result) => {
            if (err) throw err;
            console.log("Number of records inserted: " + result.affectedRows);
        });
        let query_user_plants = `INSERT INTO user_plants (user_id, plant_id) VALUES ?;`;
        plant_types.forEach(plant_type => {
            this.conn.query(query_user_plants, [[[user_id, plant_type]]], (err, result) => {
                if (err) throw err;
                console.log("Number of records inserted: " + result.affectedRows);
            });
        });
    }

    getProfile(user_id, callback) {
        let profile = {
            "zipcode": "",
            "plants": []
        }
        let query_profile = `SELECT zipcode FROM profiles WHERE user_id=?;`;
        this.conn.query(query_profile, [user_id], (err1, result1) => {
            if (err1) throw err1;
            if (result1.length == 0) {
                callback(profile);
                return;
            }
            profile.zipcode = result1[0].zipcode;
            let query_user_plants = `SELECT plant_id FROM user_plants WHERE user_id=?;`;
            this.conn.query(query_user_plants, [user_id], (err2, result2) => {
                if (err2) throw err2;
                profile.plants = result2.map(line => { return line.plant_id; });
                callback(profile);
            });
        });
    }

    getProfileByUsername(username, callback) {
        this.getUserId(username, id => {
            this.getProfile(id, profile => callback(profile));
        });
    }

    getPlantTypes(callback) {
        let query = `SELECT * FROM plant_types;`;
        this.conn.query(query, (err, result) => {
            if (err) throw err;
            let plant_types = [];
            result.forEach(row => {
                plant_types.push({ id: row.id, name: row.name });
            });
            callback(plant_types);
        });
    }
}

exports.DBManager = DBManager;
