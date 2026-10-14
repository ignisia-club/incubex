import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Upload from './pages/Upload.jsx';
import Admin from './pages/Admin.jsx';
import Slots from './pages/Slots.jsx';

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} /> 
      <Route path='/upload' element={<Upload />} />
      <Route path='/admin' element={<Admin />} />
      <Route path='/slots' element={<Slots />} />
    </Routes>
  );
}
