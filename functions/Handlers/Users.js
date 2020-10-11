const { admin, db } = require('../Utility/admin');

const config = require('../Utility/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const {
  validateSignupData,
  validateLoginData,
  reduceUserDetails,
} = require('../Utility/validators');
const { json } = require('express');

//user signup
exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    department: req.body.department,
    username: req.body.username,
  };

  const { valid, errors } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  const noImg = 'no-img.jpg';

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
        department: newUser.department,
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
      return res
        .status(500)
        .json({ general: 'Something went wrong, please try again' });
    });
};

// User login
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

// Add user Details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);
  console.log(userDetails);
  db.doc(`/users/${req.user.username}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: 'Details added' });
    })
    .catch(err => {
      return res.status(500).json({ error: err.code });
    });
};

//Get any users details
exports.getUserDetails = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.params.username}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.user = doc.data();
        return db
          .collection('bugs')
          .where('username', '==', req.params.username)
          .orderBy('createdAt', 'desc')
          .get();
      } else {
        return res.status(404).json({ error: 'User not found!' });
      }
    })
    .then(data => {
      userData.bugs = [];
      data.forEach(doc => {
        userData.bugs.push({
          body: doc.data().body,
          createdAt: doc.data().createdAt,
          username: doc.data().username,
          userImage: doc.data().userImage,
          assignCount: doc.data().assignCount,
          commentCount: doc.data().commentCount,
          bugId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

// get own credentials
exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.username}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        userData.credentials = doc.data();
        return db
          .collection('assigns')
          .where('username', '==', req.user.username)
          .get();
      }
    })
    .then(data => {
      userData.assigned = [];
      data.forEach(doc => {
        userData.assigned.push(doc.data());
      });
      return db
        .collection('notifications')
        .where('recipient', '==', req.user.username)
        .orderBy('createdAt', 'desc')
        .limit(15)
        .get();
    })
    .then(data => {
      userData.notifications = [];
      data.forEach(doc => {
        userData.notifications.push({
          recipient: doc.data().recipient,
          sender: doc.data().sender,
          createdAt: doc.data().createdAt,
          bugId: doc.data().bugId,
          type: doc.data().type,
          read: doc.data().read,
          notificationId: doc.id,
        });
      });
      return res.json(userData);
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

//Image Upload to user using BusBoy
exports.uploadImage = (req, res) => {
  const BusBoy = require('busboy');
  const path = require('path');
  const os = require('os');
  const fs = require('fs');

  const busboy = new BusBoy({ headers: req.headers });

  let imageFileName;
  let imageToBeUploaded = {};

  busboy.on('file', (fildname, file, filename, encoding, mimetype) => {
    //If Mimetype isn't a jpg or png
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
      return res.status(400).json({ error: 'Wrong File Type' });
    }
    //Converts my.imagename.jpg(or any other image file)
    const imageExtension = filename.split('.')[filename.split('.').length - 1];

    //to 98324987.jpg
    imageFileName = `${Math.round(Math.random() * 1000000)}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on('finish', () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype,
          },
        },
      })
      .then(() => {
        //?alt=media add its to the browser instead of downloading the image
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
        return db.doc(`/users/${req.user.username}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: 'Image uploaded' });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ message: err.code });
      });
  });
  busboy.end(req.rawBody);
};

//firebase batch write
exports.markNotificationsRead = (req, res) => {
  let batch = db.batch();
  req.body.forEach(notificationId => {
    const notification = db.doc(`/notifications/${notificationId}`);
    batch.update(notification, { read: true });
  });
  batch
    .commit()
    .then(() => {
      return res.json({ message: 'Notification Read' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
