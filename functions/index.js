const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const express = require('express');
const app = express();

app.get('/bugs', (req, res) => {
  admin
    .firestore()
    .collection('bugs')
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

  admin
    .firestore()
    .collection('bugs')
    .add(newBug)
    .then(doc => {
      res.json({ message: `document ${doc.id} added successfully` });
    })
    .catch(error => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(error);
    });
});

exports.api = functions.region('europe-west1').https.onRequest(app);
