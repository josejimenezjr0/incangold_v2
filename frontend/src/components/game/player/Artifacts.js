import React from 'react'
import ArtifactQuestCard from '../ArtifactQuestCard'

const Artifacts = ({ artifacts }) => {
  console.log('artifacts: ', artifacts);
  return (
    <div className="flex flex-col font-semibold p-1 text-center text-sm">
      <p className={`${artifacts.length !== 0} && 'mb-1'`}>Artifacts</p>
      <div className="flex justify-center">
        { artifacts.length !== 0 && artifacts.map((card, index) => <ArtifactQuestCard key={index} card={ card }/>) }
      </div>
    </div>
  )
}

export default Artifacts