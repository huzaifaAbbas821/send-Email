// src/VerifyToken.js
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Authenticated from './Authenticated';

const Verify = () => {
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      axios.get(`http://localhost:3001/verify-token?token=${token}`)
        .then(response => {
          setMessage(response.data.message);
        })
        .catch(error => {
          setMessage('Invalid or expired token');
        });
    } else {
      setMessage('No token provided');
    }
  }, [location]);

  return (
    <div>
      <h2>{message}</h2>
      <Authenticated/>
    </div>
  );
};

export default Verify;
