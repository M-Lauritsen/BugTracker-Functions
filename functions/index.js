const functions = require('firebase-functions');

const { getAllBugs } = require('./Handlers/Bugs');
const { signup, login } = require('./Handlers/Users');

const firebase = require('firebase');
const app = require('express')();

// Initialize Firebase

firebase.initializeApp(Config);
//firebase.analytics();

//Bugs Routes
app.get('/bugs', getAllBugs); // Get all bugs
app.post('/bug', FBAuth, postBug); // Post a bug

// User Routes
app.post('/signup', signup); // Signup
app.post('/login', login); // login

//Firebase Authentication Middleware




exports.api = functions.region('europe-west1').https.onRequest(app);
