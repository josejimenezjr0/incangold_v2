import React, { useState, useEffect, useContext } from 'react'
import { Link, useHistory } from 'react-router-dom'
import { db2 } from '../db'
import { GameContext } from '../App'
import { actionGenerators } from '../redux'
// import OpponentsList from './game/opponents/OpponentsList'
// import LobbyWait from './game/opponents/LobbyWait'

// const Nav = ({ show, navGame }) => {
const Nav = () => {
  const { state, dispatch } = useContext(GameContext)
  const history = useHistory()
  const [open, setOpen] = useState(false)

  const handleEscape = e => {
    if(e.key === 'Esc' || e.key === 'Escape') {
      setOpen(false)
    }
  }

  // const clearGame = async () => {
  //   console.log('inside Nav cleargame');
  //   const clearGame = await db.game.clear()
  //   console.log('clearGame: ', clearGame);
  //   const clearUuid = db.uuid.clear()
  //   console.log('clearUuid: ', clearUuid);
  //   const clearPlayer = db.player.clear()
  //   console.log('clearPlayer: ', clearPlayer);
  //   history.push('/')
  // }

  const clearGame = async () => {
    try {
      console.log('Nav cleargame');
      history.push('/')
      dispatch(actionGenerators.resetGame())
    } catch (error) {
      console.log('error: ', error);
    }
  }

  useEffect(()=> {
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  // const gamePlayers = navGame.players.map((player, ind) =>(<OpponentsList key={ ind } player={ player } questCycle={ navGame.questCycle } onePlayer={ navGame.onePlayer }/>))

  return (
    <nav className="fixed w-full z-10">
      <div className="relative bg-gray-600 items-center justify-between">
        <div className=" flex items-center justify-between px-4 py-2">
          <Link to="/" className="text-white text-sm font-semibold uppercase tracking-wide hover:text-gray-400 focus:outline-none" onClick={ clearGame }>Incan Gold</Link>
          <button type="button" onClick={() => setOpen(!open)} className={` relative block text-gray-400 hover:text-white focus:text-white focus:outline-none z-20`}>
          {/* <button type="button" onClick={() => setOpen(!open)} className={`${navGame.players.length === 0 && 'hidden'} relative block text-gray-400 hover:text-white focus:text-white focus:outline-none z-20`}> */}
            <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
              { open && <path fillRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z"/> }
              { !open && 
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg> }
            </svg>
          </button>
          { open && <button type="button" onClick={() => setOpen(!open)} className="fixed inset-0 h-full w-full bg-black opacity-25 cursor-default z-10"></button> }
        </div>
        <div className={`absolute right-0 ${open ? 'block' : 'hidden'} bg-gray-600 px-2 pt-2 pb-4 rounded-b-lg z-20`}>
          {/* <LobbyWait players={ navGame.players } size={ navGame.size } /> */}
        </div>
      </div>
    </nav>
  )
}

export default Nav