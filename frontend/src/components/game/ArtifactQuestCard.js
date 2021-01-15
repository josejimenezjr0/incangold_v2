import React from 'react'
import ObsidianTreasurePiece from './ObsidianTreasurePiece'
import GoldTreasurePiece from './GoldTreasurePiece'

const ArtifactQuestCard = ({ card }) => {
  const artifact = <svg className="text-blue-500 w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M20.4 9.2L22 5c0-1.7-1.3-3-3-3H5C3.3 2 2 3.3 2 5l1.3 3.6c-.8.6-1.3 1.5-1.3 2.6V22h20V12c0-1.1-.6-2.1-1.6-2.8zM4 12v-.8c0-1 1.5-1.8 2.8-1.4l1 .3.3-1C8.3 8.5 9.1 8 10 8c.7 0 1.4.3 1.7.8l.5.6.8-.3c1.2-.6 2.7 0 3 .9l.3 1 1-.3c1.2-.5 2.7.3 2.7 1.3H4zm9 3c0 .6-.4 1-1 1s-1-.4-1-1 .4-1 1-1 1 .4 1 1zm7.2-10l-1.5 3.6c-.2 0-.5-.1-.7-.1h-.6c-.7-1-2-1.7-3.4-1.7-.4 0-.8.1-1.2.2-.7-.6-1.7-1-2.8-1-1.4 0-2.7.7-3.4 1.7H6c-.4 0-.7.1-1.1.1L3.8 5h16.4zM6 20c0-1.1-.9-2-2-2v-4h5v2c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-2h5v4c-1.1 0-2 .9-2 2H6z"/>
                  </svg>
  
  return (
    <div className='flex items-center bg-yellow-500 font-bold m-1 p-1'>
      { 
        card.value === 5 ?
          <ObsidianTreasurePiece />
          :
          <GoldTreasurePiece />
      }
      { artifact }
    </div>
  )
}

export default ArtifactQuestCard