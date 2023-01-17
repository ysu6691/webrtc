// npm i -g localtunnel
// npm run dev
// lt --port 3000


const socket = io()

const myFace = document.getElementById("myFace")

const call = document.getElementById("call")

const chatForm = document.getElementById("chatForm")
const chatInput = document.getElementById("chatInput")
const chatList = document.getElementById("chatList")
chatList.style.position = 'absolute'
chatList.style.top = '700px'

call.hidden = true

let myStream
let roomName
let myPeerConnection
let myDataChannel

async function getMedia(deviceId) {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: true,
  })
    myFace.srcObject = myStream
  } catch (e) {
    console.log(e)
  }
}

// welcome
const welcome = document.getElementById("welcome")
const welcomeForm = welcome.querySelector("form")

async function initCall() {
  welcome.hidden = true
  call.hidden = false
  await getMedia()
  makeConnection()
}

async function handleWelcomeSubmit(event) {
  event.preventDefault()
  const input = welcomeForm.querySelector("input")
  await initCall()
  socket.emit("join_room", input.value)
  roomName = input.value
  input.value = ''
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit)

// Socket Code
function sendNewChat(event, myDataChannel) {
  event.preventDefault()
  const li = document.createElement("li")
  li.innerText = chatInput.value
  chatList.appendChild(li)
  myDataChannel.send(chatInput.value)
  chatInput.value = ''
}

function receiveNewChat(event) {
  const li = document.createElement("li")
  li.innerText = event.data
  chatList.appendChild(li)
}

// peer A에서 실행
socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("chat")
  chatForm.addEventListener("submit", (event) => sendNewChat(event, myDataChannel))
  myDataChannel.addEventListener("message", receiveNewChat)
  const offer = await myPeerConnection.createOffer()
  myPeerConnection.setLocalDescription(offer)
  socket.emit("offer", offer, roomName)
})
// peer B에서 실행
socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", event => {
    myDataChannel = event.channel
    chatForm.addEventListener("submit", (event) => sendNewChat(event, myDataChannel))
    myDataChannel.addEventListener("message", receiveNewChat)
  })
  myPeerConnection.setRemoteDescription(offer)
  const answer = await myPeerConnection.createAnswer()
  myPeerConnection.setLocalDescription(answer)
  socket.emit("answer", answer, roomName)
})
// peer A에서 실행
socket.on("answer", answer => {
  myPeerConnection.setRemoteDescription(answer)
})

socket.on("ice", ice => {
  myPeerConnection.addIceCandidate(ice)
})

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection()
  myPeerConnection.addEventListener("icecandidate", handleIce)
  myPeerConnection.addEventListener("addstream", handleAddStream)
  if (myStream?.getTracks() !== undefined) {
    myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream))
  }
}

function handleIce(data) {
  socket.emit("ice", data.candidate, roomName)
}

function handleAddStream(data) {
  peerFace.srcObject = data.stream
}