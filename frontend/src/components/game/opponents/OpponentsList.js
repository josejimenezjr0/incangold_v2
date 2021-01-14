import React, { useContext } from 'react'
import OpponentBoard from './OpponentBoard'
import Round from '../player/Round'
import { GameContext } from '../../../App'

const OpponentsList = ({ player }) => {
  const { state: { round } } = useContext(GameContext)
  return (
    <div className={`text-center p-2 ${ player.online ? '' : 'bg-red-600'}`}>
      <div className={`py-1 px-2 font-bold ${ player.choiceMade ? 'bg-green-400 font-bold' : 'bg-yellow-400'}`}>
        { round === 0 ? `${player.name} has joined!` : player.name }
      </div>
      {
        round !== 0 &&
        <div className="flex flex-col justify-center">
          <OpponentBoard player={ player } />
        { player.online ? <Round score={ player.roundScore } artifacts={ player.playerArtifacts}/> : <div className="text-xl transform rotate-90">:(</div> }
      </div>
      }
    </div>
  )
}

export default OpponentsList