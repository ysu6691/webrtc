import io from 'socket.io-client'
import { useState, useEffect, useRef } from 'react'

import Chat from './components/Chat'

const socket = io(
  '/webRTCPeers',
  {
    path: '/webrtc'
  }
)

function App() {

  const [chatList, setChatList] = useState<string[]>([])
  const roomNameInputRef = useRef<HTMLInputElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const chatUlRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    socket.on('connection-success', success => {
      console.log(success)
    })
  })

  let myPeerConnection: RTCPeerConnection
  let roomName: string
  let myDataChannel: RTCDataChannel

  const handleIce = function (data: any) {
    socket.emit("ice", data.candidate, roomName)
  }
  
  // const handleAddStream = function (data) {
  //   peerFace.srcObject = data.stream
  // }

  const makeConnection = async function () {
    myPeerConnection = new RTCPeerConnection()
    myPeerConnection.addEventListener("icecandidate", handleIce)
    // myPeerConnection.addEventListener("addstream", handleAddStream)
  }

  const handleWelcomeSubmit = async function (event: React.FormEvent) {
    event.preventDefault()
    await makeConnection()
    socket.emit("join_room", roomNameInputRef.current!.value)
    roomName = roomNameInputRef.current!.value
    roomNameInputRef.current!.value = ''
  }

  const receiveChat = function (event: MessageEvent) {
    const newChatList = [...chatList]
    newChatList.push(event.data)
    setChatList(newChatList)
  }

  socket.on("welcome", async () => {
    myDataChannel = myPeerConnection?.createDataChannel("chat")
    // myDataChannel?.addEventListener("message", event => console.log(event.data))
    myDataChannel.onmessage = receiveChat
    const offer = await myPeerConnection?.createOffer()
    myPeerConnection?.setLocalDescription(offer)
    socket.emit("offer", offer, roomName)
  })

  socket.on("offer", async (offer) => {
    myPeerConnection?.addEventListener("datachannel", event => {
      myDataChannel = event.channel
      // myDataChannel.addEventListener("message", receiveChat)
      myDataChannel.onmessage = (event) => {
        console.log(event)
      }
    })
    myPeerConnection?.setRemoteDescription(offer)
    const answer = await myPeerConnection?.createAnswer()
    myPeerConnection?.setLocalDescription(answer)
    socket.emit("answer", answer, roomName)
  })

  socket.on("answer", answer => {
    myPeerConnection?.setRemoteDescription(answer)
  })
  
  socket.on("ice", ice => {
    myPeerConnection?.addIceCandidate(ice)
  })

  const handleChatSubmit = function (event: React.FormEvent) {
    event.preventDefault()
    myDataChannel.send(chatInputRef.current!.value)
  }

  const chatComponent = chatList.map((chat) => {
    return (
      <Chat 
        key={chat}
        chat={chat}/>
    )
  })

  return (
    <div>
      <form onSubmit={handleWelcomeSubmit}>
        <input type="text" ref={roomNameInputRef} placeholder="방 번호를 입력해주세요"/>
      </form>
      <form onSubmit={handleChatSubmit}>
        <input type="text" ref={chatInputRef} placeholder="채팅을 입력해주세요"/>
      </form>
      <ul ref={chatUlRef}>
        {chatComponent}
      </ul>
    </div>
  );
}

export default App;
