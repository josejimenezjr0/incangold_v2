const db = require('./db')

const snakeToCamel = string => string.replace(/(_\w)/g, x => x[1].toUpperCase())
const camelToSnake = string => string.replace(/[\w]([A-Z])/g, x => x[0] + "_" + x[1]).toLowerCase();
const objSnakeToCamel = obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [snakeToCamel(key), value]))
const objCamelToSnake = obj => Object.fromEntries(Object.entries(obj).map(([key, value]) => [camelToSnake(key), value]))

const insertGame = async preGame => {
  const game = objCamelToSnake(preGame)
  console.log('queries insertGame');
  const { deck } = game
  const [rows] = await db
    .insert({ ...game, deck: JSON.stringify(deck) })
    .into("games")
    .returning("*")
  return objSnakeToCamel(rows)
}

const insertPlayer = async prePlayer => {
  const player = objCamelToSnake(prePlayer)
  console.log('queries insertPlayer');
  const [rows] = await db
    .insert(player)
    .into("players")
    .returning("*")

  return objSnakeToCamel(rows)
}

const updateGame = async (game_uuid, _rawUpdate) => {
  const rawUpdate = objCamelToSnake(_rawUpdate)
  const { deck, ...preUpdate } = rawUpdate
  const update = {...preUpdate, ...(deck && { deck: JSON.stringify(deck) }) }
  // console.log(`queries updateGame ${game_uuid} w/ update: ${JSON.stringify(update)}`);
  console.log(`queries updateGame`);
  const [rows] = await db('games')
    .where({ game_uuid })
    .update(update)
    // .toSQL()
    // .toNative())
    .returning("*")

  return objSnakeToCamel(rows)
}

const updatePlayer = async (player_uuid, preUpdate) => {
  const update = objCamelToSnake(preUpdate)
  // console.log(`queries updatePlayer ${player_uuid} w/ update: ${JSON.stringify(update)}`);
  console.log(`queries updatePlayer`);
  const [rows] = await db('players')
    .where({ player_uuid })
    .update(update)
    // .toSQL()
    // .toNative())
    .returning("*")

  return objSnakeToCamel(rows)
}

const updateManyPlayers = async (preUpdate) => {
  console.log('updateManyPlayers');
  const update = preUpdate.map(item => objCamelToSnake(item))
  await Promise.all(update.map(async player => {
    await db('players')
    .where({ player_uuid: player.player_uuid })
    .update(player)
  }))
}

const selectGame = async (preFilter, value) => {
  const filter = camelToSnake(preFilter)
  // console.log(`queries selectGame w/ filter: ${filter}, value: ${value}`);
  console.log(`queries selectGame`);
  const [rows] = await db('games')
    .where({ [filter]: value })
    // .toSQL()
    // .toNative())
    .returning("*")

  // console.log('rows: ', rows);
  return objSnakeToCamel(rows)
}

const selectPlayer = async (preFilter, value) => {
  const filter = camelToSnake(preFilter)
  console.log(`queries selectPlayer w/ filter: ${filter}, value: ${value}`);
  // console.log(`queries selectPlayer`);
  const [rows] = await db('players')
    .where({ [filter]: value })
    // .toSQL()
    // .toNative())
    .returning("*")

  // console.log('rows: ', rows);
  return objSnakeToCamel(rows)
}

const selectAllPlayers = async (preFilter, value) => {
  const filter = camelToSnake(preFilter)
  // console.log(`queries selectAllPlayers w/ filter: ${filter}, value: ${value}`);
  console.log(`queries selectAllPlayers`);
  const rows = await db('players')
    .where({ [filter]: value })
    // .toSQL()
    // .toNative())
    .returning("*")

  // console.log('rows: ', rows);
  return rows.map(row => objSnakeToCamel(row))
}

const selectOpponents = async (game_uuid, player_uuid) => {
  // console.log(`queries selectOpponents w/ game_uuid: ${game_uuid}, player_uuid: ${player_uuid}`);
  console.log(`queries selectOpponents`);
  const rows = await db('players')
    .select('player_uuid', 'name', 'choice', 'choice_made', 'online', 'round_score', 'left_round')
    .where({ game_uuid })
    .andWhere('player_uuid', '!=', `${player_uuid}`)
    // .toSQL()
    // .toNative())
    .returning("*")

  return rows.map(row => objSnakeToCamel(row))
}

const selectGameWithPlayer = async (preFilter, value) => {
  const filter = camelToSnake(preFilter)
  // console.log(`queries selectGameWithPlayer w/ filter: ${filter}, value: ${value}`);
  console.log(`queries selectGameWithPlayer`);
  const [rows] = await db('games')
    // .select('room')
    .where('game_uuid', '=', 
      db('players')
      .select('game_uuid')
      .where(`${filter}`, '=', `${value}`))
    // .toSQL()
    // .toNative())
    // .returning("*")

  // console.log('rows: ', rows);
  return objSnakeToCamel(rows)
}

module.exports = {
  insertGame,
  insertPlayer,
  updatePlayer,
  selectPlayer,
  selectGameWithPlayer,
  selectOpponents,
  selectGame,
  selectAllPlayers,
  updateGame,
  updateManyPlayers
}