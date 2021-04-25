<template>
  <div></div>
</template>

<script>
import { reactive } from 'vue';
export default {
  name: 'peerconn',
  props: {
    state: {},
    peer_info: {}
  },
  methods: {
    SendMessage() {
		if (this.inputMessage == ''){return}
        let message = {name: this.state.username, message: this.inputMessage}
        let conn = this.conn
        let messages = this.messages
        this.inputMessage = ''
		this.$emit('peerConn_newMsg',{name: this.peer_info.name, len: messages.length})
        if (this.unsent()){
            conn = this.peer_info.me.connect(this.peer_info.id)
            messages.push({username: message.name, content: message.message})
            conn.on('open', () => {
                conn.send(message)
            })
        }
        else{
        conn.send(message)
        messages.push({username: message.name, content: message.message}
        )}
        this.conn = conn
    },
    unsent() {
        let messages = this.messages
        let myName = this.state.username
        let ctr = 0
        for (let i=0; i<messages.length; i++){
            if (messages[i].username == myName){
                ctr ++
            }
        }
        if (ctr > 1){
            return false
        }
        return true
    },
    peerConn_exit(){
        this.$emit('peerConn_exit', this.peer_info.name)
    },
	video_call(){
		if (!document.getElementById("video_ele").srcObject){
			navigator.mediaDevices.getUserMedia({video: true, audio: true})
			.then((stream) => {
			let newConn = this.peer_info.me.call(this.peer_info.id, stream)
			this.vidConn.push(newConn)
			newConn.on('stream', this.renderVideo);
			newConn.on('close', function(){document.getElementById("video_ele").srcObject = undefined})
			this.inputMessage = "I have initialised a video call. Allow video input to continue."
			this.SendMessage()
			document.getElementById("disconnect_call").innerHTML = "Terminate Video Call"
        })
		}
		else{
			this.vidConn.pop().close()
			this.inputMessage = "I have ended the video call."
			this.SendMessage()
			document.getElementById("video_ele").srcObject = undefined
			document.getElementById("disconnect_call").innerHTML = "Video Call"
		}
	}
  },
  data () {
    return {
        inputMessage: ''
    }
  },
  setup(props, {emit}) {
    var conn = reactive(props.peer_info.me.connect(props.peer_info.id))
	var vidConn = reactive([])

    const messages = reactive([]);
    var said_hi = false

	const renderVideo = (stream) => {
		document.getElementById('video_ele').srcObject = stream
	}
    
    // Connect to the active peer
    conn.on('open', () => {
        conn.send({name: props.state.username, message: "Hello. We are connected. Chat way."})
    })

	// Handle incoming chat
    props.peer_info.me.on('connection', (conn_in) => {
    conn_in.on('data', (data) => {
		emit('peerConn_newMsg', {name: props.peer_info.name, len: messages.length})
        if (data.name == props.peer_info.name){
            emit('emit_to_group', [props.peer_info,{username: data.name, content: data.message}])
            messages.push({username: data.name, content: data.message})
        }
        if (!said_hi && data.message== "Hello. We are connected. Chat way."){
            said_hi = true
            conn = props.peer_info.me.connect(props.peer_info.id)
            
            conn.on('open', () => {
                conn.send({name: props.state.username, message: "Hi. We are connected. Chat way."})
            })
        }
		if (data.message=="I have ended the video call." && document.getElementById("video_ele").srcObject){
			vidConn.pop().close()
			document.getElementById("video_ele").srcObject = undefined
			document.getElementById("disconnect_call").innerHTML = "Video Call"
		}
    })})

	// Handle incoming video
	props.peer_info.me.on('call', (call) => {
		navigator.mediaDevices.getUserMedia({video: true, audio: true})
			.then((stream) => {
			vidConn.push(call)
			call.answer(stream); // Answer the call with an A/V stream.
			call.on('stream', renderVideo);
			document.getElementById("disconnect_call").innerHTML = "Terminate Video Call"
			})})

    return {
        conn,
        messages,
		renderVideo,
		vidConn
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
	
	&.peerconn {
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
						&.confContent {
							background-color: #00967d;
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
            #disconnect_call {
                top: 30px;
				border-radius: 8px 0px 0px 8px;
            }
            p {
                color: white
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
					padding: 10px 150px;
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