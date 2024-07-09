import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyToken = () => {
  const [message, setMessage] = useState('');
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      axios.get(`https://send-email-murex.vercel.app/verify-token?token=${token}`)
        .then(response => {
          setMessage(response.data.message);
        })
        .catch(error => {
          if (error.response) {
            setMessage(error.response.data.message);
          } else {
            setMessage('An error occurred while verifying the token');
          }
        });
    } else {
      setMessage('No token provided');
    }
  }, [location]);

  return (
    <div className="w-screen h-screen bg-black flex justify-center items-center">
      <div className="text-yellow-500 text-center text-4xl">
        {message || 'Loading...'}
      </div>
    </div>
  );
};

export default VerifyToken;
