const chalk = require('chalk')

const { updatePlayer, selectGameWithPlayer, selectAllPlayers, selectOpponents } = require('../pg/queries')

const A_CARD = 'ArtifactQuestCard'
const T_CARD = 'TreasureQuestCard'
const H_CARD = 'HazardQuestCard'
const ZERO = 'zero'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'
const CAMP = 'Camp'
const HAZARD = 'hazard'
const TORCH = 'Torch'
const HIDDEN = 'hidden'


/**
 * Creates a deck that is not yet shuffled
 */
const makeDeck = () => {
  //Make empty array of 15 and loop through to create hazard cards
  const hazards = [...Array(15)].map(
    (_, index) => ({
      type: H_CARD,
      hazardType: Math.ceil((index + 1) / 3) - 1, // 5 Hazard types with three of each type
      value: null
    })
  )
  //Treasure card value amounts. Tries to use prime numbers more often to faciliate leftovers when splitting 
  const values = [1, 2, 3, 4, 5, 5, 7, 7, 9, 11, 11, 13, 14, 15, 17]
  const treasures = values.map(value => ({ type: T_CARD, value })
  )
  //Artifact cards, values determined later when revealed
  const artifacts = [...Array(5)].map(() => ({ type: A_CARD, value: null}))
  
  //combine cards and add default shared values
  const deck = [...hazards, ...treasures, ...artifacts].map(
    card => ({ ...card, onBoard: false, order: null, playerUuid: null }))

  return deck
}

const makeGame = size => {
  return {
    room: Math.random().toString(36).substring(2, 6).toUpperCase(),
    deck: makeDeck(),
    size: parseInt(size),
    round: 0,
    questCycle: ZERO,
    endCamp: false,
    endHazard: false,
    onePlayer: false,
    spare: 0,
    artifacts: 0,
  }
}

const makePlayer = (gameUuid, name, host = false) => {
  return {
    gameUuid,
    name,
    host,
    choice: TORCH,
  }
}

const genArtifacts = deck => {
  console.log('genArtifacts');
  const artifacts = deck.filter(card => card.playerUuid)
  if(artifacts.length === 0) return []

  const allPlayersArtifacts = artifacts.reduce(
    (allPlayers, currentCard) => {
      const player = currentCard.playerUuid
      const previousCards = allPlayers[player] ? allPlayers[player].playerArtifacts : []
      return { ...allPlayers, [player]: [...previousCards, { value: currentCard.value }] }
    }, {})

  return allPlayersArtifacts
}

const genOpponents = (playerUuid, allPlayersArtifacts, allPlayers) => {
  console.log('genOpponents');
  const opponents = allPlayers.filter(player => player.playerUuid !== playerUuid).reduce((allOpponents, opponent) => {
    const playerArtifacts = allPlayersArtifacts[opponent.playerUuid] || []
    return [...allOpponents, { ...opponent, playerArtifacts }]
  }, [])
  return opponents
}

const playerToRoom = async (playerUuid, room, socket, io) => {
  try {
    const player = await updatePlayer(playerUuid, { socketId: socket.id, online: true })
    const { name, host, totalScore, roundScore, choiceMade, choice } = player
    const game = await selectGameWithPlayer('playerUuid', playerUuid)
    const { gameUuid, deck, size, questCycle, round } = game
    const dbOpponents = await selectOpponents(gameUuid, playerUuid)

    const allPlayersArtifacts = genArtifacts(deck)
    const playerArtifacts = allPlayersArtifacts[playerUuid] || []
    const opponents = await genOpponents(playerUuid, allPlayersArtifacts, dbOpponents)
    const quest = deck.filter(card => card.onBoard)
    
    const playerState = {
      name,
      host,
      totalScore,
      roundScore,
      choiceMade,
      choice,
      size,
      questCycle,
      round,
      playerArtifacts,
      opponents,
      quest,
      init: false
    }

    console.dir(playerState);
    socket.join(room)
    io.to(room).emit("testUpdate", 'sent to all')
    socket.emit("testPlayerUpdate", playerState)
    console.log(chalk.green(`${chalk.bgGreen.black.bold(` ${playerUuid.substring(0,4)} `)} returned to room: ${chalk.bgGreen.black.bold(` ${room} `)}`))
  } catch (error) {
    console.log('error: ', error);
  }
}

