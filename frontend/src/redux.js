import { db2 } from './db'

const actionList = [
  'MAKE_JOIN',
  'LOAD_GAME'
]

export const initialState = { makeJoinInfo: 'empty', savedGame: null }
const actions = actionList.reduce((list, action) => ({ ...list, [action]: action }), {})

export const actionGenerators = {
  // reduxMakeGame: async reduxGame => {
  //   await await db2.savedData.put(reduxGame)
  //   return { type: actions.REDUX_MAKE_GAME, payload: reduxGame }
  // }
  makeJoin: async makeJoinInfo => {
    await db2.init.add(makeJoinInfo)
    return { type: actions.MAKE_JOIN, payload: makeJoinInfo }
  },
  loadGame: savedGame => ({ type: actions.LOAD_GAME, payload: savedGame })
}

const handlers = {
  [actions.MAKE_JOIN]: (state, { payload }) => ({ ...state, makeJoinInfo: payload }),
  [actions.LOAD_GAME]: (state, { payload }) => ({ ...state, savedGame: payload })
}

export const reducer = (state = initialState, action) => handlers.hasOwnProperty(action.type) ? handlers[action.type](state, action) : state