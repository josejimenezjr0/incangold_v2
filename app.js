require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')
const app = express()
const server = require('http').createServer(app)
const socketServer = require('./socketServer')
const router = require('./routes/router')

let games = []

const setGames = gamesArray => games = gamesArray

app.use(bodyParser.json())
app.use(cors())
app.use(express.static(path.join(__dirname, '/frontend/build')))
app.use(router)

app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '/frontend/build', 'index.html')))


socketServer(server, games, setGames, app)

const port = process.env.PORT
server.listen(port, () => console.log(`Listening on port ${port}`))