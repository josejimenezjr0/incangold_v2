import React, { useContext } from 'react'
import { GameContext } from '../../../App'
import QuestCard from './QuestCard'
import HazardQuestCard from './HazardQuestCard'
import TreasureQuestCard from '../TreasureQuestCard'
import ArtifactQuestCard from '../ArtifactQuestCard'
import TopQuestCard from './TopQuestCard'
import Tent from '../player/Tent'

const components = {
  HazardQuestCard,
  TreasureQuestCard,
  ArtifactQuestCard
}

const QuestBoard = () => {
  const { state: { quest, spare } } = useContext(GameContext)
  
  const cards = quest.sort((a,b) => a.questOrder < b.questOrder ? 1 : -1).map((card, index) => {
    const Component = components[card.type]

    return(
      <QuestCard key={ index } >
        <Component card={ card } />
      </QuestCard>
    )
  })
  return (
    <div className={ `flex flex-col items-center w-full text-center pt-4` }>
      <div>
        {
          spare !== 0 &&
          <div className="flex justify-center items-center">
            <div className="flex flex-col items-center">
              <p>Spare</p>
              <Tent score={ spare } isSpare={ true }/>
            </div>
          </div>
        }
      </div>
      <div className="flex flex-col items-center w-full overflow-y-auto">
        { cards }
      </div>
    </div>
  )
}

export default QuestBoard