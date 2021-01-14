import React, { useState, useEffect, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import io from '../Socket'
import axios from 'axios'
import CenterBoard from './game/center/CenterBoard'
import TempleBoard from './game/center/TempleBoard'
import PlayerBoard from './game/player/PlayerBoard'
import OpponentsList from './game/opponents/OpponentsList'
import { GameContext } from '../App'
import { actionGenerators } from '../redux'

const Lobby = () => {
  const { state, dispatch } = useContext(GameContext)
  const { choiceMade, playerUuid, choice, opponents, size, round, questCycle, onePlayer } = state
  const history = useHistory()

  useEffect(() => {
    console.log(' check refresh state: ', state);
    if (state.refresh) {
      console.log('redirecting');
      history.push('/')
      return
    }
  }, [])

  const [open, setOpen] = useState(true)

  const testUpdatePlayer = update => {
    console.log('lobby testUpdatePlayer: ', update);
    dispatch(actionGenerators.updateSave(update))
  }

  const disconnectSocket = () => io.disconnect()

  
  /**
   * Try to load any saved data. SocketIO startup functions with saved data. Also clear any saved game state in socketIO
   */
  useEffect(() => {
    if (!state.refresh) {
      console.log('starting io');
      io.playerInit(state.init, state.playerUuid)
      io.testPlayerUpdate(testPlayerUpdate => testUpdatePlayer(testPlayerUpdate))
      return () => io.disconnect()
    }
  }, [])

  /**
   * Set flag for player having made a choice yet or not for Torch(stay) or Camp(leave)
   */

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved
  const playerChoice = async () => {
    if(choiceMade === true) return
    // testUpdatePlayer({ choiceMade: true })
    try {
      const res = await axios.put(`http://localhost:4001/players/${playerUuid}`, { action: 'playerChoice', update: { choice } })
      console.log('res.data: ', res.data);
      dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }

    /**
   * Change between Torch or Camp selection
   */
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with playerChoice
  const toggleChoice = async () => {
    try {
      const res = await axios.put(`http://localhost:4001/players/${playerUuid}`, { action: 'toggleChoice' })
      console.log('res.data: ', res.data);
      dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with turnStart and choicesReveal
  const roundStart = async () => {
    try {
      const res = await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'startRound' })
      console.log('res.data: ', res.data);
      // dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with turnStart and choicesReveal
  const turnStart = async () => {
    try {
      const res = await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'startTurn' })
      console.log('res.data: ', res.data);
      dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with turnStart and choicesReveal
  const choicesReveal = async () => {
    try {
      const res = await axios.put(`http://localhost:4001/games/${playerUuid}`, { action: 'revealChoices' })
      console.log('res.data: ', res.data);
      dispatch(actionGenerators.updateSave(res.data))
    } catch (error) {
      console.log(error)
    }
  }

  //determine player list in lobby

  //remove self from player list
  // const otherPlayers = lobby.players.filter(player => player.uuid !== uuid)
  //make Opponent list
  // const gamePlayers = otherPlayers.map((player, ind) => {
  const gamePlayers = opponents.map((player, ind) => {
    return (
      <OpponentsList 
        key={ ind }
        player={ player }
      />)
    })

  //check if all expected players are in the lobby
  ///////////
  //May need to fix for players dropping but coming back in
  //Possibly check if game has started and not rely on sizeWait if so
  ///////////
  const sizeWait = opponents.length === size - 1
  const currentState = Object.entries(state).map(([key, value]) => <li key={key}>{`${key}: ${JSON.stringify(value)}`}</li>)

  return (
    <div className="flex justify-center h-screen sm:h-auto">
      <div className="w-full max-w-sm mt-4 h-full sm:h-auto">
        <div className="bg-gray-100 shadow-md rounded px-8 pt-6 pb-8 mb-4 h-full sm:h-auto">
          <div className="flex flex-col pt-2 pb-16 h-full sm:h-auto">
            <div>
              <button type="button" onClick={() => setOpen(!open)}>state</button>
              <ul className={`${open && 'hidden'}`}>
                { currentState }
              </ul>
            </div>
            <button 
              onClick={ disconnectSocket }
              className="bg-gray-600 text-white tracking-wide font-semibold py-1 px-2 ml-2 rounded"
            >
              disconnect
            </button>
            {/* Hide game if not all players are present. reference sizeWait comment above for possible change */}
            <div className={`${sizeWait && 'hidden'} flex justify-between items-center bg-blue-200 text-gray-900 rounded-lg mt-2 px-4`}>
              <div className="flex p-2 items-center justify-center">
                {/* show game code for other players to join */}
                Room: <span className="bg-gray-600 text-white tracking-wide font-semibold py-1 px-2 ml-2 rounded">{ state.room }</span>
              </div>
              {/* <div className="font-semibold underline">{ `Players (${lobby.players.length}/${lobby.size})`}</div> */}
              <div className="font-semibold underline">{ `Players (${opponents.length + 1}/${size})`}</div>
            </div>
            <div>
              { gamePlayers }
            </div>
            {/* Temple layout for round progress */}
            <TempleBoard
              roundStart={ roundStart } 
              round={ round } 
              questCycle={ questCycle } 
              sizeWait={ sizeWait }
            />
            <div className="flex h-full">
              {/* Player section with score progress and hidden score in Tent component */}
              <PlayerBoard 
                playerChoice={ playerChoice }
                toggleChoice={ toggleChoice }
                questCycle={ questCycle }
                onePlayer={ onePlayer }
              />
              {/* Turn progress section with current turn cards and treasures */}
              <CenterBoard
                choicesReveal={ choicesReveal }
                turnStart={ turnStart }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Lobby