<template>
  <div class='view peercomp'>
    <header>
      <h1>Your Peer Service, {{state.username}}.  <br>
          <span v-if="peerState.id">Your peerID: {{ peerState.id }}</span>
          <span v-else>Connect to enable Peer Service.</span>
          <button @click="peerMenu_exit" id=back>Hide Peer Service</button>
      </h1>
    </header>

	<section class="chat-box">
		<div class=message>
        <div class="message-inner">
          <div class="username"> Active users: </div>
          <div class="content userlist">
            <span v-for="username in state.userlist" :key="username" @click="peerConn_clickUser(username.username)">{{ username.username }}<br></span>
          </div>
		</div>
        </div>
      <div 
        v-for="message in messages" 
        :key="message.key" 
        :class="(message.username == state.username ? 'message current-user' : 'message')">
        <div class="message-inner">
          <div class="username">{{ message.username }}</div>
          <div class="content" @click="peerConn_confirmInvite(message)">{{ message.content }}</div>
        </div>
      </div>
      <div 
        v-for="message in confMessages" 
        :key="message.key" 
        :class="(message.username == state.username ? 'message current-user' : 'message')">
        <div class="message-inner">
          <div class="username">{{ message.username }}</div>
          <div class="content confContent" @click="peerConn_start(message.confirm_id, message.username)">{{ message.content }}</div>
        </div>
		</div>
		<div 
        v-for="message in confMessages_group" 
        :key="message.key" 
        :class="(message.username == state.username ? 'message current-user' : 'message')">
        <div class="message-inner">
          <div class="username">{{ message.username }}</div>
          <div class="content confContent" @click="peerConn_start_group(message.confirm_id, message.username, message.sender_name)">{{ message.content }}</div>
        </div>
      </div>
    </section>

    <footer>
        <button v-if="!peerState.id" @click="peerConn_init" id=ready>Connect to Peer Service</button>
        <button v-else @click="peerConn_disconnect" id=disconnect>Disconnect from the Peer Service</button>
        <form v-if="peerState.id" @submit.prevent="peerConn_invite">
            <input 
            type="text" 
            v-model="inputInvitation" 
            placeholder="Enter a username to send an invitation..." />
			<select id="group_select">
					<option :value="active_peer.group_n" v-for="active_peer in active_peers" :key="active_peer">{{active_peer.names.join(',')}}</option>
			</select>
            <input 
            type="submit" 
            value="Send" />
        </form>
    </footer>
  </div>
</template>

