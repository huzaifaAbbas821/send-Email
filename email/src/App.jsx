// import { useState } from 'react'
// import Login from './Components/Login'


// function App() {

//   return (
//     <>
//       <Login/>
//     </>
//   )
// }

// export default App
// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Verify from './Components/Verify';
import Home from './Components/Home';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-token" element={<Verify />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
};

export default App;

