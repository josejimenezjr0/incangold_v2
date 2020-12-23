const { makeGame, makePlayer } = require('../lib/gameAssets')
const { insertGame, insertPlayer } = require('../pg/queries')

const makeJoin = async makeJoinInfo => {
  const { name, code, size, init, join } = makeJoinInfo

  if(!join) {
    try {
      const storedGame = await insertGame(makeGame(size))
      const { game_uuid, player_order, room } = storedGame

      const storedPlayer = await insertPlayer(makePlayer(game_uuid, name, player_order, !join))
      const { player_uuid } = storedPlayer
      
      return { room, playerUuid: player_uuid }
    } catch (error) {
      console.log('error: ', error);
      return error
    }
    
    // socket.join(room)
    // io.to(room).emit("update", hideInfo(gameUpdate))
    // socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))
    ///////////
    //Need to send uuid
    ///////////

    // updateGames(gameUpdate, room)
    // console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green  created and game room: }{bgGreen.black.bold  ${room} } was created`)
  } 
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


}

module.exports = makeJoin