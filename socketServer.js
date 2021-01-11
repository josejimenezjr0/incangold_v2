const chalk = require('chalk')
const { playerToRoom } = require('./lib/gameAssets')
const { selectPlayer, selectGameWithPlayer, updatePlayer } = require('./pg/queries')

module.exports = (io) => {
  /**
   * Socket middleware - Check for reconnect flag and if the server has been restarted (players empty or no client uuid)
   * sets reset flag otherwise checks if client is returning and attaches uuid.
   */
  const checkServerClient = () => {
    return async (socket, next) => {
      const playerUuid = socket.handshake.query.reconnect
      if(playerUuid) {
        const dbCheck = await selectGameWithPlayer('playerUuid', playerUuid)
        const { room } = dbCheck
        playerToRoom(playerUuid, room, socket, io)
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
    const { reset } = socket

    // If client needs to be reset emits a force reset command to client socket and stops
    if(reset) {
      console.log('forceReset');
      socket.emit('forceReset')
      return
    }

    socket.on("init", ({ playerUuid, room }) => {
      playerToRoom(playerUuid, room, socket, io)
    })

    //Sets disconnected player to offline status and sends status to remaining players in game
    socket.on("disconnect", async () => {
      console.log('disconnect');
      const { playerUuid } = await selectPlayer('socket_id', socket.id)
      if(playerUuid) {
        await updatePlayer(playerUuid, { online: false })
        console.log(chalk.red.bold(`${chalk.bgRed.black.bold(` ${playerUuid.substring(0, 4)} `)} disconnected`))
        // console.log(chalk.red.bold(`${chalk.bgRed.black.bold(` ${playerUuid.substring(0, 4)} `)} disconnected from room: ${chalk.bgRed.black.bold(` ${room} `)}`))
      }
    })
  })
}