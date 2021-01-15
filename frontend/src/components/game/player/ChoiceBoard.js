import React, { useContext } from 'react'
import TorchCard from './TorchCard'
import { GameContext } from '../../../App'
import { actionGenerators } from '../../../redux'
import axios from 'axios'

const WAIT = 'wait'

const ChoiceBoard = () => {
  const { state, dispatch } = useContext(GameContext)
  const { leftRound, questCycle, onePlayer, choice, choiceMade, playerUuid } = state

  const playerChoice = async () => {
    if(choiceMade === true) return
    try {
      if(onePlayer) {
        try {
          await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'revealChoices', update: { choice, playerUuid } })
        } catch (error) {
          console.log('error: ', error);
        }
      } else {
        const res = await axios.put(`http://localhost:4001/players/${playerUuid}`, { action: 'playerChoice', update: { choice } })
        console.log('res.data: ', res.data);
        dispatch(actionGenerators.updateSave(res.data))
      }
    } catch (error) {
      console.log(error)
    }
  }

  const active = !leftRound && questCycle === WAIT

  return (
    <div className={`${ active ? '' : 'hidden'} flex justify-center items-center w-full `}>
      <div className="flex bg-gray-600 rounded-lg justify-center items-center mx-auto">
        <TorchCard />
        <div className={`bg-gray-600 rounded-full ml-1 ${ !choiceMade && 'animate-pulse' }`} onClick={ playerChoice }>
          { choiceMade ?
            <svg className="text-green-300 text-xl w-8 h-8 p-1 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            :
            <svg className={`text-xl fill-current w-8 h-8 p-1 ${ !choiceMade && 'text-yellow-300' }`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>}
        </div>
      </div>
    </div>
  )
}

export default ChoiceBoard