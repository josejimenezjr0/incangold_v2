const { 
  insertGame,
  insertPlayer,
  selectGame,
  updatePlayer,
  selectGameWithPlayer,
  updateGame,
  selectAllPlayers,
  updateManyPlayers
  } = require('./pg/queries');
const { makeGame, makePlayer, actions } = require('./lib/gameAssets')

const socket = require('./app');

const makeJoin = async (req, res) => {
  const { name, room: code, size, join } = req.body.makeJoinInfo
  try {
    const { gameUuid } = !join ? await insertGame(makeGame(size)) : await selectGame('room', code.toUpperCase())
    const { playerUuid } = await insertPlayer(makePlayer(gameUuid, name, !join))

    const { playerUpdate, opponentsUpdate, gameUpdate } = await handlePlayerAction(playerUuid, actions.playerToRoom)
    console.log('makeJoin - opponentsUpdate: ', opponentsUpdate);
    opponentsUpdate.sockets.map(opponent => socket.ioObj.to(opponent).emit("testPlayerUpdate", { ...gameUpdate, opponents: opponentsUpdate.update }))

    return res.status(200).send({ ...gameUpdate, ...playerUpdate })
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).send(error)
    
  }
}

const handlePlayerAction = async (playerUuid, action, update) => {
  console.log(`handlePlayerAction - playerUuid: ${playerUuid}, update: ${JSON.stringify(update)}`);

  const game = await selectGameWithPlayer('playerUuid', playerUuid)
  const allPlayers = await selectAllPlayers('gameUuid', game.gameUuid)
  const { playerUpdate, opponentsUpdate, gameUpdate, makeJoin } = action(game, allPlayers, playerUuid, update)

  !makeJoin && await updatePlayer(playerUuid, playerUpdate)
  gameUpdate && await updateGame(game.gameUuid, gameUpdate)

  return { playerUpdate, opponentsUpdate, gameUpdate }
}

const handleGameAction = async (playerUuid, action) => {
  console.log(`handleGameAction - playerUuid: ${playerUuid}`);

  const game = await selectGameWithPlayer('playerUuid', playerUuid)
  const allPlayers = await selectAllPlayers('gameUuid', game.gameUuid)
  const { playersUpdate, gameUpdate, playersViewEmit } = action(game, allPlayers)

  await updateManyPlayers(playersUpdate)
  await updateGame(game.gameUuid, gameUpdate)

  return { playersViewEmit }
}

const playerAction = async (req, res) => {
  const { playerUuid } = req.params
  const { action, update } = req.body

  try {
    const { playerUpdate, opponentsUpdate, gameUpdate } = await handlePlayerAction(playerUuid, actions[action], update)
    opponentsUpdate.sockets.map(opponent => socket.ioObj.to(opponent).emit("testPlayerUpdate", { ...gameUpdate, opponents: opponentsUpdate.update }))

    return res.status(200).send({ ...gameUpdate, ...playerUpdate })
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).send(error)
  }
}

const gameAction = async (req, res) => {
  const { playerUuid } = req.params
  const { action } = req.body

  try {
    const { playersViewEmit } = await handleGameAction(playerUuid, actions[action])
    playersViewEmit.map(player => {
      console.log('playersViewEmit.map(player: ');
      console.dir(player, { depth: null });
      socket.ioObj.to(player.socketId).emit("testPlayerUpdate", player.update)
    })

    return res.status(200).send('ok')
  } catch (error) {
    console.log('error: ', error);
    return res.status(500).send(error)
  }
}

module.exports = {
  makeJoin,
  playerAction,
  gameAction,
  handlePlayerAction
}