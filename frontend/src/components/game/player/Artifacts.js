import React from 'react'
import ArtifactQuestCard from '../ArtifactQuestCard'

const Artifacts = ({ artifacts }) => {
  return (
    <div className="flex flex-col font-semibold p-1 text-center text-sm">
      <p className={`${artifacts.length !== 0} && 'mb-1'`}>Artifacts</p>
      { artifacts.length !== 0 && artifacts.map(({ value }, index) => <ArtifactQuestCard key={index} value={ value }/>) }
    </div>
  )
}

export default Artifacts