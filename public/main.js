// Peer things //////////////////////////////////////////////////////////////////////
var me = new Peer({
    host: '/',
    path: '/peerjs/broker',  // Yes, I am paying for the Twilio STUN servers...
    // REMEMBER TO ERASE THIS BEFORE POSTING ON GITHUB
    config:{ 'iceServers': [{'url': 'stun:global.stun.twilio.com:3478?transport=udp', 'urls': 'stun:global.stun.twilio.com:3478?transport=udp'}, {'url': 'turn:global.turn.twilio.com:3478?transport=udp', 'username': 'aead563a3f21314845e336c9a9301dd4576d48956c075cdf09f723679001e464', 'urls': 'turn:global.turn.twilio.com:3478?transport=udp', 'credential': 'Aif90NIKOSofnkKChbTGFDv5/o+CwoUsphz4y2+MHXw='}, {'url': 'turn:global.turn.twilio.com:3478?transport=tcp', 'username': 'aead563a3f21314845e336c9a9301dd4576d48956c075cdf09f723679001e464', 'urls': 'turn:global.turn.twilio.com:3478?transport=tcp', 'credential': 'Aif90NIKOSofnkKChbTGFDv5/o+CwoUsphz4y2+MHXw='}, {'url': 'turn:global.turn.twilio.com:443?transport=tcp', 'username': 'aead563a3f21314845e336c9a9301dd4576d48956c075cdf09f723679001e464', 'urls': 'turn:global.turn.twilio.com:443?transport=tcp', 'credential': 'Aif90NIKOSofnkKChbTGFDv5/o+CwoUsphz4y2+MHXw='}],
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

// Public Messaging /////////////////////////////////////////////////////////////////////
let d = new Date
var public_getMessage_lastDate = d.getTime()
function public_getMessage(){
    axios.get('/public_getPost')
    .then(function (response) {
      let new_messages = response.data
      for (let i=0; i<new_messages.length; i++){
          public_received.innerHTML += new_messages[i]+ "<br>";
      }
    })
}

function public_postMessage(){
    axios.post('/public_post', {
        'name': 'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFUCKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK',
        'message': public_post.value
      })
    public_post.value = ""
}

public_receive_go.onclick = public_getMessage
public_post_go.onclick = public_postMessage