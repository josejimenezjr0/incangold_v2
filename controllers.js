const { makeGame, makePlayer, actions } = require('./lib/gameAssets')
const { insertGame, insertPlayer, selectGame, updatePlayer, selectOpponents, selectGameWithPlayer, updateGame, selectAllPlayers } = require('./pg/queries');
const socket = require('./app');

const makeJoin = async (req, res) => {
  const { name, room: code, size, join } = req.body.makeJoinInfo
  try {
    const { gameUuid, room } = !join ? await insertGame(makeGame(size)) : await selectGame('room', code.toUpperCase())
    const { playerUuid } = await insertPlayer(makePlayer(gameUuid, name, !join))
    return res.status(200).send({ room, playerUuid })
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).send(error)
    
  }
}

const handleAction = async (playerUuid, update, action) => {
  console.log(`handleAction - playerUuid: ${playerUuid}, update: ${JSON.stringify(update)}`);
  const game = await selectGameWithPlayer('playerUuid', playerUuid)
  const allPlayers = await selectAllPlayers('gameUuid', game.gameUuid)
  const { gameUpdate, playerUpdate, opponentsUpdate } = action(game, allPlayers, playerUuid, update)
  await updatePlayer(playerUuid, playerUpdate)
  await updateGame(game.gameUuid, gameUpdate)
  return { playerUpdate, opponentsUpdate }
}

const playerAction = async (req, res) => {
  const { playerUuid } = req.params
  const { action, update } = req.body
  try {
    const { playerUpdate, opponentsUpdate } = await handleAction(playerUuid, update, actions[action])
    
    opponentsUpdate.sockets.map(opponent => socket.ioObj.to(opponent).emit("testUpdate", opponentsUpdate.update))
    return res.status(200).send(playerUpdate)
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).send(error)
  }
}

module.exports = {
  makeJoin,
  playerAction
}