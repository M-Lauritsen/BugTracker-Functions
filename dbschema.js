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
};
