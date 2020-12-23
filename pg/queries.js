const db = require('./db')

const insertGame = async game => {
  const { deck } = game
  const [rows] = await db
    .insert({ ...game, deck: JSON.stringify(deck) })
    .into("games")
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

module.exports = {
  insertGame,
  insertPlayer
}