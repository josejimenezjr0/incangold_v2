const express = require('express')
const router = new express.Router()
const db = require('../pg/db')
const { makeJoin, playerAction } = require('../controllers')

router.post('/players', makeJoin)

router.put('/players/:playerUuid', playerAction)

router.get('/games', (req, res) => {
  // res.send(games)
})

router.post('/checkjoin', (req, res) => {
  console.log('req.body.room.toUpperCase(): ', req.body.room.toUpperCase());
  const found = games.filter(game => game.room === req.body.room.toUpperCase())
  res.status(200).send(!(games.length === 0 || found.length === 0))
})

module.exports = router