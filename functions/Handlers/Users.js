const { db } = require('../Utility/admin');

const config = require('../Utility/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
} = require('../Utility/validators');

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    username: req.body.username,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  let token, userId;
  db.doc(`/users/${newUser.username}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ username: 'this username is taken' });
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
        username: newUser.username,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        userId,
      };
      return db.doc(`/users/${newUser.username}`).set(userCredentials);
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
};

exports.login = (req, res) => {
  
  const user = {
    email: req.body.email,
    password: req.body.password,
  };
  
  const { valid, errors } = validateLoginData(user);
  
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(error => {
      if (error.code === 'auth/wrong-password') {
        return res
          .status(403)
          .json({ general: 'Wrong Credentials, please try again' });
      } else return res.status(500).json({ error: error.code });
    });
};
