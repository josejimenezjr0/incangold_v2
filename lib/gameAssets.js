const A_CARD = 'ArtifactQuestCard'
const T_CARD = 'TreasureQuestCard'
const H_CARD = 'HazardQuestCard'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'
const CAMP = 'Camp'
const HAZARD = 'Hazard'
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
    questCycle: WAIT,
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
  const opponents = allPlayers.filter(player => player.playerUuid !== playerUuid).reduce((allOpponents, opponent) => {
    return [
      ...allOpponents, 
      { ...opponent, ...(allPlayersArtifacts && { playerArtifacts: allPlayersArtifacts[opponent.playerUuid] || [] }) }
    ]
  }, [])

  return opponents
}

const playerToRoom = (game, allPlayers, playerUuid, update) => {
  const [{ name, host, totalScore, roundScore, choiceMade, choice }] = allPlayers.filter(player => player.playerUuid === playerUuid)
  const { deck, size, questCycle, round, room } = game
  const rawOpponents = allPlayers.filter(player => player.playerUuid !== playerUuid)
  const sockets = rawOpponents.map(opponent => opponent.socketId)
  const cleanOpponents = rawOpponents.map(player => ({ 
    playerUuid: player.playerUuid,
    name: player.name,
    choiceMade: player.choiceMade,
    online: player.online,
    roundScore: player.roundScore,
    leftRound: player.leftRound, 
    choice: (questCycle === FLIP || questCycle === CAMP) ? player.choice : HIDDEN 
  }))

  const allPlayersArtifacts = genArtifacts(deck)
  const playerArtifacts = allPlayersArtifacts[playerUuid] || []
  const opponents = genOpponents(playerUuid, allPlayersArtifacts, cleanOpponents)
  const quest = deck.filter(card => card.onBoard)
  
  const playerUpdate = {
    playerUuid,
    name,
    host,
    room,
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

  console.dir(playerUpdate);

  const opponentsUpdate = {
    sockets,
    update: [{ 
      playerUuid,
      name,
      online: true,
      roundScore,
      choiceMade,
      choice: (questCycle === FLIP || questCycle === CAMP) ? choice : HIDDEN,
      playerArtifacts
    }]
  }

  return { 
    makeJoin: true,
    playerUpdate,
    opponentsUpdate,
  }
}

const playerDisconnect = (game, allPlayers, playerUuid, update) => {
  const sockets = allPlayers.flatMap(player => player.playerUuid !== playerUuid ? { socketId: player.socketId } : [])

  return {
    playerUpdate: { online: false },
    opponentsUpdate: { sockets, update: [{ playerUuid, online: false }] } }
}

const playerReconnect = (game, allPlayers, playerUuid, update) => {
  const sockets = allPlayers.flatMap(player => player.playerUuid !== playerUuid ? { socketId: player.socketId } : [])

  return {
    playerUpdate: { online: true, ...update },
    opponentsUpdate: { sockets, update: [{ playerUuid, online: true }] } }
}

const checkHazards = (deck) => {
  //check deck for onBoard hazards. see if top card makes two of the same type true. if so it's endHazard
  const hazardCount = deck.reduce((acc, cur) => {
    if(cur.onBoard && cur.type === H_CARD) {
      acc[cur.hazardType]++
      return acc
    }
    return acc
  }, [...Array(5).fill(0)]) || []

  console.log('hazardCount: ', hazardCount);
  return hazardCount.filter(count => count > 1).length > 0
}

const findHazard = deck => {
  const hazards = deck.reduce((acc, cur) => {
    if(cur.onBoard && cur.type === H_CARD) {
      acc[cur.hazardType]++
      return acc
    }
    return acc
  }, [...Array(5).fill(0)])

  const [removeHazard] = hazards.filter(count => count > 1)
  console.log('removeHazard: ', removeHazard);
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
  const playerUpdate = { ...update, choiceMade: true }
  const allChoices = opponents.every(player => player.choiceMade)
  const gameUpdate = { questCycle: allChoices ? REVEAL : WAIT }

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

const revealChoices = (game, _allPlayers, update) => {
  // console.log('revealChoices - _allPlayers: ', _allPlayers);
  const allPlayers = update ? _allPlayers.map(player => player.playerUuid === update.playerUuid ? { ...player, choice: update.choice, choiceMade: true } : player) : _allPlayers
  // console.log('revealChoices - allPlayers: ', allPlayers);
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

  // console.log('playersSplit: ', playersSplit);

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
    const opponents = genOpponents(player.playerUuid, allPlayersArtifacts, cleanOpponents)
    const { socketId, playerUuid, ...playerKeep } = player
    return { 
      socketId,
      update: { ...playerKeep, ...playerAppend, ...(opponents && { opponents }) }
    }
  })

  // console.log('gameUpdate: ', gameUpdate);
  console.log('revealChoices');
  console.log('playersUpdate: ', campPlayersUpdate);
  console.log('playersViewEmit: ');
  console.dir(playersViewEmit);

  return { 
    gameUpdate,
    playersUpdate: campPlayersUpdate,
    playersViewEmit
  }
}

