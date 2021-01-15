import React, { useContext } from 'react'
import { GameContext } from '../../../App'
import axios from 'axios'

const ZERO = 'Zero'
const LEFT = 'Left'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'
const CAMP = 'Camp'
const HAZARD = 'Hazard'

const TopQuestCard = () => {
  const { state } = useContext(GameContext)
  const { questCycle, leftRound, playerUuid, round } = state

  const gameAction = async () => {
    try {
      await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: questCycle === FLIP ? 'startTurn' : 'revealChoices' })
    } catch (error) {
      console.log('error: ', error);
    }
  }
  
  const camp = <div className="bg-yellow-400 font-bold p-2">Left to camp!</div>
  const zero = <div className="bg-yellow-400 p-1"> Get Ready!</div>
  const waiting = <div className="bg-yellow-400 p-1"> Waiting...</div>
  const choices = <button type="button" className="bg-blue-800 text-white font-bold p-2 animate-pulse" onClick={ gameAction }>REVEAL!</button>
  const flipQuest = <button type="button" className="bg-green-500 font-bold p-2 animate-pulse" onClick={ gameAction }>?QUEST?</button>
  const allCamp = <div className="bg-yellow-400 font-bold p-2">All Camp!!!</div>
  const hazard = <div className="bg-red-800 text-white font-bold p-2">HAZARDS!!!</div>

  const cycle = (questCycle === CAMP) || (questCycle === HAZARD) ? 
    questCycle 
    : 
    round === 0 ? 
      'Zero' 
      : 
      leftRound ?
        'Left' 
        :
        questCycle

  const stages = {
    [ZERO]: zero,
    [LEFT]: camp,
    [WAIT]: waiting,
    [REVEAL]: choices,
    [FLIP]: flipQuest,
    [CAMP]: allCamp,
    [HAZARD]: hazard
  }

  return (
    <div className="text-center font-bold">
      { stages[cycle] }
    </div>)
}

export default TopQuestCard