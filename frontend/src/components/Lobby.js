import React, { useEffect, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import io from '../Socket'
import CenterBoard from './game/center/CenterBoard'
import TempleBoard from './game/center/TempleBoard'
import PlayerBoard from './game/player/PlayerBoard'
import OpponentsList from './game/opponents/OpponentsList'
import { GameContext } from '../App'
import { actionGenerators } from '../redux'

const Lobby = () => {
  const { state, dispatch } = useContext(GameContext)
  const { opponents, size, refresh, playerUuid, room } = state
  const history = useHistory()

  useEffect(() => {
    if(refresh || room === '') {
      history.push('/')
    } else {
      io.init(playerUuid)
      io.gameUpdate(update => updateGame(update))
      return () => io.disconnect()
    }
  }, [])

  const updateGame = update => {
    dispatch(actionGenerators.updateSave(update))
  }

  const gamePlayers = opponents.map((player, ind) => {
    return (
      <OpponentsList 
        key={ ind }
        player={ player }
      />)
    })

  return (
    <div className="flex justify-center h-screen sm:h-auto">
      <div className="w-full max-w-sm mt-4 h-full sm:h-auto">
        <div className="bg-gray-100 shadow-md rounded px-8 pt-6 pb-8 mb-4 h-full sm:h-auto">
          <div className="flex flex-col pt-2 pb-16 h-full sm:h-auto">
            <div className={`${opponents.length === size - 1 && 'hidden'} flex justify-between items-center bg-blue-200 text-gray-900 rounded-lg mt-2 px-4`}>
              <div className="flex p-2 items-center justify-center">
                Room: <span className="bg-gray-600 text-white tracking-wide font-semibold py-1 px-2 ml-2 rounded">
                  { room }
                </span>
              </div>
              <div className="font-semibold underline">
                { `Players (${opponents.length + 1}/${size})`}
              </div>
            </div>
            <div>
              { gamePlayers }
            </div>
            <TempleBoard />
            <div className="flex h-full">
              <PlayerBoard />
              <CenterBoard/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Lobby