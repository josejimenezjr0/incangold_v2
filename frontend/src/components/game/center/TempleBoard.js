import React from 'react'
import TempleCard from './TempleCard'

const TempleBoard = () => {

  return (
    <div className="flex flex-col justify-center mx-auto">
      <div className="flex-col p-1">
        <div className="flex justify-center items-center">
          <TempleCard position={ 5 } />
        </div>
        <div className="flex justify-center items-center">
          <TempleCard position={ 3 } />
          <TempleCard position={ 4 } />
        </div>
        <div className="flex justify-center items-center">
          <TempleCard position={ 1 } />
          <TempleCard position={ 2 } />
        </div>
      </div>
    </div>
  )
}

export default TempleBoard