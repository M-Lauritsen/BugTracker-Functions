const { db } = require('../Utility/admin');

//Retrieve all bugs
exports.getAllBugs = (req, res) => {
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
          username: doc.data().username,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(bugs);
    })
    .catch(error => console.error(error));
};

//Post new bug
exports.postBug = (req, res) => {
  if (req.body.body.trim() === '') {
    return res
      .status(400)
      .json({ body: 'Description of bug must not be empty' });
  }

  const newBug = {
    username: req.user.username,
    title: req.body.title,
    body: req.body.body,
    userImage: req.user.imageUrl,
    assignCount: 0,
    commentCount: 0,
    createdAt: new Date().toISOString(),
  };

  db.collection('bugs')
    .add(newBug)
    .then(doc => {
      const resBug = newBug;
      resBug.bugId = doc.id;
      res.json(resBug);
    })
    .catch(error => {
      res.status(500).json({ error: 'Something went wrong' });
      console.log(error);
    });
};

//Retrieve a bug
exports.getBug = (req, res) => {
  let bugData = {};
  db.doc(`/bugs/${req.params.bugId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Bug not found' });
      }
      bugData = doc.data();
      bugData.bugId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc') //Remember to create index @firebase.console
        .where('bugId', '==', req.params.bugId)
        .get();
    })
    .then(data => {
      bugData.comments = [];
      data.forEach(doc => {
        bugData.comments.push(doc.data());
      });
      return res.json(bugData);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Comment Bug
exports.commentBug = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ error: 'Must no be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    bugId: req.params.bugId,
    username: req.user.username,
    userImage: req.user.imageUrl,
  };

  db.doc(`/bugs/${req.params.bugId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Bug does not exits' });
      }
      return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
    })
    .then(() => {
      return db.collection('comments').add(newComment);
    })
    .then(() => {
      res.json(newComment);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: 'something went wrong' });
    });
};

//user marks they are on it
exports.assignBug = (req, res) => {
  const assignDocument = db
    .collection('assigns')
    .where('username', '==', req.user.username)
    .where('bugId', '==', req.params.bugId)
    .limit(1);

  const bugDocument = db.doc(`/bugs/${req.params.bugId}`);

  let bugData;

  bugDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        bugData = doc.data();
        bugData.bugId = doc.id;
        return assignDocument.get();
      } else {
        return res.status(404).json({ error: 'Bug Not found!' });
      }
    })
    .then(data => {
      if (data.empty) {
        return db
          .collection('assigns')
          .add({
            bugId: req.params.bugId,
            username: req.user.username,
          })
          .then(() => {
            bugData.assignCount++;
            return bugDocument.update({ assignCount: bugData.assignCount });
          })
          .then(() => {
            return res.json(bugData);
          });
      } else {
        return res.status(400).json({ error: 'Already on the bug!' });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

exports.unAssignBug = (req, res) => {
  const assignDocument = db
    .collection('assigns')
    .where('username', '==', req.user.username)
    .where('bugId', '==', req.params.bugId)
    .limit(1);

  const bugDocument = db.doc(`/bugs/${req.params.bugId}`);

  let bugData;

  bugDocument
    .get()
    .then(doc => {
      if (doc.exists) {
        bugData = doc.data();
        bugData.bugId = doc.id;
        return assignDocument.get();
      } else {
        return res.status(404).json({ error: 'Bug Not found!' });
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: 'You are not on the bug!' });
      } else {
        return db
          .doc(`/assigns/${data.docs[0].id}`)
          .delete()
          .then(() => {
            bugData.assignCount--;
            return bugDocument.update({ assignCount: bugData.assignCount });
          })
          .then(() => {
            res.json(bugData);
          });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

//Delete Bug
exports.deleteBug = (req, res) => {
  const document = db.doc(`/bugs/${req.params.bugId}`);
  document
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Bug not found!' });
      }
      if (doc.data().username !== req.user.username) {
        return res.status(403).json({ error: 'Unauthorized' });
      } else {
        return document.delete();
      }
    })
    .then(() => {
      res.json({ message: 'Bug Deleted' });
    })
    .catch(err => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};
