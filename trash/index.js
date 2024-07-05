const Gun = require('gun');
const SEA = require('gun/sea');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

const gun = Gun({
  file: 'data.json'
});

// Create user
function createUser(username, password) {
  return new Promise((resolve, reject) => {
    const user = gun.user();
    user.create(username, password, (ack) => {
      if (ack.err) {
        reject(`Error creating user ${username}: ${ack.err}`);
      } else {
        resolve(`User ${username} created successfully`);
      }
    });
  });
}

// Authenticate user
function authenticateUser(username, password) {
    return new Promise((resolve, reject) => {
      const user = gun.user();
      user.auth(username, password, (ack) => {
        if (ack.err) {
          reject(`Error authenticating user ${username}: ${ack.err}`);
        } else {
          resolve(user); // Return the Gun user object, not just the username
        }
      });
    });
  }
  

// Follow a user
async function followUser(followerUsername, followerPassword, followedUsername) {
  return new Promise((resolve, reject) => {
    gun.get('~@' + followedUsername).once(async (data, key) => {
      if (data) {
        const followedUserPub = data.pub;
        const followerUser = gun.user();
        followerUser.auth(followerUsername, followerPassword, (ack) => {
      });

        console.log('Follower user:', followerUser);
        followerUser.get('following').set(followedUserPub);
        gun.get('~' + followedUserPub).get('followers').set(followerUser.pair().pub);
        console.log(`User ${followerUser.is.alias} is now following ${followedUsername}`);
        resolve(`User ${followerUser.is.alias} is now following ${followedUsername}`);
      } else {
        reject(`User ${followedUsername} not found`);
      }
    });
  });
}

// Get total followers
function getFollowers(pub) {
  return new Promise((resolve, reject) => {
    let followers = [];
    gun.get('~' + pub).get('followers').once((followerPub) => {
      if (followerPub) {
        followers.push(followerPub);
      }
    }, () => {
      resolve(followers);
    });
  });
}

// Initialize users and follow relationships
async function initializeUsers() {
  try {
    await createUser('user10', 'password10');
    await createUser('user20', 'password20');
    const user20 = await authenticateUser('user20', 'password20');
    await followUser('user20','password20', 'user10');
  } catch (error) {
    console.error('Error initializing users:', error);
  }
}

app.post('/createUser', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await createUser(username, password);
    res.send(result);
  } catch (error) {
    res.status(500).send(`Error creating user ${username}: ${error}`);
  }
});

app.post('/addFollower', async (req, res) => {
    const { followerUsername, followerPassword, followedUsername } = req.body;
    try {
      const followerUser = await authenticateUser(followerUsername, followerPassword);
      const result = await followUser(followerUser, followedUsername); // Pass followerUser here
      res.send(result);
    } catch (error) {
      res.status(500).send(`Error adding follower: ${error}`);
    }
  });
  

app.get('/followers/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const user = await authenticateUser(username, 'password10'); // Use dummy password for authentication
    const followers = await getFollowers(user.pair.pub);
    res.json({ followers });
  } catch (error) {
    res.status(500).send(`Error getting followers: ${error}`);
  }
});

app.post('/addFollower', async (req, res) => {
    const { followerUsername, followerPassword, followedUsername } = req.body;
    try {
      const followerUser = await authenticateUser(followerUsername, followerPassword);
      const result = await followUser(followerUsername, followerPassword, followedUsername); // Pass followerUsername and followerPassword here
      res.send(result);
    } catch (error) {
      res.status(500).send(`Error adding follower: ${error}`);
    }
  });
  

// Serve static files (e.g., HTML, CSS, JS)
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);

  // Call initializeUsers to create initial users and set up following
  initializeUsers();
});
