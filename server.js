const express = require("express");
const { ExpressPeerServer } = require("peer");
const app = express();
app.use(express.static("public"));

// Serve the index page
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// Handle requests (no editing outside this section)/////////////////////////////////////////////////////

// Public Messaging 
var public_posts = ["test 1","test 2"] //Temporary storage for public posts
app.post("/public_post", (request, response) => {
  console.log(request)
  public_posts.push(request.body)
  response.sendStatus(200);
});

app.get("/public_getPost", (request, response) => {
  response.send(public_posts)
});

// Listen////////////////////////////////////////////////////////////////////////////////////////////////
const listener = app.listen(process.env.PORT, () => {
  console.log("Server listening on port " + listener.address().port);
});

// Peer server: /peerjs/broker
const peerServer = ExpressPeerServer(listener, {
  debug: true,
  path: '/broker'
});

app.use('/peerjs', peerServer);
