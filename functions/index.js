const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./Utility/FBAuth'); //For authentication

const {
  getAllBugs,
  postBug,
  getBug,
  commentBug,
  deleteBug,
  assignBug,
  unAssignBug,
} = require('./Handlers/Bugs');
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
app.get('/bug/:bugId', getBug);
app.delete('/bug/:bugId', FBAuth, deleteBug);
app.get('/bug/:bugId/assignBug', FBAuth, assignBug); //User can mark that they are on the bug
app.get('/bug/:bugId/unAssignBug', FBAuth, unAssignBug); //User can UnMark that they are on it
app.post('/bug/:bugId/comment', FBAuth, commentBug);

// User Routes
app.post('/signup', signup); // Signup
app.post('/login', login); // login
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);

//Firebase Authentication Middleware

exports.api = functions.region('europe-west1').https.onRequest(app);
