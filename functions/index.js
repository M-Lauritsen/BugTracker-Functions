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
  markNotificationsRead,
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

//trigger that sends a notification if a user assigns a bug
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

//trigger that deletes the assign notification again
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

//trigger for notification on comments
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

//trigger that updates the userImage if the user changes the image
exports.onUserImageChange = functions
  .region('europe-west1')
  .firestore.document('/users/{userId}')
  .onUpdate(change => {
    console.log(change.before.data()); // Check logs under Firebase/functions
    console.log(change.after.data()); // Check logs under Firebase/functions
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      let batch = db.batch();
      return db
        .collection('bugs')
        .where('username', '==', change.before.data().username)
        .get()
        .then(data => {
          data.forEach(doc => {
            const bug = db.doc(`/bugs/${doc.id}`);
            batch.update(bug, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    } else return true; //If user just changed some details
  });

//Trigger that Deletes comments, assigns and notifications
exports.onDeleteBug = functions
  .region('europe-west1')
  .firestore.document('/bugs/{bugId}')
  .onDelete((snapshot, context) => {
    const bugId = context.params.bugId;
    const batch = db.batch();
    return db
      .collection('comments')
      .where('bugId', '==', bugId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comments/${doc.id}`));
        });
        return db.collection('assigns').where('bugId', '==', bugId).get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/assigns/${doc.id}`));
        });
        return db.collection('notifications').where('bugId', '==', bugId).get();
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(err => {
        console.error(err);
      });
  });
