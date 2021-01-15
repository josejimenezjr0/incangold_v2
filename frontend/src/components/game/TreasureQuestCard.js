import React from 'react'

const TreasureQuestCard = ({ card, endCamp, endHazard }) => {
  const gem =  <svg className="text-green-500 rounded-full fill-current text-xl" width="1em" height="1em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000">
                  <path d="M151.49 103.85c-2.68 1.15-6.89 3.83-9.38 6.13-2.49 2.3-33.13 61.66-68.36 132.13C6.73 376.14 6.54 376.33 12.28 389.55c3.83 8.43 468.57 503.23 475.65 506.1 7.85 3.45 16.28 3.45 24.13 0 7.09-2.87 471.82-497.67 475.65-506.1 5.74-13.21 5.55-13.4-61.47-147.44-35.23-70.47-65.87-129.83-68.36-132.13-2.49-2.3-7.08-4.98-9.96-6.13-7.26-2.87-689.53-2.68-696.43 0zm289.15 59.93c0 1.53-107.42 157.21-108.76 157.59-1.15.38-105.32-151.85-107.23-156.83-.38-.77 48.06-1.53 107.62-1.53 59.54.01 108.37.39 108.37.77zm334.72.77c-1.92 4.98-106.08 157.21-107.23 156.83-1.34-.38-108.76-156.06-108.76-157.59 0-.38 48.83-.77 108.38-.77s107.99.76 107.61 1.53zM555.34 267c29.68 43.08 53.81 78.7 53.81 79.08 0 .38-49.21.77-109.34.77s-108.96-.77-108.57-1.53c1.91-4.98 108-157.4 109.15-157.02.76.38 25.46 35.8 54.95 78.7zm-333.19 3.44c27.38 40.79 49.98 74.68 49.98 75.25 0 .57-40.98 1.15-90.96 1.15H90.22l38.68-77.55c29.68-59.36 39.25-76.98 40.98-75.06 1.15 1.15 24.7 35.62 52.27 76.21zm649.14-.76l38.49 77.17H726.15l28.92-42.7c66.64-98.23 76.59-112.59 77.17-112.02.18.38 17.8 35.23 39.05 77.55zm-504.95 303.5c31.21 90.96 56.49 165.45 56.11 165.83-.19.38-57.64-60.51-127.53-135-69.9-74.48-139.98-149.17-155.49-165.82l-28.53-30.07h198.76l56.68 165.06zm258.13-163.72c0 3.06-123.32 360.57-124.47 360.57-1.15 0-124.66-357.51-124.47-360.57 0-1.72 248.94-1.72 248.94 0zm236.1 28.73c-15.51 16.66-85.59 91.34-155.49 165.83-69.89 74.49-127.34 135.38-127.72 135-.19-.38 25.09-74.87 56.3-165.83l56.68-165.06H889.1l-28.53 30.06z"/>
                </svg>

  return (
    <div className="flex items-center bg-blue-500 font-bold p-1">
      { gem }
      <p className="mx-1">{ card.value }</p>
      { gem }
    </div>
  )
}

export default TreasureQuestCard