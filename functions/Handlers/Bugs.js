const { db } = require('../Utility');

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
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
        });
      });
      return res.json(bugs);
    })
    .catch(error => console.log(error));
};

exports.postBug = (req, res) => {
  if (req.body.body.trim() === '') {
    return res
      .status(400)
      .json({ body: 'Description of bug must not be empty' });
  }

  const newBug = {
    userHandle: req.user.handle,
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
