import express from 'express';
import Gun from 'gun';
import 'gun/sea.js'; // Include if using SEA with Gun
import bodyParser from 'body-parser';

// Initialize GUNDB and Express
const gun = Gun();
const app = express();
app.use(bodyParser.json());

// Function to create a new user
// Function to create a new user
function createUser(username, password, name, callback) {
    gun.user().create(username, password, (ack) => {
      if (ack.err) {
        callback(ack.err, null);
      } else {
        const user = gun.user().auth(username, password, (authAck) => {
          if (authAck.err) {
            callback(authAck.err, null);
          } else {
             // Create and store profile data under 'mydata' node
             console.log(ack)
           user.get('mydata').put({ name: name }, (profileAck) => {
              if (profileAck.err) {
                callback(profileAck.err, null);
              } else {
                //callback(null, 'User profile data saved');
              }
            });
            
            user.get('mydata').once((data) => {
                if (data) {
                  // Log the entire data object for debugging
                  console.log(data);
                  callback(null, {name:data.name});
                } else {
                  callback('User not found', null);
                }
              });
            

          }
        });
      }
    });
  }
  

// Function to get a user's name by username
function getUserByUsername(username, callback) {
  gun.get('~@' + username).once((data, key) => {
    if (data) {
      const publicKey = Object.keys(data["_"][">"])[0];
      gun.get(publicKey).get('mydata').once((data, key) => {
        if (data) {
        console.log(data); // Log the entire data object
    
        // Access specific properties from the data object
        const name = data.name;
        callback(null,{name:data.name})
        // Continue processing or using the retrieved data as needed
        } else {
        console.log('User data not found or inaccessible');
        callback('User data not found or inaccessible', null);
        }
    });
    } else {
      callback('User not found', null);
    }
  });
    // Retrieve data stored under the user's space
    
  }
 
  

// API endpoint to create a new user
app.post('/createUser', (req, res) => {
  const { username, password, name } = req.body;
  createUser(username, password, name, (err, message) => {
    if (err) {
      res.status(400).send({ error: err });
    } else {
      res.send({ message: message });
    }
  });
});

// API endpoint to get user by username
app.get('/getUser/:username', (req, res) => {
  const username = req.params.username;
  getUserByUsername(username, (err, userData) => {
    if (err) {
      res.status(404).send({ error: err });
    } else {
      res.send(userData);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
