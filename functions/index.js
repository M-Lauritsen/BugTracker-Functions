const functions = require('firebase-functions');
const admin = require('firebase-admin');
const firebase = require('firebase');
const app = require('express')();

const Config = {
  apiKey: 'AIzaSyAz0ykIL2gjxuta2D1ftKlMEQlhTrbLgNQ',
  authDomain: 'bugtracker-8b0d5.firebaseapp.com',
  databaseURL: 'https://bugtracker-8b0d5.firebaseio.com',
  projectId: 'bugtracker-8b0d5',
  storageBucket: 'bugtracker-8b0d5.appspot.com',
  messagingSenderId: '716587226540',
  appId: '1:716587226540:web:e2de17e6dbfe31bbde9609',
  measurementId: 'G-2MD3NY3QYQ',
};

// Initialize Firebase

admin.initializeApp();
firebase.initializeApp(Config);
//firebase.analytics();

const db = admin.firestore();

app.get('/bugs', (req, res) => {
  db.collection('bugs')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let bugs = [];
      data.forEach(doc => {
        bugs.push({
          bugId: doc.id,
          title: doc.data().title,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(bugs);
    })
    .catch(error => console.log(error));
});

app.post('/bug', (req, res) => {
  const newBug = {
    userHandle: req.body.userHandle,
    title: req.body.title,
    body: req.body.body,
    createdAt: new Date().toISOString(),
  };

  db.collection('bugs')
    .add(newBug)
    .then(doc => {
      res.json({ message: `document ${doc.id} added successfully` });
    })
    .catch(error => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(error);
    });
});

// Signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  //TODO validate data

  let token, userId;
  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: 'this handle is taken' });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(error => {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        return res.status(400).json({ message: 'Email is already registered' });
      }
      return res.status(500).json({ error: error.code });
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
