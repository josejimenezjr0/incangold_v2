require('dotenv').config()
const socketio = require('socket.io')
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const app = express()
const server = require('http').createServer(app)
const router = require('./routes/router')

app.use(bodyParser.json())
app.use(cors())
app.use(express.static(path.join(__dirname, '/frontend/build')))
app.use(router)

app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '/frontend/build', 'index.html')))

const port = process.env.PORT
server.listen(port, () => console.log(`Listening on port ${port}`))

const io = socketio(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
})

require('./socketServer')(io)

const socketIoObj = io
module.exports.ioObj = socketIoObj