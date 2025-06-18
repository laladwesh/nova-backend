import React from 'react'
import { Route, Routes } from 'react-router-dom'
import PixelGridPage from './components/PixelGridPage'

const App = () => {
  return (
   <>
   <Routes>
    <Route path="/" element={<h1 className='text-center bg-fuchsia-800'>Home Page</h1>} />
    <Route path="/pixelgrid" element={<PixelGridPage/>} />
   </Routes>
   </>
  )
}

export default App