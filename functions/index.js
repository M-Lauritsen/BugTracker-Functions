const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./Utility/FBAuth');

const { getAllBugs, postBug } = require('./Handlers/Bugs');
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser,
} = require('./Handlers/Users');

//Bugs Routes
app.get('/bugs', getAllBugs); // Get all bugs
app.post('/bug', FBAuth, postBug); // Post a bug

// User Routes
app.post('/signup', signup); // Signup
app.post('/login', login); // login
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

//Firebase Authentication Middleware

exports.api = functions.region('europe-west1').https.onRequest(app);

//https://youtu.be/m_u6P5k0vP0?list=PLPIIo7YIVvMkpPWcfxRHCHBX2W6ghMR9O&t=9158
