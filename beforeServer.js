// 일부 수정 필요
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

const sockets = []
wss.on("connection", (socket) => {
  sockets.push(socket)
  socket["nickname"] = "Anon"
  console.log("Connected to Browser")
  socket.on("close", () => console.log("Disconnected from Browser"))
  socket.on("message", msg => {
    const message = JSON.parse(msg)
    switch (message.type) {
      case "new_message":
        sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload.toString('utf-8')}`))
      case "nickname":
        socket["nickname"] = message.payload
    }
  })
})

httpServer.listen(3000, handleListen)
