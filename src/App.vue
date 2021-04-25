<template>
<splitpanes class="default-theme">
 <pane :size="left_size" min-size="0" id="left_pane">
  <div class="peer">
  <peercomp ref="peercomp_child_ref" v-if="!(state.username === '' || state.username === null)" v-show="state.peer_on" :state="state" @peerMenu_exit="peerMenu_exit" @peerMenu_startConn="peerConn_open" @peerMenu_startConn_group="peerConn_open_group"></peercomp>
  </div>
</pane>

<pane :size="mid_size" min-size="0" id="mid_pane">
<splitpanes style="height: 100vh" class="default-theme" horizontal>
  <pane class="peer"
    v-for="active_peer in active_peers"
    :key="active_peer.name" :id="active_peer.name">
    <peerconn :ref="active_peer.name" :id="active_peer.name" v-if="!(state.username === '' || state.username === null)" v-show="active_peer.active" :state="state" :peer_info="active_peer" @peerConn_exit="peerConn_exit" @emit_to_branch="emit_to_branch"
		@peerConn_newMsg="peerConn_newMsg"></peerconn>
  </pane>
</splitpanes>
</pane>

<pane id="right_pane" :size="100-left_size-mid_size" min-size="35">
<div class="right" id=right>
  <div class="view login" v-if="state.username === '' || state.username === null">
    <form class="login-form" @submit.prevent="Login">
      <div class="form-inner">
        <h1>Login to Thething</h1>
        <label for="username">Username</label>
        <input
          type="text"
          v-model="inputUsername"
          placeholder="Please enter your username..." />
        <input
          type="submit"
          value="Login" />
      </div>
    </form>
  </div>

  <div class="view chat" v-else>
    <header>
      <button class="peerMenu_open" v-show="!state.peer_on" @click="peerMenu_open">Peer Menu</button>
      <button class="logout" @click="Logout">Logout</button>
      <h1>Welcome to the lobby, {{ state.username }}.</h1>
    </header>

    <section class="chat-box">
      <div
        v-for="message in state.messages"
        :key="message.key"
        :class="(message.username == state.username ? 'message current-user' : 'message')">
        <div class="message-inner">
          <div class="username">{{ message.username }}</div>
          <div class="content">{{ message.content }}</div>
        </div>
      </div>
    </section>

    <footer>
      <form @submit.prevent="SendMessage">
        <input
          type="text"
          v-model="inputMessage"
          placeholder="Write a message..." />
        <input
          type="submit"
          value="Send" />
      </form>
    </footer>
  </div>
</div>
</pane>
</splitpanes>
  <div 
    v-for="active_peer in active_peers_group"
    :key="active_peer.name" :id="active_peer.name">
    <peerconnSec ref="sec" :id="active_peer.name" v-if="!(state.username === '' || state.username === null)" v-show="active_peer.active" :state="state" :peer_info="active_peer" @peerConn_exit="peerConn_exit" @emit_to_group="emit_to_group"
		@peerConn_newMsg="peerConn_newMsg"></peerconnSec>
  </div>
</template>

<script>
import { reactive, onMounted, ref } from 'vue';
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'

import db from './db';
import peercomp from './peer.vue'
import peerconn from './peerConn.vue'
import peerconnSec from './peerConnSecondary.vue'


export default {
  components: {
    peercomp,
	peerconn,
	peerconnSec,
	Splitpanes,
	Pane
  },
  methods: {
	Logout() {
		const messagesRef = db.database().ref("messages");
		const ulRef = db.database().ref("userlist");
		var onChildrenAdded = messagesRef.orderByChild("username").equalTo(this.state.username)
		.on("child_added", function(snapshot) {messagesRef.child(snapshot.key).remove();});
		// remove msg from this user when logout
		ulRef.orderByChild("username").equalTo(this.state.username)
		.once("child_added", function(snapshot) {ulRef.child(snapshot.key).remove();});
		messagesRef.orderByChild("username").equalTo(this.state.username)
		.off("child_added", onChildrenAdded);
		this.state.username = "";
		this.peerMenu_exit()
		for (let i=0; i<this.active_peers.length; i++){
			this.peerConn_exit(this.active_peers[i].name)
		}
    },
    peerMenu_open() {
        this.state.peer_on = true
		this.left_size = 50
    },
	peerMenu_exit() {
		if (this.state.peer_on){
		this.state.peer_on = false
		this.left_size = 0
		if (this.mid_size>0){
			this.mid_size = 65
		}
		}
	},
	peerConn_open(data) {
		this.left_size = 0
		this.mid_size = 65
		for (let i=0; i<this.active_peers.length; i++){
			if (this.active_peers[i].name == data.name){
				this.active_peers[i].active = true
				return
			}
		}
		this.active_peers.push(data)
	},
	peerConn_open_group(data) {
		this.active_peers_group.push(data)
	},
	peerConn_exit(name){
		let ctr = 0
		for (let i=0; i<this.active_peers.length; i++){
			if (this.active_peers[i].name == name){
				this.active_peers[i].active = false
			}
			if (this.active_peers[i].active){
				ctr ++
			}
		}
		if (ctr==0){
			this.mid_size = 0
		}
		let peercomp_child = this.$refs.peercomp_child_ref
		for (let i=0; i<peercomp_child.active_peers.length; i++){
			if (peercomp_child.active_peers[i].names.join(', ') == name){
				// peercomp_child.active_peers.pop(i)
			}
		}
	},
	peerConn_newMsg(info){
		if (info.len>9){
		setTimeout(function () {document.getElementById(info.name).scroll(0, document.getElementById(info.name).scrollHeight);}, 10);
		}
	},
	emit_to_group(data){
		let message = data[1]
		let dest = data[0].sender_name[0]
		console.log(message)
		console.log(dest)
		this.$refs[dest].conn.send({name: this.state.username+","+message.username,message: message.content})
        this.$refs[dest].messages.push(message)
	},
	emit_to_branch(message){
		console.log(this.$refs['sec'])
		if (this.$refs['sec']){
			console.log(message)
		this.$refs['sec'].conn.send({name: this.state.username+","+message.name,message: message.message})
		}
	}
  },
  data () {
      return {
        active_peers: [],
        active_peers_group: [],
		left_size: 0,
		mid_size: 0
      }
  },
  setup () {
    const inputUsername = ref("");
    const inputMessage = ref("");
    const state = reactive({
      username: "",
      messages: [],
      userlist: []
    });
    const Login = () => {
      if (inputUsername.value != "" || inputUsername.value != null) {
            const ulRef = db.database().ref("userlist");
            ulRef.orderByChild("username").equalTo(inputUsername.value).once("value",snapshot => {
                if (snapshot.exists()){
                    alert("exists!");
                }
                else {
                    state.username = inputUsername.value;
					const un = {
						username: state.username
					}
                    ulRef.push(un)
                    inputUsername.value = "";
                }
            });
        }
    }

    const SendMessage = () => {
      const messagesRef = db.database().ref("messages");
      if (inputMessage.value === "" || inputMessage.value === null) {
        return;
      }
      const message = {
        username: state.username,
        content: inputMessage.value
      }
      messagesRef.push(message);
      inputMessage.value = "";
		setTimeout(function () {document.getElementById('right').scroll(0, document.getElementById('right').scrollHeight);}, 10);
    }
    onMounted(() => {
      const messagesRef = db.database().ref("messages");
	const ulRef = db.database().ref("userlist");
      messagesRef.on('value', snapshot => {
        const data = snapshot.val();
        let messages = [];
		if (!data){
			return
		}
        Object.keys(data).forEach(key => {
          messages.push({
            id: key,
            username: data[key].username,
            content: data[key].content
          });
        });
        state.messages = messages;
		setTimeout(function () {document.getElementById('right').scroll(0, document.getElementById('right').scrollHeight);}, 10);
      });
		ulRef.on('value', snapshot => {
        const data = snapshot.val();
        let userlist = [];
		if (!data){
			return
		}
        Object.keys(data).forEach(key => {
          userlist.push({
            username: data[key].username,
          });
        });
		state.userlist = userlist;
		});
    });
    return {
      inputUsername,
      Login,
      state,
      inputMessage,
      SendMessage
    }
  }
}
</script>

