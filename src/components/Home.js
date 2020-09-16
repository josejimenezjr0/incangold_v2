import React, { useEffect } from 'react'
import { Link, useHistory } from 'react-router-dom'
import db from '../db'

const Home = () => {
  const history = useHistory()
  const checkDB = async () => {
    try {
      const storedUuid = await db.table('uuid').toArray()
      const storedGame = await db.table('game').toArray()
      if(storedUuid[0] && storedGame[0]) {
        history.push({ pathname:'/lobby', state: { uuid: storedUuid[0].uuid, game: storedGame[0]} })
      } else {
      }
    } catch (error) {
    } 
  }

  useEffect(() => {
    checkDB()
  }, [])

  return (
    <div>
      <div className="flex justify-around">
        <Link to="/new">New</Link>
        <Link to="/join">Join</Link>
      </div>
    </div>
  )
}

export default Home