const chalk = require('chalk')
const { selectPlayer, selectGameWithPlayer, updatePlayer } = require('./pg/queries')
const { actions: { playerToRoom, playerDisconnect, playerReconnect } } = require('./lib/gameAssets')
const { handlePlayerAction } = require('./controllers')

module.exports = (io) => {
  io.on("connect", async socket => {
    const { playerUuid, init } = socket.handshake.query
    try {
      const { opponentsUpdate } = await handlePlayerAction(playerUuid, playerReconnect, { socketId: socket.id })
      console.log('opponentsUpdate: ', opponentsUpdate);
      opponentsUpdate.sockets.map(({ socketId }) => io.to(socketId).emit("testPlayerUpdate", { opponents: opponentsUpdate.update }))
      console.log(chalk.yellow(`${ chalk.bgYellow.black.bold(` ${ playerUuid.substring(0, 4) } `) } reconnected with socket: ${socket.id}`))
    } catch(error) {
      console.log('error: ', error);

    }
    if(init) {
      try {
        const { playerUpdate, opponentsUpdate, gameUpdate } = await handlePlayerAction(playerUuid, playerToRoom)
        opponentsUpdate.sockets.map(({ socketId }) => io.to(socketId).emit("testPlayerUpdate", { ...gameUpdate, opponents: opponentsUpdate.update }))
        socket.emit('testPlayerUpdate', { ...gameUpdate, ...playerUpdate })
        console.log(chalk.yellow(`${ chalk.bgYellow.black.bold(` ${ playerUuid.substring(0, 4) } `) } reconnected`))
      } catch (error) {
        console.log('error: ', error);
      }
    } 
    // else {
    //   // If client needs to be reset emits a force reset command to client socket and stops
    //   console.log('forceReset');
    //   socket.emit('forceReset')
    //   return
    // }

    //Sets disconnected player to offline status and sends status to remaining players in game
    socket.on("disconnect", async () => {
      console.log('disconnect - socket.id: ', socket.id);
      const { playerUuid } = await selectPlayer('socketId', socket.id)
      console.log(`Disconnect - PlayerUuid: ${playerUuid}, Socket: ${socket.id}`)
      if(playerUuid) {
        try {
          const { opponentsUpdate } = await handlePlayerAction(playerUuid, playerDisconnect)
          console.log('opponentsUpdate: ', opponentsUpdate);
          opponentsUpdate.sockets.map(({ socketId }) => io.to(socketId).emit("testPlayerUpdate", { opponents: opponentsUpdate.update }))
          console.log(chalk.red.bold(`${chalk.bgRed.black.bold(` ${playerUuid.substring(0, 4)} `)} disconnected`))
        } catch (error) {
          console.log('error: ', error);
        }
      }
    })
  })
}