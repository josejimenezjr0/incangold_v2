const socketio = require('socket.io')
const { v4: uuidv4 } = require('uuid')
const chalk = require('chalk')
const { makePlayer_Game, hideInfo, playerInfo, startTurn, startRound, revealChoices, playerToRoom } = require('./lib/gameAssets')
const { selectPlayer, selectGameWithPlayer, updatePlayer } = require('./pg/queries')
const ZERO = 'zero'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'

module.exports = (io) => {

  /**
   * Socket middleware - Check for reconnect flag and if the server has been restarted (players empty or no client uuid)
   * sets reset flag otherwise checks if client is returning and attaches uuid.
   */
  const checkServerClient = () => {
    return async (socket, next) => {
      console.log('middleware socket.id: ', socket.id);
      const playerUuid = socket.handshake.query.reconnect
      if(playerUuid) {
        console.log('playerUuid: ', playerUuid);
        // if(clientCheck('uuid', uuid)) {
        // const dbCheck = await clientCheck('playerUuid', uuid)
        const dbCheck = await selectGameWithPlayer('playerUuid', playerUuid)
        const { room } = dbCheck
        playerToRoom(playerUuid, room, socket, io)
        // if(dbCheck.playerUuid !== uuid) {
        if(!dbCheck) {
          console.log('no results on dbCheck');
          socket.reset = true
          return next()
        }
        console.log(chalk.yellow(`${ chalk.bgYellow.black.bold(` ${ playerUuid.substring(0, 4) } `) } reconnected`))
        socket.uuid = playerUuid
        return next()
      } else return next();
    }
  }

  io.use(checkServerClient())

  io.on("connect", socket => {
    console.log('socket: ', socket.id);
    const { uuid, id, reset } = socket

    // If client needs to be reset emits a force reset command to client socket and stops
    if(reset) {
      console.log('forceReset');
      socket.emit('forceReset')
      return
    }

    socket.on("init", ({ playerUuid, room }) => {
      playerToRoom(playerUuid, room, socket, io)
    })

    socket.on("revealChoices", room => {
      const [currentGame] = games.filter(game => game.room == room)
      if(currentGame.endCamp || currentGame.endHazard) {
        console.log('endHazard: ', currentGame.endHazard);
        console.log('endCamp: ', currentGame.endCamp);
        console.log(`revealChoices shouldn't run`);
        return
      }

      const gameUpdate = revealChoices(currentGame)

      io.to(room).emit("update", hideInfo(gameUpdate))
      gameUpdate.players.map(player => {
        io.to(player.socketID).emit("playerUpdate", playerInfo(gameUpdate, player.uuid))
      })

      updateGames(gameUpdate, room)
      console.log(chalk`{bgGreen.black.bold  ${room} }{green revealed choices}`)
    })

    socket.on("startRound", room => {
      const [currentGame] = games.filter(game => game.room === room)

      const roundUpdate = startRound(currentGame)
      const gameUpdate = startTurn(roundUpdate)
      console.log('Round gameUpdate: ', gameUpdate);

      io.to(room).emit("update", hideInfo(gameUpdate))
      gameUpdate.players.map(player => {
        io.to(player.socketID).emit("playerUpdate", playerInfo(gameUpdate, player.uuid))
      })

      updateGames(gameUpdate, room)
      console.log(chalk`{bgGreen.black.bold  ${room} }{green started round}`)
    })

    socket.on("startTurn", ({ room }) => {
      console.log('startTurn')
      const [currentGame] = games.filter(game => game.room === room)
      console.log('currentGame: ', currentGame);
      if(currentGame.endCamp || currentGame.endHazard) {
        console.log('endHazard: ', currentGame.endHazard);
        console.log('endCamp: ', currentGame.endCamp);
        console.log(`startRound shouldn't run`);
        return
      }
      console.log('before startTurn currentGame: ', currentGame);

      const gameUpdate = startTurn(currentGame)
      console.log('after start turn gameUpdate: ', gameUpdate);

      io.to(room).emit("update", hideInfo(gameUpdate))
      gameUpdate.players.map(player => {
        io.to(player.socketID).emit("playerUpdate", playerInfo(gameUpdate, player.uuid))
      })

      updateGames(gameUpdate, room)
      console.log(chalk`{bgGreen.black.bold  ${room} }{green started turn}`)
    })

    //Sets disconnected player to offline status and sends status to remaining players in game
    socket.on("disconnect", async () => {
      console.log('disconnect');
      // if(clientCheck('socketID', socket.id)) return
      const { playerUuid } = await selectPlayer('socket_id', socket.id)
      if(playerUuid) {
        await updatePlayer(playerUuid, { online: false })
      }
      
      // const [currentGame] = games.filter(game => game.players.some(player => player.socketID == socket.id))
      // const [currentPlayer] = currentGame.players.filter(player => player.socketID == socket.id)
      // const { room } = currentGame
      // const { uuid } = currentPlayer

      // const playerUpdate = { ...currentPlayer, online: false }
      // const keepPlayers = currentGame.players.filter(player => player.uuid !== uuid)
      // const gameUpdate = { ...currentGame, players: [...keepPlayers, playerUpdate] }

      // io.to(room).emit("update", hideInfo(gameUpdate))

      // updateGames(gameUpdate, room)




      // console.log(chalk.red.bold(`${chalk.bgRed.black.bold(` ${uuid.substring(0, 4)} `)} disconnected from room: ${chalk.bgRed.black.bold(` ${room} `)}`))
      
      
      
      
      
      ///TODO
      // players[uuid].timer = setTimeout(() => {
      //   games[room].players[uuid].online = false
      //   io.to(room).emit("update", { ...games[room], deck: null } )
      // }, 10000)
    })
  })
}