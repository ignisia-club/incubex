import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Upload from './pages/Upload.jsx';
import Admin from './pages/Admin.jsx';
import Slots from './pages/Slots.jsx';
import { SLOTS_ENABLED } from './features.js';

export default function App() {
  return (
    <Routes>
      <Route path='/' element={<Home />} /> 
      <Route path='/upload' element={<Upload />} />
      <Route path='/admin' element={<Admin />} />
      {/* Slot booking is hidden: /slots goes to the homepage until SLOTS_ENABLED is true (src/features.js). */}
      <Route path='/slots' element={SLOTS_ENABLED ? <Slots /> : <Navigate to='/' replace />} />
    </Routes>
  );
}
