import React from 'react'

const ZERO = 'zero'
const WAIT = 'wait'
const REVEAL = 'reveal'
const FLIP = 'flip'
const CAMP = 'camp'
const HAZARD = 'hazard'

const QuestCard = ({ children, questCycle, round }) => {
  const hide = 'hidden'
  const waiting = 'bg-yellow-400'
  const choices = 'bg-blue-800'
  const flipQuest = 'bg-orange-500'
  const camp = 'bg-yellow-400 p-4'
  const hazard = 'bg-red-800 p-4'

  const cycle = {
    [ZERO]: hide,
    [WAIT]: waiting,
    [REVEAL]: choices,
    [FLIP]: flipQuest,
    [CAMP]: camp,
    [HAZARD]: hazard
  }

  return (
    <div className={`font-semibold text-sm ${round ? '' : 'mb-4 p-1 mt-1'} rounded-lg ${cycle[questCycle]}`}>
      { children }
    </div>
  )
}

export default QuestCard