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
      value: null,
      removed: false
    })
  )
  //Treasure card value amounts. Tries to use prime numbers more often to faciliate leftovers when splitting 
  const values = [1, 2, 3, 4, 5, 5, 7, 7, 9, 11, 11, 13, 14, 15, 17]
  const treasures = values.map(value => ({ type: T_CARD, value, removed: false })
  )
  //Artifact cards, values determined later when revealed
  const artifacts = [...Array(5)].map(() => ({ type: A_CARD, value: null, playerUuid: null, removed: true, purged: false }))
  
  //combine cards and add default shared values
  const deck = [...hazards, ...treasures, ...artifacts].map(
    card => ({ ...card, onBoard: false, deckOrder: null, questOrder: null }))

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
    const cleanOpponents = dbOpponents.map(player =>({ ...player, choice: (questCycle === FLIP || questCycle === CAMP) ? choice : HIDDEN }))

    const allPlayersArtifacts = genArtifacts(deck)
    const playerArtifacts = allPlayersArtifacts[playerUuid] || []
    const opponents = await genOpponents(playerUuid, allPlayersArtifacts, cleanOpponents)
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

const checkHazards = (deck) => {
  //check deck for onBoard hazards. see if top card makes two of the same type true. if so it's endHazard
  const hazardCount = deck.reduce((acc, cur) => {
    if(cur.onBoard && cur.type === H_CARD) {
      acc[cur.hazardType]++
    }
  }, [...Array(5).fill(0)])

  return hazardCount.filter(count => count > 1).length > 0
}

const findHazard = deck => {
  const hazards = deck.reduce((acc, cur) => {
    if(cur.onBoard && cur.type === H_CARD) {
      acc[cur.hazardType]++
    }
  }, [...Array(5).fill(0)])

  const [removeHazard] = hazards.filter(count => count > 1)
  return removeHazard.hazardType
}

const updateArtifacts = (campPlayers, deck) => {
  if(campPlayers.length !== 1) {
    const deckUpdate = deck.map(card => card.type === A_CARD && card.onBoard ? { ...card, onBoard: false, removed: true, purged: true } : card)
    return deckUpdate
  }

  const [player] = campPlayers
  const deckUpdate = deck.map(card => card.type === A_CARD && card.onBoard ? { ...card, onBoard: false, removed: true, playerUuid: player.playerUuid } : card)
  return deckUpdate
}

