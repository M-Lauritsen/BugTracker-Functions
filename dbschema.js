let db = {
  users: [
    {
      userId: 'random Fb uid',
      email: 'user@email.com',
      createdAt: '2020-10-07T16:15:55.596Z',
      imageUrl: 'image/20912901324.jpg',
      department: 'Developer', // not added
      username: 'user',
    },
  ],
  bugs: [
    {
      username: 'user', //owner
      title: 'Title for the bug', // title
      body: 'Description of the bug', // Description
      createdAt: '2020-10-07T16:15:55.596Z', // Date string
      onItCount: 3, // people that are on the bug
      commentCount: 4, // comments
    },
  ],
  comments: [
    {
      username: 'user',
      bugId: 'bugid',
      body: 'First bug',
      createdAt: '2020-10-07T16:15:55.596Z',
    },
  ],
};

const userDetails = {
  credentials: {
    userId: 'LAJKNLKGMDAV321ASd321',
    email: 'user@gmail.com',
    username: 'user',
    createdAt: '2020-10-07T16:15:55.596Z',
    imageUrl: 'image/1234234.jpg',
    department: 'Developer',
  },
  onIt: [
    {
      username: 'user',
      bugId: 'LKML23434KLM2',
    },
    {
      username: 'user',
      bugId: '2134KLN334LKM',
    },
  ],
};
