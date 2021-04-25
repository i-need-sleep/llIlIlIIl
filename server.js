const express = require("express");
const { ExpressPeerServer } = require("peer");
var cors = require('cors')

const app = express();
app.use(express.static("public"));
app.use(cors()) // CORS enabled for all routes
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

// Globals
var invitations = []
var conformations = []

// Serve the index page
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// Handle requests (no editing outside this section)/////////////////////////////////////////////////////
// Peer Invitations
app.post("/invite", (request, response) => {
  let invitation = request.body
  let insert_flag = true
  for (let i=0; i<invitations.length; i++){
    if (invitations[i].self_name == invitation.self_name && invitations[i].target_name == invitation.target_name){
      invitations[i] = invitation
      insert_flag = false
    }
  }
  if (insert_flag){
    invitations.push(invitation)
  }
  response.sendStatus(200);
});

app.post("/checkInvite", (request, response) => {
  let name = request.body.self_name
  let out = []
  for (let i=0; i<invitations.length; i++){
    if (invitations[i].target_name.includes(name)){
      out.push(invitations[i])
    }
  }
  response.send(out)
});

app.post("/confirmInvite", (request, response) => {
  let conformation = request.body
  let insert_flag = true
  for (let i=0; i<conformations.length; i++){
    if (conformations[i].sender_name == conformation.sender_name && conformations[i].confirm_name == conformation.confirm_name){
      conformations[i] = conformation
      insert_flag = false
    }
  }
  if (insert_flag){
    conformations.push(conformation)
  }
  response.sendStatus(200);
});

app.post("/checkConfInvite", (request, response) => {
  let name = request.body.self_name
  let out = []
  for (let i=0; i<conformations.length; i++){
    if (conformations[i].sender_name[conformations[i].sender_name.length-1] == name){
      out.push(conformations[i])
    }
  }
  response.send(out)
});

// For debugging only, clears the records
app.get("/debug_clearRecords", (request, response) => {
  invitations = []
  conformations = []
  db.database().ref("messages").remove()
  db.database().ref("userlist").remove()
  response.send({invitations: invitations, conformations: conformations})
});

// Listen////////////////////////////////////////////////////////////////////////////////////////////////
const listener = app.listen(process.env.PORT, () => { //process.env.PORT 8888
  console.log("Server listening on port " + listener.address().port);
});

// Peer server: /peerjs/broker
const peerServer = ExpressPeerServer(listener, {
  debug: true,
  path: '/broker'
});

app.use('/peerjs', peerServer);


// REMOVE THINGS
var firebase = require('firebase');

const config = {
	apiKey: "AIzaSyC1wuDVw3r3hira1fEK3nYCbX6nu66bfqg",
	authDomain: "thething-98c2d.firebaseapp.com",
	projectId: "thething-98c2d",
	storageBucket: "thething-98c2d.appspot.com",
	messagingSenderId: "835718742144",
	appId: "1:835718742144:web:9809226ab6c8ba3cdee665"
}

const db = firebase.initializeApp(config);

// On startup, there is a 1/10 chance the public message database will be cleaned
if (Date.now()%10){
  db.database().ref("messages").remove()
}

// Also, the database is cleaned every time the servers runs for an consecutive half-hour
setTimeout(function(){clean_periodic()}, 18000000)
function clean_periodic(){
  invitations = []
  conformations = []
  db.database().ref("messages").remove()
  setTimeout(function(){clean_periodic()}, 18000000)
}
