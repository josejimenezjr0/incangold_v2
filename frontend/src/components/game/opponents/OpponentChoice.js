import React from 'react'

const OpponentChoice = ({ choice, leftRound }) => {
  const torch = String(choice).toLowerCase() === 'torch'
  return (
    <div className={`mx-2 font-bold text-xl p-4 border-4 border-yellow-300 ${ torch && !leftRound ? 'bg-blue-300' : 'bg-purple-500' }`}>
      { torch && !leftRound ? 'TORCH' : 'CAMP' }
    </div>)
}

export default OpponentChoice