import React, { useContext } from 'react'
import { GameContext } from '../../../App'
import axios from 'axios'

const CAMP = 'Camp'
const HAZARD = 'Hazard'

const TempleCard = ({ position }) => {
  const { state } = useContext(GameContext)
  const { round, questCycle, opponents, size, playerUuid } = state

  const roundStart = async () => {
    try {
      await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'startRound' })
    } catch (error) {
      console.log('error: ', error);
    }
  }

  const sizeWait = opponents.length + 1 === size
  const flipped = round >= position
  const nextRound = round + 1 === position  

  const activate = (nextRound && sizeWait && round === 0) || (nextRound && ((questCycle === CAMP) || (questCycle === HAZARD)))

  return (
    flipped ?
    <div className="border-2 border-yellow-300 bg-green-900 text-white text-sm p-1 font-semibold rounded">
      {`TEMPLE ${ position }`}
    </div>
    :
    <button type="button" disabled={ !activate } className={`${ activate ? 'animate-pulse' : 'opacity-50'} border-2 border-blue-100 bg-green-900 text-white text-sm p-1 font-semibold rounded`} onClick={ roundStart }>
      {`TEMPLE ${ position }`}
    </button>
  )
}

export default TempleCard