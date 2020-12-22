const express = require('express')
const router = new express.Router()
const db = require('../pg/db')
const makeJoin = require('../controllers/makeJoin')

router.post('/makejoin', async (req, res) => {
  try {
    const result = await makeJoin(req.body.makeJoinInfo)
    return res.status(200).send(result)
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).send(error)
    
  }
    
    // socket.join(room)
    // io.to(room).emit("update", hideInfo(gameUpdate))
    // socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))
    ///////////
    //Need to send uuid
    ///////////

    // updateGames(gameUpdate, room)
    // console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green  created and game room: }{bgGreen.black.bold  ${room} } was created`)
  
  // else {
  //   const room = startInfo.code.toUpperCase()
  //   const [currentGame] = games.filter(game => game.room === room)

  //   const gameUpdate = makePlayer_Game(startInfo, uuid, room, socket.id, currentGame)
  //   console.log('gameUpdate.room: ', gameUpdate.room);

  //   socket.join(room)
  //   io.to(room).emit("update", hideInfo(gameUpdate))
  //   socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))

  //   updateGames(gameUpdate, room)
  //   console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green  created and joined room: }{bgGreen.black.bold  ${room} }`)
  // }
})

router.get('/games', (req, res) => {
  // res.send(games)
})

router.post('/checkjoin', (req, res) => {
  console.log('req.body.room.toUpperCase(): ', req.body.room.toUpperCase());
  const found = games.filter(game => game.room === req.body.room.toUpperCase())
  res.status(200).send(!(games.length === 0 || found.length === 0))
})

module.exports = router