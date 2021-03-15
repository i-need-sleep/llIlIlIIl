const express = require("express");
const { ExpressPeerServer } = require("peer");
const app = express();
app.use(express.static("public"));

// Serve the index page
app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/index.html");
});

// Handle requests (no editing outside this section)/////////////////////////////////////////////////////

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
