import React, { useReducer, createContext } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Nav from './components/Nav'
import Home from './components/Home'
import Admin from './components/Admin'
import Lobby from './components/Lobby'
import { reducer, initialState, reducerAsyncMiddleware} from './redux'

export const GameContext = createContext()

const App = () => {
  const [state, dispatch] = useReducer(reducer, initialState)

  return (
    <GameContext.Provider value={ { state, dispatch: reducerAsyncMiddleware(dispatch) } }>
      <Router>
        <Nav />
        <Switch>
          <Route path="/" exact component={ Home } />
          <Route path="/admin" component={ Admin } />
          <Route path="/lobby" component={ Lobby } />
        </Switch>
      </Router>
    </GameContext.Provider>
  )
}

export default App