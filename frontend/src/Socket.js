import io from 'socket.io-client'
let socket

const init = (playerUuid) => {
  socket = io(`http://localhost:4001?playerUuid=${playerUuid}`)
}

const gameUpdate = update => {
  socket.on('gameUpdate', gameUpdate => {
    console.log('gameUpdate: ', gameUpdate);
    update(gameUpdate)
  })
}

const disconnect = () => {
  socket.disconnect()
  socket = null
}

export default socket = {
  init,
  gameUpdate,
  disconnect
}