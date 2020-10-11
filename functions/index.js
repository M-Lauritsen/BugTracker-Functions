const functions = require('firebase-functions');
const { db } = require('./Utility/admin');

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
  getUserDetails,
  // markNotificationsRead,
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
app.get('/user/:username', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);

//Firebase Authentication Middleware
exports.api = functions.region('europe-west1').https.onRequest(app);

exports.createNotificationOnAssign = functions
  .region('europe-west1')
  .firestore.document('assigns/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/bugs/${snapshot.data().bugId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().username !== snapshot.data().username) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: 'assign',
            read: false,
            bugId: doc.id,
          });
        }
      })
      .catch(err => console.error(err));
  });

exports.deleteNotificationOnUnassign = functions
  .region('europe-west1')
  .firestore.document('assigns/{id}')
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region('europe-west1')
  .firestore.document('comments/{id}')
  .onCreate(snapshot => {
    return db
      .doc(`/bugs/${snapshot.data().bugId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().username !== snapshot.data().username) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().username,
            sender: snapshot.data().username,
            type: 'comment',
            read: false,
            bugId: doc.id,
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

//m_u6P5k0vP0?list=PLPIIo7YIVvMkpPWcfxRHCHBX2W6ghMR9O&t=14634
exports;
