import io from 'socket.io-client'
let socket

export const playerInit = (init, playerUuid) => {
  if(init) {
    console.log('if(init)');
    socket = io(`http://localhost:4001?playerUuid=${playerUuid}&init=${init}`)
  } else {
    console.log(`reconnect from playerInit with uuid: ${playerUuid}`);
    socket = io(`http://localhost:4001?playerUuid=${playerUuid}`)
  }
}

export const testPlayerUpdate = handlePlayerUpdate => {
  socket.on('testPlayerUpdate', testPlayerUpdate => {
    // console.log('testPlayerUpdate: ', testPlayerUpdate);
    handlePlayerUpdate(testPlayerUpdate)
  })
}

export const gameReset = resetGame => {
  socket.on('forceReset', () => {
    console.log('gameReset')
    resetGame()
  })
}

export const disconnect = () => {
  console.log('disconnect');
  socket.disconnect()
  socket = null
}

export default {
  playerInit,
  testPlayerUpdate,
  gameReset,
  disconnect
}