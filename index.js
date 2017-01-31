var express = require("express");
var app = express();
var path = require("path");
var checkUrl = require("./urlcheck.js");
var mongo = require("mongodb").MongoClient;
var db_url = 'mongodb://localhost:27017/local';
var database;
var characters_short_url = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var start_count = 14776336;
const BASE = characters_short_url.length;
const heroku_url = "https://secure-island-41081.herokuapp.com/";

intitialize_db();

app.get('/', function(req, res) {
    res.setHeader('Content-Type', 'text/html')
    res.sendFile(path.join(__dirname, 'index.html'));
})

app.get('/new/:prot://:website', function(req, res) {
    console.log(req.params);
    var protocol = req.params['prot'];
    var website = req.params['website'];
    if (checkUrl(protocol, website)) {
        var url = req.params['prot'] + "://" + req.params['website'];
        getNextCount(res, url, afterShort);
    }
    else {
        sendDefaultError(res);
    }
});

app.get('/:short', function(req, res) {
    res.setHeader('Content-Type', 'text/plain');
    database.collection('urlsmap').find({
        short: req.params['short']
    }, function(err, cursor) {
        cursor.toArray(function(err, documents) {
            if (err) console.log("The error is " + err);
            if (documents.length) {
                res.redirect(documents[0]['full']);
            }
            else {
                res.end("Couldn't find anything");
            }
        });
    });
});

app.listen(8080, function(req, res) {
    console.log("Listening");
});

function afterShort(err, res, url, data) {
    if (err) console.log(" Something Went Wrong");
    else {
        var shortened_url = shortThisUrl(data);
        database.collection('urlsmap').insert({
            _id: data,
            short: shortened_url,
            full: url
        });
        sendSuccess(res, shortened_url, url);
    }
}

/* Connect to database server. Connection will remain open.
/* Call this method to start the connection*/
function intitialize_db() {
    mongo.connect(db_url, function(err, db) {
        if (err) console.log('Unable to connect to the mongoDB server. Error:');
        else {
            database = db;
            database.createCollection("counter");
            database.createCollection("urlsmap");
            /* Sequence Number chosen to make url's 4 byte long. Will fail upon addition of many url's*/
            database.collection("counter").insert({
                _id: "root",
                seq: start_count
            });
        }
    });
}

/* Call this method to close the database connection if setup*/
function close_db() {
    try {
        database.close();
    }
    catch (err) {
        console.log("Cannot close the connection || Or already closed");
    }
}

function shortThisUrl(id) {
    var digits = [];
    while (id > 0) {
        var temp = id % BASE;
        digits.push(characters_short_url.charAt(temp));
        id = Math.floor(id / BASE);
    }
    return digits.reverse().join('');
}

function getNextCount(res, url, callback) {
    var value;
    database.collection('counter').update({
        _id: "root"
    }, {
        $inc: {
            seq: 1
        }
    });
    database.collection('counter').find({
        "_id": "root"
    }).toArray(function(err, documents) {
        if (err) console.log(" The error is " + err);
        value = documents[0]['seq'];
        callback(err, res, url, value);
    });
}

function sendDefaultError(res) {
    res.setHeader('Content-type', 'text/plain');
    res.end(JSON.stringify({
        "error": "Error, wrong format. Kindly check the URL you have submitted"
    }));
}

function sendSuccess(res, short, full) {
    console.log(" Full is " + full);
    console.log(" Short is " + short);
    res.setHeader('Content-type', 'text/plain');
    res.send(JSON.stringify({
        "original": full,
        "new": heroku_url + short
    }));
    res.end();
}
