var me = new Peer({
    host: '/',
    path: '/peerjs/broker',  // Yes, I am paying for the Twilio STUN servers...
    config:{ 'iceServers': "SECRET :/",
         'sdpSemantics': 'unified-plan' }
    });

me.on('open', function(id) {
    console.log('My peer ID is: ' + id);
    myid.innerHTML = id
});
    

var conn;
var connected = false;

connect.onclick = function(){
    conn = me.connect(target_id.value);
    connect_msg.innerHTML = "Connection Initiated"
    connected = true;
}

send.onclick = function(){
    if (!connected){
        if (target_id.value){
            conn = me.connect(target_id.value);
        }
    }
    conn.send(message.value)
    message.value = ""
}

me.on('connection', (conn) => {
    conn.on('data', (data) => {
        received.innerHTML += data+ "<br>";
    })})