const startTurn = (game, allPlayers) => {
  console.log('startTurn allPlayers: ', allPlayers);
  const { deck: _deck, spare, artifacts, onePlayer, round } = game
  // split players into those who left and those still playing. Also determine if it's just one player.
  const playersSplit = allPlayers.reduce((acc, cur) => {
    if(!cur.leftRound) {
      const prev = acc.torch || []
      return { ...acc, torch: [...prev, { playerUuid: cur.playerUuid, socketId: cur.socketId, roundScore: cur.roundScore, choiceMade: false, leftRound: cur.leftRound }] }
    } else {
      const prev = acc.tent || []
      return { ...acc, tent: [...prev, { playerUuid: cur.playerUuid, socketId: cur.socketId, choiceMade: true, leftRound: cur.leftRound }] }
    }
  }, {})

  if(!playersSplit.torch) playersSplit.torch = []
  if(!playersSplit.tent) playersSplit.tent = []

  console.log('startTurn - playersSplit: ', playersSplit);

  const deckSplit = _deck.reduce((acc, cur) => {
    if(!cur.removed && !cur.onBoard) {
      const prev = acc.inDeck || []
      return { ...acc, inDeck: [...prev, cur] }
    } else {
      const prev = acc.notPlayable || []
      return { ...acc, notPlayable: [...prev, cur] }
    }
  }, {})

  // console.log('deckSplit: ', deckSplit);

  // flip top card of deck and determine action based on type.
  const [topCard, ...restInDeck] = deckSplit.inDeck.sort((a, b) => a.deckOrder > b.deckOrder ? 1 : -1)
  const deckUpdate = [
    { 
      ...topCard, 
      onBoard: true, 
      questOrder: _deck.filter(card => card.onBoard).length,
      deckOrder: null,
      ...(topCard.type === A_CARD && { value: artifacts > 3 ? 10 : 5 }),
    },
    ...restInDeck,
    ...deckSplit.notPlayable
  ]
  const torchCount = playersSplit.torch.length
  const spareUpdate = topCard.type === T_CARD ? spare + (topCard.value % torchCount) : spare


  const gameUpdate = {
    round,
    onePlayer,
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
  }) : playersSplit.torch

    const tentPlayersUpdate = topCard.type === T_CARD ? playersSplit.torch.map(player => {
    return {
      ...player,
      roundScore: player.roundScore + Math.floor(topCard.value / torchCount) 
    }
  }) : playersSplit.torch

  const allPlayersArtifacts = topCard.type === T_CARD && genArtifacts(deckUpdate)
  const joinPlayers = [...playersSplit.tent, ...torchPlayersUpdate]
  const cleanOpponents = joinPlayers.map(player => {
    const { socketId, ...opponentAppend } = player
    return { ...opponentAppend, choice: HIDDEN }
  })

  const playersViewEmit = joinPlayers.map(player => {
    const opponents = genOpponents(player.playerUuid, allPlayersArtifacts, cleanOpponents)
    const { socketId, playerUuid, ...playerKeep } = player
    return { 
      socketId,
      update: { 
        ...playerKeep, 
        ...playerAppend,
        quest: deck.filter(card => card.onBoard),
        ...(opponents && { opponents }) 
      }
    }
  })

    // console.log('gameUpdate: ', gameUpdate);
    console.log('startTurn');
    console.log('playersUpdate: ', [...torchPlayersUpdate, ...playersSplit.tent]);
    console.log('playersViewEmit: ');
    console.dir(playersViewEmit);

  return { 
    gameUpdate,
    playersUpdate: [...torchPlayersUpdate, ...playersSplit.tent],
    playersViewEmit
  }
}

const startRound = (game, allPlayers) => {
  // console.log('startRound - allPlayers: ', allPlayers);
  const { deck: _deck, round, spare, artifacts, onePlayer } = game
  
  //deck update: remove hazard card if needed, add artifact card, shuffle
  let hazardType = checkHazards(_deck) && findHazard(_deck)
  let addArtifiact = true
  let shuffleTrack = 0
  const shuffleOrder = [...Array(_deck.filter(card => !card.removed).length + (hazardType ? 0 : 1))].map((_, ind) => ind).sort(() => Math.random() - .5)
  const deckUpdate = _deck.map(card => {
    if(addArtifiact && card.type === A_CARD && !card.playerUuid && !card.purged) {
      addArtifiact = false
      return { ...card, deckOrder: shuffleOrder[shuffleTrack++], removed: false, questOrder: null }
    }
    if(card.removed) return card
    if(hazardType && card.type === H_CARD && card.hazardType === hazardType) {
      hazardType = null
      return { ...card, deckOrder: null, removed: true, questOrder: null }
    }
    return { ...card, deckOrder: shuffleOrder[shuffleTrack++], onBoard: false, questOrder: null }
  })

  // console.log('startRound - deckUpdate: ', deckUpdate);

  const _gameUpdate = {
    ...game,
    deck: deckUpdate,
    round: round + 1,
    ...(spare !== 0 && { spare: 0 }),
    ...(onePlayer && { onePlayer: false })
  }

  const _playersUpdate = allPlayers.map(player => ({
    ...player,
    roundScore: 0,
    choiceMade: true,
    choice: TORCH,
    leftRound: false
  }))

  console.log('startRound - _gameUpdate: ', _gameUpdate);
  console.log(' - _playersUpdate: ', _playersUpdate);
  const { gameUpdate, playersUpdate, playersViewEmit } = startTurn(_gameUpdate, _playersUpdate)
  console.log('startRound - playersViewEmit: ', playersViewEmit);
  console.log('startRound - playersUpdate: ', playersUpdate);

  return { 
    gameUpdate,
    // playersUpdate: playersUpdate.map(player => ({ ...player, leftRound: false })),
    // playersViewEmit: playersViewEmit.map(emit => ({ ...emit, update: { ...emit.update, leftRound: false } }))
    playersUpdate,
    playersViewEmit
  }
}

module.exports = {
  makeGame,
  makePlayer,
  makeDeck,
  actions: {
    playerToRoom,
    playerDisconnect,
    playerReconnect,
    playerChoice,
    toggleChoice,
    revealChoices,
    startTurn,
    startRound,
  }
}