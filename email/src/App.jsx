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
import PaymentComponent from './Components/Payment';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify-token" element={<Verify />} />
        <Route path="/payment" element={<PaymentComponent />} />
      </Routes>
    </Router>
  );
};

export default App;

