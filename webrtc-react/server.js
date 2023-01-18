const express = require('express')

const io = require('socket.io')({
    path: '/webrtc'
})

const app = express()
const port = 8080

app.get('/', (req, res) => res.send('Hello, WebRTC!'))

const server = app.listen(port, () => {
    console.log(`WebRTC App is listening on port ${port}`)
})

io.listen(server)

const webRTCNamespace = io.of('/webRTCPeers')

webRTCNamespace.on('connection', socket => {
    console.log(`socket id: ${socket.id}`)

    socket.emit('connection-success', {
        status: 'connection-success',
        socketId: socket.id,
    })

    socket.on("join_room", (roomName) => {
        socket.join(roomName)
        socket.to(roomName).emit("welcome")
      })

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer)
    })
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer)
    })
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice)
    })

    socket.on('disconnect', () => {
        console.log(`${socket.id} has disconnected`)
    })
})