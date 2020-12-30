const socketio = require('socket.io')
const { v4: uuidv4 } = require('uuid')
const chalk = require('chalk')
const { makePlayer_Game, hideInfo, playerInfo, startTurn, startRound, revealChoices, playerToRoom } = require('./lib/gameAssets')
const { selectPlayer, selectGameWithPlayer, updatePlayer } = require('./pg/queries')
const ZERO = 'zero'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'

module.exports = (server, games, setGames, httpServer) => {

  /**
   * If player empty OR players doesn't have uuid
   */
  // const clientCheck = (filter, value) => {
  //   const found = games.map(game => game.players).flat().filter(player => player[filter] == value)
  //   const result = games.length === 0 || found.length === 0
  //   return result
  // }

  const clientCheck = async (filter, value) => {
    const result = await selectPlayer(filter, value)
    console.log('clientCheck result: ', result);
    return result
  }

  // const gameCheck = (filter, value) => {
  //   const found = games.filter(game => game[filter] == value)
  //   const result = games.length === 0 || found.length === 0
  //   return result
  // }

  // httpServer.post('/checkjoin', (req, res) => {
  //   console.log('req.body.room.toUpperCase(): ', req.body.room.toUpperCase());
  //   res.send(!gameCheck('room', req.body.room.toUpperCase()))
  // })

  const io = socketio(server, {
    // transports: ['websocket'],
    cors: {
      origin: "http://localhost:3001",
      methods: ["GET", "POST"]
  }
  })

  const updateGames = (update, room) => {
    const keepGames = games.filter(game => game.room !== room)
    const gamesUpdate = [...keepGames, update]
    games = gamesUpdate
    setGames([...keepGames, update])
  }

  const deleteGame = (room) => {
    const gamesUpdate = games.filter(game => game.room !== room)
    games = gamesUpdate
    setGames(gamesUpdate)
  }



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

    // Returning player socketID updated. Player rejoins saved game and online status is updated.
    if(uuid) {
      console.log('if on connect uuid: ', uuid);
      //TODO
      // if(players[uuid].timer) {
      //   console.log('clearing timer')
      //   clearTimeout(players[uuid].timer)
      //   }

      
      // const [currentGame] = games.filter(game => game.players.some(player => player.uuid == uuid))
      // const [currentPlayer] = currentGame.players.filter(player => player.uuid == uuid)
      // const { room } = currentGame

      // const playerUpdate = { ...currentPlayer, socketID: id, online: true }
      // const keepPlayers = currentGame.players.filter(player => player.uuid !== uuid)
      // const gameUpdate = { ...currentGame, players: [...keepPlayers, playerUpdate] }

      // socket.join(room)
      // io.to(room).emit("update", hideInfo(gameUpdate))
      
      // updateGames(gameUpdate, room)
      // console.log(chalk.green(`${chalk.bgGreen.black.bold(` ${uuid.substring(0,4)} `)} returned to room: ${chalk.bgGreen.black.bold(` ${room} `)}`))
    }

    
    socket.on("create", startInfo => {
      const uuid = uuidv4()
      socket.emit("uuid", uuid)
      if(startInfo.join) {
        const room = startInfo.code.toUpperCase()
        const [currentGame] = games.filter(game => game.room === room)

        const gameUpdate = makePlayer_Game(startInfo, uuid, room, socket.id, currentGame)
        console.log('gameUpdate.room: ', gameUpdate.room);

        socket.join(room)
        io.to(room).emit("update", hideInfo(gameUpdate))
        socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))

        updateGames(gameUpdate, room)
        console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green  created and joined room: }{bgGreen.black.bold  ${room} }`)
      } else {
        const room = Math.random().toString(36).substring(2, 6).toUpperCase()

        const gameUpdate = makePlayer_Game(startInfo, uuid, room, socket.id)
        
        socket.join(room)
        io.to(room).emit("update", hideInfo(gameUpdate))
        socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))

        updateGames(gameUpdate, room)
        console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green  created and game room: }{bgGreen.black.bold  ${room} } was created`)
      }
    })

    socket.on("reconnectTest", (playerUuid) => {
      console.log('reconnectTest playerUuid: ', playerUuid);
      console.log('socket.id', socket.id);
    })

    socket.on("init", ({ playerUuid, room }) => {
      console.log('room: ', room);
      console.log('playerUuid: ', playerUuid);

      playerToRoom(playerUuid, room, socket, io)
      
      // socket.join(room)
      // io.to(room).emit("update", hideInfo(gameUpdate))
      // socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))

      // updateGames(gameUpdate, room)
      // console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green  created and game room: }{bgGreen.black.bold  ${room} } was created`)
    })

    // Updates game with player choice selection and sends update to other players in the game
    socket.on("choice", ({ uuid, choice }) => {
      const [currentGame] = games.filter(game => game.players.some(player => player.uuid == uuid))
      if(currentGame.endCamp || currentGame.endHazard) {
        console.log('endCamp: ', currentGame.endHazard);
        console.log('endCamp: ', currentGame.endCamp);
        console.log(`choice shouldn't run`);
        return
      }

      const [currentPlayer] = currentGame.players.filter(player => player.uuid == uuid)
      const { room } = currentGame

      const curPlayerUpdate = { ...currentPlayer, choice, choiceMade: true, showChoice: currentGame.onePlayer }
      const keepPlayers = currentGame.players.filter(player => player.uuid !== uuid)
      const playersUpdate = [...keepPlayers, curPlayerUpdate]
      const allChoices = playersUpdate.every(player => player.choiceMade)
      console.log('choice -> allChoices: ', allChoices);
      const gameUpdate = { ...currentGame, players: playersUpdate, questCycle: currentGame.onePlayer ? FLIP : (allChoices ? REVEAL : WAIT) }
      console.log('choice -> gameUpdate: ', gameUpdate);

      socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))
      io.to(room).emit("update", hideInfo(gameUpdate))

      updateGames(gameUpdate, room)
      console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green submitted choice: }{bgGreen.black.bold  ${choice} }`)
    })

    socket.on("toggleChoice", ({ uuid, choice }) => {
      console.log('choice: ', choice);
      const [currentGame] = games.filter(game => game.players.some(player => player.uuid == uuid))
      if(currentGame.endCamp || currentGame.endHazard) {
        console.log('endCamp: ', currentGame.endHazard);
        console.log('endCamp: ', currentGame.endCamp);
        console.log(`choice shouldn't run`);
        return
      }

      const [currentPlayer] = currentGame.players.filter(player => player.uuid == uuid)
      const { room } = currentGame

      const curPlayerUpdate = { ...currentPlayer, choiceMade: false, choice, toggle: true }
      console.log('curPlayerUpdate: ', curPlayerUpdate);
      const keepPlayers = currentGame.players.filter(player => player.uuid !== uuid)
      const playersUpdate = [...keepPlayers, curPlayerUpdate]
      const allChoices = playersUpdate.every(player => player.choiceMade)
      console.log('choice -> allChoices: ', allChoices);
      const gameUpdate = { ...currentGame, players: playersUpdate, questCycle: WAIT }
      console.log('choice -> gameUpdate: ', gameUpdate);

      io.to(room).emit("update", hideInfo(gameUpdate))
      socket.emit("playerUpdate", playerInfo(gameUpdate, uuid))
      console.log('gameUpdate: ', gameUpdate);

      updateGames(gameUpdate, room)
      console.log(chalk`{bgGreen.black.bold  ${uuid.substring(0,4)} }{green cleared their choice. }`)
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