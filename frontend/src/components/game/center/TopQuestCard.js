import React, { useContext } from 'react'
import { GameContext } from '../../../App'
import axios from 'axios'

const ZERO = 'zero'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'
const CAMP = 'camp'
const HAZARD = 'hazard'

const TopQuestCard = () => {
  const { state } = useContext(GameContext)
  const { questCycle, onePlayer, choice, leftRound, playerUuid } = state

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with turnStart and choicesReveal
  const turnStart = async () => {
    try {
      const res = await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'startTurn' })
      console.log('res.data: ', res.data);
      // dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with turnStart and choicesReveal
  const choicesReveal = async () => {
    try {
      const res = await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'revealChoices' })
      console.log('res.data: ', res.data);
      // dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }
  
  const zero = <div className="bg-yellow-400 p-1"> Get Ready!</div>
  const waiting = <div className="bg-yellow-400 p-1"> Waiting...</div>
  const choices = <button type="button" className="bg-blue-800 text-white font-bold p-2 animate-pulse" onClick={ choicesReveal }>REVEAL!</button>
  const flipQuest = <button type="button" className="bg-green-500 font-bold p-2 animate-pulse" onClick={ onePlayer && !choice ? choicesReveal : turnStart }>{`${onePlayer && !choice ? 'Leave?' : '?QUEST?'}`}</button>
  const camp = <div className="bg-yellow-400 font-bold p-2">All Camp</div>
  const hazard = <div className="bg-red-800 text-white font-bold p-2">HAZARDS!!!</div>

  const left = leftRound && (questCycle !== CAMP && questCycle !== HAZARD)

  const cycle = {
    [ZERO]: zero,
    [WAIT]: waiting,
    [REVEAL]: choices,
    [FLIP]: flipQuest,
    [CAMP]: camp,
    [HAZARD]: hazard
  }

  return (
    <div>
      { left ?
      <div className="bg-yellow-400 font-bold p-2">Left to camp!</div>
      :
      cycle[questCycle] }
    </div>
    
  )
}

export default TopQuestCard