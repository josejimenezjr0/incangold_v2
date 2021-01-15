import React, { useContext } from 'react'
import Round from './Round'
import Tent from './Tent'
import ChoiceBoard from './ChoiceBoard'
import Artifacts from './Artifacts'
import { GameContext } from '../../../App'

const PlayerBoard = () => {
  const { state } = useContext(GameContext)
  const { roundScore, playerArtifacts, totalScore } = state
  return (
    <div className="flex flex-col w-1/2 justify-between bg-blue-100 rounded-lg py-1 mt-2">
      <div className="flex justify-center w-full h-full pt-4">
        <div className="flex flex-col w-full px-2 mt-1">
          <div className="bg-gray-200 rounded-lg mx-auto p-1 mb-6 h-20 w-20">
            <Round score={ roundScore }/> 
          </div>
          <div className="bg-purple-200 rounded-lg mx-auto p-1 mb-6 h-20 w-20">
            <Artifacts artifacts={ playerArtifacts } />
          </div>
          <div className="bg-green-200 rounded-lg mx-auto p-1 mb-6 h-20 w-20">
            <Tent score={ totalScore }/>
          </div>
        </div>
      </div>
      <ChoiceBoard />
    </div>
  )
}

export default PlayerBoard