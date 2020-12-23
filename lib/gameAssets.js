const A_CARD = 'ArtifactQuestCard'
const T_CARD = 'TreasureQuestCard'
const H_CARD = 'HazardQuestCard'
const ZERO = 'zero'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'
const CAMP = 'camp'
const HAZARD = 'hazard'
const TORCH = 'Torch'
const HIDDEN = 'hidden'


/**
 * with game_uuid creates a deck that is not yet shuffled
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
    card => ({ ...card, onBoard: false, player_uuid: null }))

  return deck
}

/**
 * ///////////////////
 */
const makePlayer_Game = (startInfo, uuid, room, socket, game) => {
  console.log('makePlayer_Game: ', makePlayer_Game);
  console.log('room: ', room);
  const { name, join } = startInfo
  let gameUpdate
  const player = {
    uuid,
    socketID: socket,
    name,
    order: !join ? 1 : game.order + 1,
    host: true, 
    online: true,
    roundScore: 0,
    totalScore: 0,
    playerArtifacts: [],
    leftRound: false,
    showChoice: true,
    choiceMade: true,
    choice: TORCH,
    timer: null 
  }

  if(!join) {
    const { size } = startInfo
    const deck = makeDeck()
    gameUpdate = { 
      room,
      size,
      order: 1,
      deck,
      round: 0,
      questCycle: ZERO,
      endCamp: false,
      endHazard: false,
      onePlayer: false,
      quest: [],
      spare: 0,
      hazards: [0,0,0,0,0],
      artifacts: 0,
      players: [player]
    }
  } else gameUpdate = { ...game, order: game.order + 1, players: [...game.players, player] }

  return gameUpdate
}

const makeGame = size => {
  return {
    room: Math.random().toString(36).substring(2, 6).toUpperCase(),
    deck: makeDeck(),
    size: parseInt(size),
    player_order: 1,
    round: 0,
    quest_cycle: ZERO,
    end_camp: false,
    end_hazard: false,
    one_player: false,
    spare: 0,
    artifacts: 0,
  }
}

const makePlayer = (game_uuid, name, player_order, host = false) => {
  return {
    game_uuid,
    name,
    player_order,
    host,
    choice: TORCH,
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

const revealChoices = game => {
  const tentPlayers = game.players.filter(player => player.leftRound)
  console.log(`revealChoices -> tentPlayers`, tentPlayers)
  const torchPlayers = game.players.filter(player => player.choice)
  console.log(`revealChoices -> torchPlayers`, torchPlayers)
  const endCamp = torchPlayers.length === 0
  const camp = game.players.filter(player => !player.choice)
  console.log(`revealChoices -> camp`, camp)

  const { campPlayers, campSpare, campQuest } = calcTentScore(camp, game.quest, game.spare)
  const rejoinPlayers = [...tentPlayers, ...campPlayers, ...torchPlayers]
  console.log(`revealChoices -> rejoinPlayers`, rejoinPlayers)
  const playersUpdate = rejoinPlayers.map(player => { return { ...player, showChoice: true } })

  const gameUpdate = { ...game, players: playersUpdate, spare: campSpare, quest: campQuest, endCamp, questCycle: endCamp ? CAMP : FLIP }
  console.log('revealChoices -> gameUpdate: ', gameUpdate);
  return gameUpdate
}

const concealChoices = players => {
  return players.map(player => { return { ...player, showChoice: false, choiceMade: false } })
}

const calcTentScore = (players, quest, spare) => {
  const campCount = players.length
  if(campCount === 0) return { campPlayers: players, campSpare: spare, campQuest: quest }

  const questArtifacts = campCount === 1 ? quest.filter(card => card.card === A_CARD) : []
  console.log('questArtifacts: ', questArtifacts);
  const artifactsScore = questArtifacts.reduce((acc, card) => acc + card.value, 0)
  console.log('artifactsScore: ', artifactsScore);
  const score = Math.floor(spare / campCount) + artifactsScore
  const treasureSpare = spare % campCount

  const playersUpdate = players.map(player => { return { ...player, leftRound:true, roundScore: 0, totalScore: player.totalScore + player.roundScore + score, playerArtifacts: [...player.playerArtifacts, ...questArtifacts] } })
  console.log('caltentscore playersUpdate: ', playersUpdate);

  return { campPlayers: playersUpdate, campSpare: treasureSpare, campQuest: quest.filter(card => card.card !== A_CARD) }
}

const calcScores = (players, card, spare, quest) => {
  console.log('calcscore spare: ', spare);
  const score = Math.floor( card.value / players.length)
  console.log('calcscore score: ', score);
  const treasureSpare =  card.value % players.length
  console.log('calcscore treasureSpare: ', treasureSpare);

  const playersUpdate = players.map(player => { return { ...player, roundScore: player.roundScore + score } })

  return { players: playersUpdate, spare: spare + treasureSpare, quest: [card, ...quest] }
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
  makePlayer_Game,
  makeGame,
  makePlayer,
  makeDeck,
  hideInfo,
  playerInfo,
  startTurn,
  startRound,
  calcScores,
  revealChoices
}
    gameUpdate = { 
      questCycle: ZERO,
    }