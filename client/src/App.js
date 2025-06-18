import React from 'react';
import { Route, Routes } from 'react-router-dom';
import PixelGridPage from './components/PixelGridPage';
import HomePage from './pages/HomePage';
import Navbar from './components/navbar';
import './App.css';

const App = () => {
  return (
   <div className="App">
     <div className="app-container">
       <Navbar />
       <Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/pixelgrid" element={<PixelGridPage/>} />
       </Routes>
     </div>
   </div>
  )
}

export default App;