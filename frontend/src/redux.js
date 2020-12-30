import { db2 } from './db'

const ZERO = 'zero'
const TORCH = 'Torch'

const actionList = [
  'MAKE_JOIN',
  'LOAD_GAME',
  'PLAYER_UUID',
  'UPDATE_SAVE',
  'RESET_GAME'
]

export const initialState = 
  { 
    id: 1,
    room: '',
    size: null,
    init: true,
    refresh: true,
    checkSave: false,
    join: false,
    name: '',
    playerUuid: '',
    players: [],
    questCycle: ZERO,
    round: 0,
    quest: [],
    deck: [],
    host: false,
    totalScore: 0,
    roundScore: 0,
    playerArtifacts: [],
    choiceMade: false,
    choice: TORCH
  }
const actions = actionList.reduce((list, action) => ({ ...list, [action]: action }), {})

export const actionGenerators = {
  makeJoin: makeJoinInfo => ({ type: actions.MAKE_JOIN, payload: makeJoinInfo }),
  loadGame: () => ({ type: actions.LOAD_GAME }),
  playerUuid: uuid => ({ type: actions.PLAYER_UUID, payload: uuid }),
  updateSave: update => ({ type: actions.UPDATE_SAVE, payload: update }),
  resetGame: () => ({ type: actions.RESET_GAME })
}


const handlers = {
  [actions.MAKE_JOIN]: (state, { payload }) => ({ ...state, ...payload }),
  [actions.LOAD_GAME]: (state, { payload }) => ({ ...state, ...payload, refresh: false, checkSave: true }),
  [actions.PLAYER_UUID]: (state, { payload }) => ({ ...state, playerUuid: payload }),
  [actions.UPDATE_SAVE]: (state, { payload }) => ({ ...state, ...payload }),
  [actions.RESET_GAME]: () => initialState
}

const asyncHandlers = {
  [actions.MAKE_JOIN]: async (action, dispatch) => {
    try {
      await db2.localSave.add(action.payload)
      return dispatch(action)
    } catch (error) {
      console.log('error: ', error);
    }
  },
  [actions.LOAD_GAME]: async ({ type }, dispatch) => {
    try {
      const savedGame = await db2.localSave.get(1)
      if(savedGame) {
        console.log('found Save Data');
        const action = { type, payload: savedGame }
        return dispatch(action)
      } else {
        console.log('No saved data');
        const action = { type, payload: {} }
        return dispatch(action)
      }
    } catch (error) {
      console.log('error: ', error);
    }
  },
  [actions.PLAYER_UUID]: async (action, dispatch) => {
    await db2.localSave.update(1, { playerUuid: action.payload })
    return dispatch(action)
  },
  [actions.UPDATE_SAVE]: async (action, dispatch) => {
    await db2.localSave.update(1, action.payload)
    return dispatch(action)
  },
  [actions.RESET_GAME]: async (action, dispatch) => {
    await db2.localSave.clear()
    return dispatch(action)
  }
}

export const reducerAsyncMiddleware = dispatch => {
  return action => {
    return asyncHandlers.hasOwnProperty(action.type) ? asyncHandlers[action.type](action, dispatch) : dispatch(action)
  }
}

export const reducer = (state = initialState, action) => {
  return handlers.hasOwnProperty(action.type) ? handlers[action.type](state, action) : state
}