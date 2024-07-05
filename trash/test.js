import express, { json } from 'express';
import Gun from 'gun';
import 'gun/sea.js'  // SEA is the security library for Gun
const app = express();
// Parse JSON bodies for POST requests
app.use(json());

const port = 3000;

const gun = Gun({
  file: 'data.json'
});


const createUser = async (username, password) => {
  const pair = await Gun.SEA.pair();
  gun.get('users').get(username).put({
    pub: pair.pub,
    username,
    password: await Gun.SEA.work(password, pair),
  });

  console.log(`${username} -> ${pair.pub}`)
  return pair;
};

const initializeUsers = async () => {
  const owner = await createUser('owner', 'ownerpass1');
  const follower1 = await createUser('follower1', 'password1');
  const follower2 = await createUser('follower2', 'password2');
  return { owner, follower1, follower2 };
};

// Initialize the users
let owner, follower1, follower2;
initializeUsers().then(users => {
  ({ owner, follower1, follower2 } = users);
});

// API to add a follower
app.post('/addFollower', async (req, res) => {
  const { followedUserPub, followerUsername, followerPassword } = req.body;
  if (!followedUserPub || !followerUsername || !followerPassword) {
    return res.status(400).send('Missing followedUserPub, followerUsername, or followerPassword');
  }

  const followerNode = gun.get('users').get(followerUsername);
  followerNode.once(async (data) => {
    if (!data) {
      return res.status(404).send('Follower user not found');
    }

    const follower = {
      username: followerUsername,
      pub: data.pub,
    };

    const followersNode = gun.get('users').get(followedUserPub).get('followers');
    const followerEntry = followersNode.get(follower.pub);

    const signedData = await Gun.SEA.sign(follower, { priv: "test", pub: data.pub });
    followerEntry.put(signedData, async (ack) => {
      if (ack.err) {
        return res.status(500).send('Failed to add follower');
      }

      // Optionally, you can add read permissions for everyone
      const readPermission = await Gun.SEA.sign('read', { pub: data.pub });
      followersNode.get('_').get('read').put(readPermission);

      res.status(200).send('Follower added successfully');
    });
  });
});

// API to remove a follower
app.post('/removeFollower', async (req, res) => {
  const { followedUserPub, followerUsername, followerPassword } = req.body;
  if (!followedUserPub || !followerUsername || !followerPassword) {
    return res.status(400).send('Missing followedUserPub, followerUsername, or followerPassword');
  }

  const followerNode = gun.get('users').get(followerUsername);
  followerNode.once(async (data) => {
    if (!data) {
      return res.status(404).send('Follower user not found');
    }

    // const verifiedPassword = await Gun.SEA.work(followerPassword, data);
    // if (verifiedPassword !== data.password) {
    //   return res.status(401).send('Invalid password');
    // }

    const followersNode = gun.get('users').get(followedUserPub).get('followers');
    const followerEntry = followersNode.get(data.pub);

    followerEntry.once(async (entryData) => {
      if (entryData) {
        const verifiedEntry = await Gun.SEA.verify(entryData, data.pub);
        if (verifiedEntry) {
          followerEntry.put(null, (ack) => {
            if (ack.err) {
              return res.status(500).send('Failed to remove follower');
            }
            res.status(200).send('Follower removed successfully');
          });
        } else {
          res.status(403).send('Permission denied');
        }
      } else {
        res.status(404).send('Follower not found');
      }
    });
  });
});

// API to get followers
// API to get followers
app.get('/getFollowers/:ownerPub', (req, res) => {
  const ownerPub = req.params.ownerPub;
  const followersNode = gun.get('users').get(ownerPub).get('followers');
  const followersList = [];

  followersNode.map().once((data) => {
    if (data) {
      followersList.push(data); // Push the data directly
    }
  });

  // Wait for a while to collect the data
  setTimeout(() => {
    res.status(200).json(followersList);
  }, 2000);
});


// API to remove a follower
app.post('/removeFollower', async (req, res) => {
  const { followedUserPub, followerUsername, followerPassword } = req.body;
  if (!followedUserPub || !followerUsername || !followerPassword) {
    return res.status(400).send('Missing followedUserPub, followerUsername, or followerPassword');
  }

  const followerNode = gun.get('users').get(followerUsername);
  followerNode.once(async (data) => {
    if (!data) {
      return res.status(404).send('Follower user not found');
    }

    const verifiedPassword = await Gun.SEA.work(followerPassword, data);
    if (verifiedPassword !== data.password) {
      return res.status(401).send('Invalid password');
    }

    const followersNode = gun.get('users').get(followedUserPub).get('followers');
    const followerEntry = followersNode.get(data.pub);

    followerEntry.once(async (entryData) => {
      if (entryData) {
        const verifiedEntry = await Gun.SEA.verify(entryData, data.pub);
        if (verifiedEntry) {
          followerEntry.put(null, (ack) => {
            if (ack.err) {
              return res.status(500).send('Failed to remove follower');
            }
            res.status(200).send('Follower removed successfully');
          });
        } else {
          res.status(403).send('Permission denied');
        }
      } else {
        res.status(404).send('Follower not found');
      }
    });
  });
});



app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