const playerChoice = (game, allPlayers, playerUuid, update) => {
  const opponents = allPlayers.filter(player => player.playerUuid !== playerUuid)
  const sockets = opponents.map(opponent => opponent.socketId)
  const playerUpdate = { 
    ...update, 
    choiceMade: true,
    showChoice: game.onePlayer 
  }
  const allChoices = opponents.every(player => player.choiceMade)
  const gameUpdate = { 
    questCycle: 
      game.onePlayer ? 
        FLIP 
        : 
        allChoices ? 
          REVEAL 
          : 
          WAIT 
  }

  return { 
    gameUpdate,
    playerUpdate,
    opponentsUpdate: {
      sockets,
      update: [{
        playerUuid,
        choiceMade: true
      }]
    }
  }
}

const toggleChoice = (game, allPlayers, playerUuid, update) => {
  const opponents = allPlayers.filter(player => player.playerUuid !== playerUuid)
  const sockets = opponents.map(opponent => opponent.socketId)
  const playerUpdate = { choiceMade: false }
  const gameUpdate = { questCycle: WAIT }

  return { 
    gameUpdate,
    playerUpdate,
    opponentsUpdate: {
      sockets,
      update: [{
        playerUuid,
        ...playerUpdate
      }]
    }
  }
}

const updateArtifacts = (campPlayers, deck) => {
  if(campPlayers.length !== 1) {
    const deckUpdate = deck.map(card => card.type === A_CARD && card.onBoard ? { ...card, onBoard: false, removed: true } : card)
    return deckUpdate
  }

  const [player] = campPlayers
  const deckUpdate = deck.map(card => card.type === A_CARD && card.onBoard ? { ...card, onBoard: false, playerUuid: player.playerUuid } : card)
  return deckUpdate
}

const revealChoices = (game, allPlayers) => {
  const { deck: _deck, spare } = game
  const newArtifacts = _deck.some(card => card.type === A_CARD && card.onBoard)
  const playersSplit = allPlayers.reduce(
    (acc, cur) => {
      if(cur.choice === TORCH && !cur.leftRound) {
        const prev = acc.torch || []
        return { 
          ...acc, 
          torch: [
            ...prev,
            { 
              playerUuid: cur.playerUuid,
              socketId: cur.socketId,
              choice: cur.choice
            }
          ] 
        }
      } else if(cur.leftRound) {
        const prev = acc.tent || []
        return { ...acc, tent: [...prev, { playerUuid: cur.playerUuid, socketId: cur.socketId }] }
      } else {
        const prev = acc.camp || []
        return { 
          ...acc, 
          camp: [
            ...prev, 
            { 
              playerUuid: cur.playerUuid,
              socketId: cur.socketId, 
              leftRound: true, 
              totalScore: cur.totalScore,
              roundScore: cur.roundScore,
              choice: cur.choice
            }
          ] 
        }
      }
    }, {})

  if(!playersSplit.camp) playersSplit.camp = []
  if(!playersSplit.torch) playersSplit.torch = []
  if(!playersSplit.tent) playersSplit.tent = []

  const _endCamp = playersSplit.torch.length === 0
  const campCount = playersSplit.camp.length
  const anyCamp = campCount !== 0
  const spareScore = anyCamp ? Math.floor(spare / campCount) : 0
  const spareUpdate = _endCamp ? 0 : anyCamp ? spare % campCount : spare

  const gameUpdate = { 
    ...((newArtifacts && anyCamp) && { deck: updateArtifacts(playersSplit.camp, _deck) }), 
    ...(spare !== spareUpdate && { spare: spareUpdate }), 
    ...(_endCamp && { endcamp: true }), 
    questCycle: _endCamp ? CAMP : FLIP 
  }

  const { deck, endcamp, ...playerAppend } = gameUpdate

  const campPlayersUpdate = playersSplit.camp.map(
    player => {
      return { 
        ...player,
        roundScore: 0, 
        totalScore: player.totalScore + player.roundScore + spareScore
      }
    })

  const allPlayersArtifacts = anyCamp && genArtifacts(deck || _deck)
  const joinPlayers = [...playersSplit.torch, ...playersSplit.tent, ...campPlayersUpdate]
  const cleanOpponents = joinPlayers.map(player => {
    const { socketId, totalScore, ...opponentAppend } = player
    return opponentAppend
  })

  const playersViewEmit = joinPlayers.map(player => {
    const opponents = anyCamp && genOpponents(player.playerUuid, allPlayersArtifacts, cleanOpponents)
    const { socketId, playerUuid, ...playerKeep } = player
    return { 
      socketId,
      update: { ...playerKeep, ...playerAppend, ...(opponents && { opponents }) }
    }
  })

  return { 
    gameUpdate,
    playersUpdate: campPlayersUpdate,
    playersViewEmit
  }
}

