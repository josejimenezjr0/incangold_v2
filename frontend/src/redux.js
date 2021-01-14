import { db2 } from './db'

const ZERO = 'zero'
const TORCH = 'Torch'

const actionList = [
  'MAKE_JOIN',
  'LOAD_GAME',
  'PLAYER_UUID',
  'UPDATE_SAVE',
  'RESET_GAME',
  'DB_SAVE'
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
    opponents: [],
    questCycle: ZERO,
    round: 0,
    quest: [],
    deck: [],
    host: false,
    totalScore: 0,
    roundScore: 0,
    playerArtifacts: [],
    leftRound: false,
    choiceMade: false,
    choice: TORCH
  }
const actions = actionList.reduce((list, action) => ({ ...list, [action]: action }), {})

export const actionGenerators = {
  makeJoin: makeJoinInfo => ({ type: actions.MAKE_JOIN, payload: makeJoinInfo }),
  loadGame: () => ({ type: actions.LOAD_GAME }),
  playerUuid: uuid => ({ type: actions.PLAYER_UUID, payload: uuid }),
  updateSave: update => ({ type: actions.UPDATE_SAVE, payload: update }),
  resetGame: () => ({ type: actions.RESET_GAME }),
  dbSave: update => ({ type: actions.DB_SAVE, payload: update }),
}


const handlers = {
  [actions.MAKE_JOIN]: (state, { payload }) => ({ ...state, ...payload }),
  [actions.LOAD_GAME]: (state, { payload }) => ({ ...state, ...payload, refresh: false, checkSave: true }),
  [actions.PLAYER_UUID]: (state, { payload }) => ({ ...state, playerUuid: payload }),
  [actions.UPDATE_SAVE]: (state, { dispatch, payload }) => {
    const { opponents, ...restPayload } = payload
    if(opponents && state.opponents.length !== 0) {
      const opponentsMerge = [...state.opponents, ...opponents].reduce((acc, cur) => {
        if(acc[cur.playerUuid]) {
          return { ...acc, [cur.playerUuid]: { ...acc[cur.playerUuid], ...cur } }
        } else return { ...acc, [cur.playerUuid]: cur }
      }, {})
      // console.log('opponentsMerge: ', opponentsMerge);

      const opponentsUpdate = Object.entries(opponentsMerge).map(([_, value]) => value)

      // console.log('UPDATE_SAVE - opponentsUpdate: ', opponentsUpdate);
      const finalUpdate = { ...state, ...restPayload, opponents: opponentsUpdate }
      console.log('UPDATE_SAVE - finalUpdate: ', finalUpdate);
      asyncHandlers.DB_SAVE(finalUpdate)
      return finalUpdate
    }
    const defaultFinalUpdate = { ...state, ...payload }
    console.log('defaultFinalUpdate: ', defaultFinalUpdate);
    asyncHandlers.DB_SAVE(defaultFinalUpdate)
    return defaultFinalUpdate
  },
  [actions.RESET_GAME]: () => initialState,
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
  // [actions.UPDATE_SAVE]: async (action, dispatch) => {
  //   console.log('async UPDATE_SAVE');
  //   // await db2.localSave.update(1, action.payload)
  //   const updatedAction = { ...action, dispatch }
  //   console.log('async UPDATE_SAVE - updatedAction: ', updatedAction);
  //   return dispatch(updatedAction)
  // },
  [actions.RESET_GAME]: async (action, dispatch) => {
    await db2.localSave.clear()
    return dispatch(action)
  },
  [actions.DB_SAVE]: async (payload) => {
    console.log('async DB_SAVE - payload: ', payload);
    await db2.localSave.update(1, payload)
    return
  },
}

export const reducerAsyncMiddleware = dispatch => {
  return action => {
    console.log('reducerAsyncMiddleware - action: ', action);
    return asyncHandlers.hasOwnProperty(action.type) ? asyncHandlers[action.type](action, dispatch) : dispatch(action)
  }
}

export const reducer = (state = initialState, action) => {
  console.log('reducer - action: ', action);
  return handlers.hasOwnProperty(action.type) ? handlers[action.type](state, action) : state
}