<style lang="scss">
* {
	font-family: Avenir, Helvetica, Arial, sans-serif;
	-webkit-font-smoothing: antialiased;
	-moz-osx-font-smoothing: grayscale;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}
.peer{
	height: 100vh;
	overflow-y: scroll;
}

.right{
	height: 100vh;
	overflow-y: scroll;
}

.view {
	display: flex;
	justify-content: center;
	min-height: 100vh;
	background-color: #283747;

	&.login {
		align-items: center;
		.login-form {
			display: block;
			width: 100%;
			padding: 15px;

			.form-inner {
				display: block;
				background-color: #de354c;
				padding: 50px 15px;
				border-radius: 16px;
				box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
				h1 {
					color: #F3F3F3;
					font-size: 28px;
					margin-bottom: 30px;
				}
				label {
					display: block;
					margin-bottom: 5px;
					color: #F3F3F3;
					font-size: 16px;
					transition: 0.4s;
				}
				input[type="text"] {
					appearance: none;
					border: none;
					outline: none;
					background: none;
					display: block;
					width: 100%;
					padding: 10px 15px;
					border-radius: 8px;
					margin-bottom: 15px;

					color: #000;
					font-size: 18px;
					box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
					background-color: #F3F3F3;
					transition: 0.4s;
					&::placeholder {
						color: #888;
						transition: 0.4s;
					}
				}
				input[type="submit"] {
					appearance: none;
					border: none;
					outline: none;
					background: none;
					display: block;
					width: 100%;
					padding: 10px 15px;
					background-color: #f3f3f3;
					border-radius: 8px;
					color: #000;
					font-size: 18px;
					font-weight: 700;
				}
				input[type="submit"]:hover {
					background-color: #b4b4b4;
				}
				&:focus-within {
					label {
						color: #fff;
					}
					input[type="text"] {
						background-color: #FFF;
						box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
						&::placeholder {
							color: #666;
						}
					}
				}
			}
		}
	}
	&.chat {
		flex-direction: column;
		.chat-box {
			background-color: #f3f3f3;
			box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
			flex: 1 1 100%;
			padding: 30px;
			.message {
				display: flex;
				margin-bottom: 15px;

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
						background-color: #283747;
						border-radius: 999px;
						color: #f3f3f3;
						font-size: 18px;
						line-height: 1.2em;
						text-align: left;
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
			.logout {
				position: absolute;
				top: 15px;
				right: 15px;
				appearance: none;
				border: none;
				padding: 15px 32px;
				text-align: center;
				text-decoration: none;
				background-color: #de354c;
				color: #FFF;
				font-size: 18px;
				margin-bottom: 10px;
				text-align: right;
				border-radius: 8px;
			}
			.logout:hover {
				background-color: #ff2f4b;
			}
			.peerMenu_open {
				position: absolute;
				top: 15px;
				right: 160px;
				appearance: none;
				border: none;
				padding: 15px 32px;
				text-align: center;
				text-decoration: none;
				background-color: #de354c;
				color: #FFF;
				font-size: 18px;
				margin-bottom: 10px;
				text-align: right;
				border-radius: 8px;
			}
			.peerMenu_open:hover {
				background-color: #ff2f4b;
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
					padding: 10px 15px;
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
				input[type="submit"]:hover {
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
