import express, { json } from 'express';
import Gun from 'gun';
import 'gun/sea.js'  // SEA is the security library for Gun

const gun = Gun({
    file: 'data.json'
  });
// Create a root collection
const rootCollection = gun.get('my_collection');

// Function to create a user node
// Function to create a user node
function createUserNode(userId) {
    const userNode = rootCollection.get(userId);
    // Set read-only access for everyone
    userNode.put({ $: { read: true } });
    return userNode;
}

// Example usage
const user1Node = createUserNode('user1');
const user2Node = createUserNode('user2');

// User-specific data
user1Node.put({ name: 'Alice', age: 30 });
user2Node.put({ name: 'Bob', age: 25 });

// Function to allow read-write access for the owner
function setOwnerReadWriteAccess(userId) {
    const userNode = rootCollection.get(userId);
    userNode.put({ $: { read: true, write: userId } });
}

// Example usage (only user1 can read-write their data)
setOwnerReadWriteAccess('user1');

