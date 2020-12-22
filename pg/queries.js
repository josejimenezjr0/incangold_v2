const db = require('./db')

const insertGame = async game => {
  const [rows] = await db
    .insert(game)
    .into("games")
    .returning("*")
  return rows
}

const insertDeck = async deck => {
  const rows = await db
    .insert(deck)
    .into("deck")
    .returning("*")

  return rows
}

const insertHazardTracker = async game_uuid => {
  const [rows] = await db
    .insert({ game_uuid })
    .into("hazards")
    .returning("*")

  return rows
}

const insertPlayer = async player => {
  const [rows] = await db
    .insert(player)
    .into("players")
    .returning("*")

  return rows
}

const insertPlayerArtifacts = async (player_uuid, card_id) => {
  const rows = await db
  .insert({ player_uuid, card_id })
  .into("player_artifacts")
  .returning("*")

  return rows
}

module.exports = {
  insertGame,
  insertDeck,
  insertHazardTracker,
  insertPlayer,
  insertPlayerArtifacts
}