const hideInfo = (game) => {
  const hidePlayers = game.players.map(player => { 
    return player.showChoice || player.toggle ? { ...player, totalScore: HIDDEN } : { ...player, totalScore: HIDDEN, choice: HIDDEN }
  })
  return { ...game, deck: null, players: [...hidePlayers].sort((a, b) => a.order - b.order) }
}

const playerInfo = (game, uuid) => {
  const [player] = game.players.filter(player => player.uuid == uuid)
  return {
    name: player.name,
    order: player.order,
    host: player.host,
    totalScore: player.totalScore,
    roundScore: player.roundScore,
    playerArtifacts: player.playerArtifacts,
    leftRound: player.leftRound,
    showChoice: player.showChoice,
    choiceMade: player.choiceMade,
    choice: player.choice
  }
}

const concealChoices = players => {
  return players.map(player => { return { ...player, showChoice: false, choiceMade: false } })
}

const checkHazards = (card, hazards, quest) => {
  const hazardsUpdate = hazards.map((count, index) => card.type === index ? count + 1 : count)
  const endHazard = hazardsUpdate.some(hazard => hazard > 1)
  console.log('endHazard: ', endHazard);

  return { endHazard, hazards: hazardsUpdate, quest: [card, ...quest], questCycle: endHazard ? HAZARD : WAIT }
}

const checkTopCard = (topCard, players, spare, hazards, quest, artifacts) => {
  return {
    spare,
    players,
    ...(topCard.card === T_CARD && calcScores(players, topCard, spare, quest)),
    ...(topCard.card === H_CARD && checkHazards(topCard, hazards, quest)),
    ...topCard.card === A_CARD && { artifacts: artifacts + 1, quest: [{  ...topCard, value: artifacts > 3 ? 10 : 5 }, ...quest] } }
}

const startTurn = game => {
  const tentPlayers = game.players.filter(player => player.leftRound)
  console.log('tentPlayers: ', tentPlayers);
  const torchPlayers = game.players.filter(player => player.choice)
  const onePlayer = torchPlayers.length === 1
  console.log('onePlayer: ', onePlayer);
  console.log('torchPlayers: ', torchPlayers);

  const topCardUpdate = checkTopCard(game.deck[0], torchPlayers, game.spare, game.hazards, game.quest, game.artifacts, game.questCycle)
  console.log('topCardUpdate: ', topCardUpdate);
  const torchPlayersUpdate = topCardUpdate.players
  console.log('torchPlayersUpdate: ', torchPlayersUpdate);
  // const torchPlayersConcealed = onePlayer ? torchPlayersUpdate : concealChoices(torchPlayersUpdate)
  const torchPlayersConcealed = concealChoices(torchPlayersUpdate)
  console.log('torchPlayersConcealed: ', torchPlayersConcealed);
  const playersUpdate = [...tentPlayers, ...torchPlayersConcealed]
  console.log('playersUpdate: ', playersUpdate);
  const deckUpdate = [...game.deck.filter((_, index) => index !== 0)]

  return { ...game, questCycle: WAIT, ...topCardUpdate, players: playersUpdate, deck: deckUpdate, onePlayer }
}

const startRound = (game) => {
  const questCardUpdate = game.endHazard ? [...game.quest.filter((_, index) => index !== 0)] : game.quest
  const deckUpdate = [...game.deck, ...questCardUpdate, { card: A_CARD, value: null }].sort(() => Math.random() - .5)
  const playersUpdate = game.players.map(player => { return { ...player, roundScore: 0, showChoice: true, choiceMade: true, choice: TORCH, leftRound: false } })
  return { ...game, players: playersUpdate, round: game.round + 1, quest: [], questCycle: WAIT, endCamp: false, endHazard: false, deck: deckUpdate, spare: 0, hazards: [0,0,0,0,0], onePlayer: false }
}

module.exports = {
  makeGame,
  makePlayer,
  makeDeck,
  hideInfo,
  playerInfo,
  startTurn,
  startRound,
  revealChoices,
  playerToRoom,
  actions: {
    playerChoice,
    toggleChoice,
    revealChoices
  }
}