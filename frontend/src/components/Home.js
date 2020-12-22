import React, { useEffect, useState, useContext } from 'react'
import { useHistory } from 'react-router-dom'
import axios from 'axios'
import { db, db2 } from '../db'
import { GameContext } from '../App'
import { actionGenerators } from '../redux'


const Home = () => {
  const { state, dispatch } = useContext(GameContext)
  /**
   * checks local dexieDB for a saved game and redirects to Lobby componenet if there is a saved game
   */
  // const checkDB = async () => {
  //   try {
  //     const storedUuid = await db.table('uuid').toArray()
  //     const storedGame = await db.table('game').toArray()
  //     const storedPlayer = await db.table('player').toArray()
  //     if(storedUuid[0] && storedGame[0] && storedPlayer[0]) {
  //       history.push({ pathname:'/lobby', state: { uuid: storedUuid[0].uuid, player: storedPlayer[0], game: storedGame[0]} })
  //     } else {
  //       console.log('Missing some or all info, starting new');
  //     }
  //   } catch (error) {
  //     console.log('error: ', error);
  //   } 
  // }

  // useEffect(() => {
  //   checkDB()
  // }, [])

  const history = useHistory()
  // const [ game, setGame ] = useState({ name: '', code: '', size: '', init: true, join: false })
  const [ makeJoinInfo, setMakeJoinInfo ] = useState({ name: '', code: '', size: '', init: true, join: false })
  const [joinInfo, setJoinInfo] = useState({ found: true, checking: false })

  /**
   * handle all inputs by setting state based on name and value pairing
   */
  const handleInput = e => {
    const { target: { name, value } } = e
    // setGame(({ ...game, [name]: value }))
    setMakeJoinInfo(prev => ({ ...prev, [name]: value }))
  }

  /**
   * Verifies room is available to join. Sets flag for loading while waiting for room response. Clears checking flag on response
   */
  const checkJoin = async room => {
    setJoinInfo(prev => ({ ...prev, checking: true }))
    try {
      const res = await axios.post('http://localhost:4001/checkjoin', { room })
      setJoinInfo(prev => ({ ...prev, found: res.data, checking: false }))
      // if(res.data) history.push({ pathname: "/lobby", state: { game: game } })
      //////////////////////////////////
      //change to use context/reducer
      //////////////////////////////////
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * Pushed to Lobby component with game passed in state
   */
  const makeGame = async () => {
    dispatch(actionGenerators.makeJoin(makeJoinInfo))
    try {
      const res = await axios.post('http://localhost:4001/makejoin', { makeJoinInfo })
      console.log('res.data: ', res.data);
      setJoinInfo(prev => ({ ...prev, found: res.data, checking: false }))
      dispatch(actionGenerators.newGame(res))
    } catch (error) {
      console.log(error)
    }
  }

  /**
   * handles toggle between New button and Join button. Sets game join state either true or false based on selection
   * Also clears checking state since a new request will be made upon changes
   */
  const toggleJoin = e => {
    //reset any searching for a room UI if the user toggles between making or joining
    setJoinInfo(prev => ({ ...prev, found: true, checking: false }))
    // setGame({ ...game, join: e.target.name === 'join' })
    setMakeJoinInfo(prev => ({ ...prev, join: e.target.name === 'join' }))
  }

  //verify all necessary fields are not empty in order to enable Make or Join button
  const allInfo = makeJoinInfo.join ?
    //if joining instead of making make sure name and code are filled
    makeJoinInfo.name === '' || makeJoinInfo.code === ''
    :
    //otherwise make sure name and number of players is filled. Number of players should only be a number.
    makeJoinInfo.name === '' || isNaN(makeJoinInfo.size) || makeJoinInfo.size <= 1

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xs mt-8">
        <div className="shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="flex justify-around mb-6">
            {/* New button */}
            <div className="mb-4">
              <button
                name="new"
                onClick={ toggleJoin }
                className={`${ !makeJoinInfo.join ? 'bg-blue-400 cursor-default' : 'text-blue-500 hover:bg-blue-200 hover:text-blue-900 focus:shadow-outline'} text-gray-900 tracking-wide font-bold py-2 px-4 rounded focus:outline-none`}
              >
                New
              </button>
            </div>
            {/* Join button */}
            <div className="mb-4">
              <button 
                name="join"
                onClick={ toggleJoin }
                className={`${ makeJoinInfo.join ? 'bg-blue-400 cursor-default' : 'text-blue-500 hover:bg-blue-200 hover:text-blue-900 focus:shadow-outline'} text-gray-900 tracking-wide font-bold py-2 px-4 rounded focus:outline-none`} 
              >
                Join
              </button>
            </div>
          </div>
          <div>
            {/* Name text field */}
            <div className="mb-4">
              <p className="block text-gray-700 font-bold mb-2">Name</p>
              <input
                name="name"
                value={ makeJoinInfo.name }
                onChange={ handleInput }
                type="text" 
                placeholder="enter name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            {/* Number of players(size) or code text field */}
            <div className="mb-4">
              {/* game.join toggles based on new or join buttons */}
              <p className="block text-gray-700 font-bold mb-2">{ makeJoinInfo.join ? 'Code' : 'Players' }</p>
              { 
                makeJoinInfo.join ?
                <input
                  name="code"
                  value={ makeJoinInfo.code }
                  onChange={ handleInput }
                  type="text"
                  placeholder="enter code"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
                :
                <input
                  name="size"
                  value={ makeJoinInfo.size }
                  onChange={ handleInput }
                  type="text"
                  placeholder="3 - 8 players"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                /> 
              }  
            </div>
            <div className="flex items-center justify-center">
            {/* Make or Join buttons are disabled and greyed out if all required fields aren't filled */}
            { 
              makeJoinInfo.join ? 
              <button
                onClick={ () => checkJoin(makeJoinInfo.code) }
                disabled={ allInfo }
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${allInfo && 'opacity-50' }`}
              >
                Join Game!
              </button>
              :
              <button
                onClick={ makeGame }
                disabled={ allInfo }
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${allInfo && 'opacity-50' }`}
              >
                Make Game!
              </button> 
            }  
            </div>
          </div>
        </div>
        {/* Banner for checking on room and if no room found showing error message */}
        <div className="flex items-center justify-center">
          { 
            //room not found error message
            !joinInfo.found && <div className={`bg-red-400 text-gray-900 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}>Game not found.</div>
          }
          {
            //searching banner while checking on room
            joinInfo.checking && <div className={`bg-orange-300 text-gray-900 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline`}>Searching...</div> 
          }
        </div>
      </div>
    </div>
  )
}

export default Home