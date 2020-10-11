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
    .catch(error => console.log(error));
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
    bugId: req.param.bugId,
    username: req.user.username,
    userImage: req.user.imageUrl,
  };

  db.doc(`/bugs/${req.param.bugs}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Bug does not exits' });
      } // https://youtu.be/m_u6P5k0vP0?list=PLPIIo7YIVvMkpPWcfxRHCHBX2W6ghMR9O&t=10289
    });
};
