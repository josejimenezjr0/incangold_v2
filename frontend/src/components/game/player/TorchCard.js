import React, { useContext } from 'react'
import { GameContext } from '../../../App'
import { actionGenerators } from '../../../redux'
import axios from 'axios'

const TorchCard = () => {
  const { state, dispatch } = useContext(GameContext)
  const { choice, choiceMade, playerUuid } = state

  /**
   * Change between Torch or Camp selection
   */
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////// should be moved and should probably be combined with playerChoice
  const toggleChoice = async () => {
    if(choiceMade) {
      try {
        const res = await axios.put(`http://localhost:4001/players/${playerUuid}`, { action: 'toggleChoice' })
        console.log('res.data: ', res.data);
        dispatch(actionGenerators.updateSave(res.data))
      } catch (error) {
        console.log(error)
      }
    }
    dispatch(actionGenerators.updateSave({ choice: choice === 'Torch' ? 'Camp' : 'Torch' }))
  }

  return (
    <button 
      type="button" 
      name="torch" 
      onClick={ toggleChoice } 
      className={`${ choice === 'Torch' ? 'bg-green-300' : 'bg-purple-200' } ${ choiceMade ? 'border-2 border-green-300' : 'border-2 border-gray-600' } text-gray-900 tracking-wide font-bold py-1 mr-1 w-16 rounded focus:outline-none`}
    >
      { choice === 'Torch' ? 'Torch' : 'Camp'}
    </button>)
}

export default TorchCard