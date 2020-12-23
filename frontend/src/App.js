import React, { useEffect, useReducer, createContext, useState } from 'react'
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './components/Home'
import Admin from './components/Admin'
import Lobby from './components/Lobby'
import { db2 } from './db'
import { reducer, initialState, reducerAsyncMiddleware } from './redux'

export const GameContext = createContext()

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { savedGame } = state
  /**
   * checks local dexieDB for a saved game and redirects to Lobby componenet if there is a saved game
   */
  const checkDB = async () => {
    try {
      const localSave = await db2.localSave.toArray()
      if(localSave[0]) {
        console.log('localSave: ', localSave);
      } else {
        console.log('No localSave in db2');
      }
    } catch (error) {
      console.log('error: ', error);
    }
  }

  useEffect(() => {
    checkDB()
  }, [state])

  return (
    <GameContext.Provider value={ { state, dispatch: reducerAsyncMiddleware(dispatch) } }>
      <Router>
        <Nav />
        <Switch>
          { savedGame ? <Redirect to="/Lobby" /> : null }
          <Route path="/" exact component={ Home } />
          <Route path="/admin" component={ Admin } />
          <Route path="/lobby" component={ Lobby } />
        </Switch>
      </Router>
    </GameContext.Provider>
  )
}

export default App