const playerChoice = (game, allPlayers, playerUuid, update) => {
  const opponents = allPlayers.filter(player => player.playerUuid !== playerUuid)
  const sockets = opponents.map(opponent => opponent.socketId)
  const playerUpdate = { 
    ...update, 
    choiceMade: true
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

const revealChoices = (game, allPlayers) => {
  const { deck: _deck, spare } = game
  const newArtifacts = _deck.some(card => card.type === A_CARD && card.onBoard)
  const playersSplit = allPlayers.reduce((acc, cur) => {
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

  const campCount = playersSplit.camp.length
  const anyCamp = campCount !== 0
  const spareScore = anyCamp ? Math.floor(spare / campCount) : 0
  const spareUpdate = anyCamp ? spare % campCount : spare

  const gameUpdate = { 
    ...((newArtifacts && anyCamp) && { deck: updateArtifacts(playersSplit.camp, _deck) }), 
    ...(spare !== spareUpdate && { spare: spareUpdate }), 
    questCycle: playersSplit.torch.length === 0 ? CAMP : FLIP 
  }

  const { deck, ...playerAppend } = gameUpdate

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

const startTurn = (game, allPlayers) => {
  const { deck: _deck, spare, artifacts } = game
  // split players into those who left and those still playing. Also determine if it's just one player.
  const playersSplit = allPlayers.reduce((acc, cur) => {
    if(!cur.leftRound) {
      const prev = acc.torch || []
      return { ...acc, torch: [...prev, { playerUuid: cur.playerUuid, socketId: cur.socketId }] }
    } else {
      const prev = acc.tent || []
      return { ...acc, torch: [...prev, { playerUuid: cur.playerUuid, socketId: cur.socketId }] }
    }
  }, {})


  // flip top card of deck and determine action based on type.
  const [topCard, ...restDeck] = _deck.sort((a, b) => a.deckOrder > b.deckOrder)
  const deckUpdate = [
    { 
      ...topCard, 
      onBoard: true, 
      questOrder: _deck.filter(card => card.onBoard).length,
      ...(topCard.type === A_CARD && { value: artifacts > 3 ? 10 : 5 }),
    },
    ...restDeck
  ]
  const torchCount = playersSplit.torch.length
  const spareUpdate = topCard.type === T_CARD ? spare + (topCard.value % torchCount) : spare


  const gameUpdate = {
    deck: deckUpdate,
    ...(topCard.type === A_CARD && { artifacts: artifacts + 1 }),
    ...(spare !== spareUpdate && { spare: spareUpdate }), 
    ...((torchCount === 1) !== onePlayer && { onePlayer: !onePlayer }),
    questCycle: checkHazards(deckUpdate) ? HAZARD : WAIT
  }

  const { deck, ...playerAppend } = gameUpdate

  // if top card is tresure: add calc round score to players still in, update spare
  const torchPlayersUpdate = topCard.type === T_CARD ? playersSplit.torch.map(player => {
    return {
      ...player,
      roundScore: player.roundScore + Math.floor(topCard.value / torchCount) 
    }
  }) : []

  const allPlayersArtifacts = topCard.type === T_CARD && genArtifacts(deckUpdate)
  const joinPlayers = [...playersSplit.tent, ...torchPlayersUpdate]
  const cleanOpponents = joinPlayers.map(player => {
    const { socketId, ...opponentAppend } = player
    return { ...opponentAppend, choice: HIDDEN }
  })

  const playersViewEmit = joinPlayers.map(player => {
    const opponents = topCard.type === T_CARD && genOpponents(player.playerUuid, allPlayersArtifacts, cleanOpponents)
    const { socketId, playerUuid, ...playerKeep } = player
    return { 
      socketId,
      update: { ...playerKeep, ...playerAppend, ...(opponents && { opponents }) }
    }
  })

    console.log('gameUpdate: ', gameUpdate);
    console.log('playersUpdate: ', playersUpdate);
    console.log('playersViewEmit: ', playersViewEmit);
  return { 
    gameUpdate,
    playersUpdate: torchPlayersUpdate,
    playersViewEmit
  }
}

const startRound = (game, allPlayers) => {
  const { deck: _deck, round, spare, artifacts, onePlayer } = game
  
  //deck update: remove hazard card if needed, add artifact card, shuffle
  let hazardType = checkHazards(_deck) && findHazard(_deck)
  let addArtifiact = true
  let shuffleTrack = 0
  const shuffleOrder = [...Array(_deck.filter(card => !card.removed).length + (hazardType ? 0 : 1))].map((_, ind) => ind).sort(() => Math.random() - .5)
  const deckUpdate = _deck.map(card => {
    if(addArtifiact && card.type === A_CARD && !card.playerUuid && !purged) {
      addArtifiact = false
      return { ...card, deckOrder: shuffleOrder[shuffleTrack++], removed: false, questOrder: null }
    }
    if(card.removed) return
    if(hazardType && card.type === H_CARD && card.hazardType === hazardType) {
      hazardType = null
      return
    }
    return { ...card, deckOrder: shuffleOrder[shuffleTrack++], onboard: false, questOrder: null }
  })

  //reset player values to { roundScore: 0, choiceMade: true, choice: TORCH, leftRound: false }
  //reset game values to { round: game.round + 1, questCycle: WAIT, deck: deckUpdate, spare: 0, onePlayer: false }

  const gameUpdate = { 
    deck: deckUpdate,
    round: round + 1,
    questCycle: WAIT, 
    ...(spare !== 0 && { spare: 0 }),
    ...(onePlayer && { onePlayer: false })
  }

  const { deck, ...playerAppend } = gameUpdate

  const playersUpdate = allPlayers.map(({ playerUuid, socketId }) => ({
    playerUuid, 
    socketId,
    roundScore: 0,
    choiceMade: true,
    choice: TORCH,
    leftRound: false
  }))

  const cleanOpponents = playersUpdate.map(player => {
    const { socketId, ...opponentAppend } = player
    return opponentAppend
  })

  const playersViewEmit = playersUpdate.map(player => {
    const opponents = genOpponents(player.playerUuid, _, cleanOpponents)
    const { socketId, playerUuid, ...playerKeep } = player
    return { 
      socketId,
      update: { ...playerKeep, ...playerAppend, opponents }
    }
  })

    console.log('gameUpdate: ', gameUpdate);
    console.log('playersUpdate: ', playersUpdate);
    console.log('playersViewEmit: ', playersViewEmit);
  return { 
    gameUpdate,
    playersUpdate,
    playersViewEmit
  }
}

module.exports = {
  makeGame,
  makePlayer,
  makeDeck,
  playerToRoom,
  actions: {
    playerChoice,
    toggleChoice,
    revealChoices,
    startTurn,
    startRound,
  }
}