<script>
import Peer from 'peerjs';
const axios = require('axios').default;
export default {
  name: 'peercomp',
  props: {
    state: {}
  },
  methods: {
    peerConn_init(){
        this.peerState.me = new Peer({
        host: 'the0thing.herokuapp.com',
        path: '/peerjs/broker',
        port: 80,  // Yes, I am paying for the Twilio STUN servers...
        // REMEMBER TO ERASE THIS BEFORE POSTING ON GITHUB
        config:{ 'iceServers': [{'url': 'stun:global.stun.twilio.com:3478?transport=udp', 'urls': 'stun:global.stun.twilio.com:3478?transport=udp'}, {'url': 'turn:global.turn.twilio.com:3478?transport=udp', 'username': 'aead563a3f21314845e336c9a9301dd4576d48956c075cdf09f723679001e464', 'urls': 'turn:global.turn.twilio.com:3478?transport=udp', 'credential': 'Aif90NIKOSofnkKChbTGFDv5/o+CwoUsphz4y2+MHXw='}, {'url': 'turn:global.turn.twilio.com:3478?transport=tcp', 'username': 'aead563a3f21314845e336c9a9301dd4576d48956c075cdf09f723679001e464', 'urls': 'turn:global.turn.twilio.com:3478?transport=tcp', 'credential': 'Aif90NIKOSofnkKChbTGFDv5/o+CwoUsphz4y2+MHXw='}, {'url': 'turn:global.turn.twilio.com:443?transport=tcp', 'username': 'aead563a3f21314845e336c9a9301dd4576d48956c075cdf09f723679001e464', 'urls': 'turn:global.turn.twilio.com:443?transport=tcp', 'credential': 'Aif90NIKOSofnkKChbTGFDv5/o+CwoUsphz4y2+MHXw='}],
            'sdpSemantics': 'unified-plan' }
        })
        let peerState = this.peerState
        this.peerState.me.on('open', function(id) {
            peerState.id = id
        })
		this.peerConn_checkInvite()
		this.peerConn_checkConfInvite()
    },
    peerMenu_exit(){
        this.$emit('peerMenu_exit')
    },
    peerConn_disconnect(){
        this.peerState.id = ''
        this.peerState.me = ''
    },
    peerConn_invite(){
		if (this.inputInvitation == ''){return}
		else if (document.getElementById('group_select').value == 0){
			let invitation = {
			target_name: this.inputInvitation,
			self_name: [this.state.username],
			self_id: this.peerState.id
			}
        this.inputInvitation = ''
		axios.post(this.PEERHOST+'/invite', invitation)
		}
		else{
			let self_group = []
			for (let i=0; i<this.active_peers.length; i++){
				if (document.getElementById('group_select').value == this.active_peers[i].group_n){
					self_group = this.active_peers[i].names
					if (this.active_peers[i].names.includes(this.inputInvitation)){
						return
					}
				}
			}
			self_group.push(this.state.username)
			
			this.$root.$refs[self_group[0]].inputMessage = "I have invited " + this.inputInvitation + " to join our chat."
			this.$root.$refs[self_group[0]].SendMessage()

			let invitation = {
			target_name: this.inputInvitation,
			self_name: self_group,
			self_id: this.peerState.id
			}
			this.inputInvitation = ''
			axios.post(this.PEERHOST+'/invite', invitation)
		}
    },
	peerConn_checkInvite(){
		let messages = this.messages
		let state = this.state
		axios.post(this.PEERHOST+'/checkInvite', {self_name: this.state.username})
		.then(function (response) {
			let res_data = response.data
			for (let i=0; i<res_data.length; i++){
				let newMessage = true
				for (let j=0; j<messages.length; j++){
					if (res_data[i].self_name.join(", ") == messages[j].username){
						newMessage = false
					}
				}
				if (newMessage && res_data[i].self_name != state.username){
					messages.push({
						username: res_data[i].self_name.join(", "),
						sender_name:res_data[i].self_name,
						sender_id: res_data[i].self_id,
						content: res_data[i].self_name + " has sent you an invitation. Click to initiate a private connection."
					})
				}
			}
		})
		setTimeout(this.peerConn_checkInvite, 5000)
	},
	peerConn_confirmInvite(message){
		let conformation = {
			sender_id: message.sender_id,
			sender_name: message.sender_name,
			confirm_id: this.peerState.id,
			confirm_name: this.state.username
		}
		axios.post(this.PEERHOST+'/confirmInvite', conformation)
		this.peerConn_start(message.sender_id, message.username)
    },
	peerConn_checkConfInvite(){
		let confMessages = this.confMessages
		let confMessages_group = this.confMessages_group
		let state = this.state
		axios.post(this.PEERHOST+'/checkConfInvite', {self_name: this.state.username})
		.then(function (response) {
			let res_data = response.data
			for (let i=0; i<res_data.length; i++){
				let newMessage = true
				for (let j=0; j<confMessages.length; j++){
					if (res_data[i].confirm_name == confMessages[j].username){
						newMessage = false
					}
				}
				for (let j=0; j<confMessages_group.length; j++){
					if (res_data[i].confirm_name == confMessages_group[j].username){
						newMessage = false
					}
				}
				if (newMessage && res_data[i].confirm_name != state.username){
					if (res_data[i].sender_name.length > 1){
						confMessages_group.push({
						sender_name: res_data[i].sender_name,
						username: res_data[i].confirm_name,
						confirm_id: res_data[i].confirm_id,
						content: res_data[i].confirm_name+" has accepted your invitation. Click to admit "+res_data[i].confirm_name+" into the chat."
					})}
					else{
						confMessages.push({
						username: res_data[i].confirm_name,
						confirm_id: res_data[i].confirm_id,
						content: res_data[i].confirm_name + " has accepted your invitation. Click to enter a private connection."
					})
					}
				}
			}
		})
		setTimeout(this.peerConn_checkConfInvite, 5000)
	},
	peerConn_start(id, name){
		console.log(id)
		let me = this.peerState.me
		this.peerMenu_exit()
		this.active_peers.push({names: [name], group_n: this.active_peers[this.active_peers.length-1].group_n+1})
		this.$emit('peerMenu_startConn', {id: id, name: name, me: me, active: true})
	},
	peerConn_start_group(id, name, sender_name){
		let me = this.peerState.me
		this.peerMenu_exit()
		this.$emit('peerMenu_startConn_group', {id: id, name: name, me: me, active: true, sender_name: sender_name})
	},
	peerConn_clickUser(name){
		if (name == this.state.username){
			return
		}
		if (! this.peerState.id){
		this.peerConn_init()
		}
		this.inputInvitation = name
	}
  },
  data () {
    return {
      PEERHOST: 'http://the0thing.herokuapp.com:80', // the0thing.herokuapp.com:80 http://localhost:8888
      peerState: {
        id: '',
        me: ''
      },
      inputInvitation: '',
      messages: [],
      confMessages: [],
      confMessages_group: [],
      active_peers: [{group_n: 0, names: ['New Conversation']}]
    }
  }
}
</script>

