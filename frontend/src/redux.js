import { db2 } from './db'

const actionList = [
  'MAKE_JOIN',
  'LOAD_GAME',
  'PLAYER_UUID',
]

export const initialState = 
  { 
    id: 1,
    code: '',
    size: null,
    init: true,
    join: false,
    name: '',
    playerUuid: '',
    savedGame: null
  }
const actions = actionList.reduce((list, action) => ({ ...list, [action]: action }), {})

export const actionGenerators = {
  makeJoin: makeJoinInfo => ({ type: actions.MAKE_JOIN, payload: makeJoinInfo }),
  loadGame: savedGame => ({ type: actions.LOAD_GAME, payload: savedGame }),
  playerUuid: uuid => ({ type: actions.PLAYER_UUID, payload: uuid })
}


const handlers = {
  [actions.MAKE_JOIN]: (state, { payload }) => {
    return ({ ...state, ...payload })
    },
  [actions.LOAD_GAME]: (state, { payload }) => ({ ...state, savedGame: payload }),
  [actions.PLAYER_UUID]: (state, { payload }) => ({ ...state, playerUuid: payload }),
}

const asyncHandlers = {
  [actions.MAKE_JOIN]: async (action, dispatch) => {
    await db2.localSave.add(action.payload)
    return dispatch(action)
    },
  [actions.PLAYER_UUID]: async (action, dispatch) => {
    await db2.localSave.update(1, { playerUuid: action.payload })
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