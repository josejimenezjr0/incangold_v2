import React from 'react'

const OpponentChoice = ({ choice }) => {
  const torch = String(choice).toLowerCase() === 'torch'
  return (
    <div className={`mx-2 font-bold text-xl p-4 border-4 border-yellow-300 ${ torch ? 'bg-blue-300' : 'bg-purple-500' }`}>
      { torch ? 'TORCH' : 'CAMP' }
    </div>)
}

export default OpponentChoice