<style lang="scss" scoped>
* {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}
.view {
	display: flex;
	justify-content: center;
	min-height: 100vh;
	background-color: #283747;
	
	&.peercomp {
		flex-direction: column;
		.chat-box {
			background-color: #f3f3f3;
			box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
			flex: 1 1 100%;
			padding: 30px;
			.message {
				display: flex;
				margin-bottom: 15px;
				user-select: none;
				-moz-user-select: none;
				-khtml-user-select: none;
				-webkit-user-select: none;
				-o-user-select: none;
				
				.message-inner {
					.username {
						color: #888;
						font-size: 16px;
						margin-bottom: 5px;
						padding-left: 15px;
						padding-right: 15px;
					}
					.content {
						display: inline-block;
						padding: 10px 20px;
						background-color: #33475c;
						border-radius: 999px;
						color: #f3f3f3;
						font-size: 18px;
						line-height: 1.2em;
						text-align: left;
						&.confContent {
							background-color: #00967d;
						}
						&.userlist {
							background-color: #283747;
							border-radius: 25px;
						}
					}
				}
				&.current-user {
					margin-top: 30px;
					justify-content: flex-end;
					text-align: right;
					.message-inner {
						max-width: 75%;
						.content {
							color: #f3f3f3;
							font-weight: 600;
							background-color: #de354c;
						}
					}
				}
			}
		}
		header {
			position: sticky;
			top: 0px;
			display: block;
			width: 100%;
			padding: 50px 30px 10px;
			background-color: #283747;
            #back:hover {
					background-color: #ff2f4b;
				}
			#back {
				position: absolute;
				top: 25px;
				right: 15px;
				appearance: none;
				border: none;
				padding: 35px 32px;
				text-align: center;
				text-decoration: none;
				background-color: #de354c;
				color: #FFF;
				font-size: 18px;
				margin-bottom: 10px;
				text-align: right;
				border-radius: 8px;
			}
			h1 {
				color: #FFF;
			}
		}
		footer {
			position: sticky;
			bottom: 0px;
			background-color: #283747;
			padding: 30px;
			box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
            button:hover {
					background-color: #ff2f4b;
				}
            button {
                position: absolute;
				top: 10px;
				appearance: none;
				border: none;
				padding: 10px 15px;
				text-align: center;
				text-decoration: none;
				background-color: #de354c;
				color: #FFF;
				font-size: 18px;
				margin-bottom: 10px;
				text-align: right;
				border-radius: 8px;
            }
            #ready {
				left: 15px;
			}
            #disconnect {
                top: 30px;
				border-radius: 8px 0px 0px 8px;
            }
			form {
				display: flex;
				input[type="text"] {
					flex: 1 1 100%;
					appearance: none;
					border: none;
					outline: none;
					background: none;
					display: block;
					width: 100%;
					padding-left: 340px;
					border-radius: 8px 0px 0px 8px;
					
					color: #333;
					font-size: 18px;
					box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
					background-color: #F3F3F3;
					transition: 0.4s;
					&::placeholder {
						color: #888;
						transition: 0.4s;
					}
				}
				input[type="submit"]:hover{
                    background-color: #ff2f4b;
                }
				input[type="submit"] {
					appearance: none;
					border: none;
					outline: none;
					background: none;
					display: block;
					padding: 10px 15px;
					border-radius: 0px 8px 8px 0px;
					background-color: #de354c;
					color: #f3f3f3;
					font-size: 18px;
					font-weight: 700;
				}
			}
		}
	}
}
</style>