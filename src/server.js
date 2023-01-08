import http from 'http'
import SocketIO from 'socket.io'
import express from 'express'

const app = express();

app.set("view engine", "pug")
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req, res) => res.render("home"))
app.get("/*", (req, res) => res.redirect("/"))

const handleListen = () => console.log(`Listening on http://localhost:3000`)

const httpServer = http.createServer(app)
const wsServer = SocketIO(httpServer)

wsServer.on("connection", socket => {
  socket.on("join_room", (roomName) => {
    socket.join(roomName)
    socket.to(roomName).emit("welcome")
    console.log(wsServer.sockets.adapter.rooms.get(roomName)?.size)
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
})


httpServer.listen(3000, handleListen)