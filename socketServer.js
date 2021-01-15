const chalk = require('chalk')
const { selectPlayer, selectGameWithPlayer, updatePlayer } = require('./pg/queries')
const { actions: { playerToRoom, playerDisconnect, playerReconnect } } = require('./lib/gameAssets')
const { handlePlayerAction } = require('./controllers')

module.exports = (io) => {
  io.on("connect", async socket => {
    const { playerUuid } = socket.handshake.query
    try {
      const { opponentsUpdate } = await handlePlayerAction(playerUuid, playerReconnect, { socketId: socket.id })
      opponentsUpdate.sockets.map(({ socketId }) => io.to(socketId).emit("gameUpdate", { opponents: opponentsUpdate.update }))
      console.log(chalk.yellow(`${ chalk.bgYellow.black.bold(` ${ playerUuid.substring(0, 4) } `) } reconnected with socket: ${socket.id}`))
    } catch(error) {
      console.log('error: ', error);

    }

    //Sets disconnected player to offline status and sends status to remaining players in game
    socket.on("disconnect", async () => {
      console.log('disconnect - socket.id: ', socket.id);
      const { playerUuid } = await selectPlayer('socketId', socket.id)
      console.log(`Disconnect - PlayerUuid: ${playerUuid}, Socket: ${socket.id}`)
      if(playerUuid) {
        try {
          const { opponentsUpdate } = await handlePlayerAction(playerUuid, playerDisconnect)
          opponentsUpdate.sockets.map(({ socketId }) => io.to(socketId).emit("gameUpdate", { opponents: opponentsUpdate.update }))
          console.log(chalk.red.bold(`${chalk.bgRed.black.bold(` ${playerUuid.substring(0, 4)} `)} disconnected`))
        } catch (error) {
          console.log('error: ', error);
        }
      }
    })
  })
}