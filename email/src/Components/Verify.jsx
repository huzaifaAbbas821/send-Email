import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Payment from "./Payment";
import {useNavigate} from "react-router-dom"

const VerifyToken = () => {
  const [message, setMessage] = useState("");
  const [handle, setHandle] = useState(false);
  const [Payment, setPayment] = useState(false);
  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    if (token) {
      axios
        .get(`https://send-email-vgp4.vercel.app/verify-token?token=${token}`)
        .then((response) => {
          console.log("API Response:", response.data);
          setMessage(response.data.message);
          setHandle(response.data.handle);
          setPayment(response.data.Payment);
        })
        .catch((error) => {
          if (error.response) {
            setMessage(error.response.data.message);
          } else {
            setMessage("An error occurred while verifying the token");
          }
          console.log("Error:", error);
        });
    } else {
      setMessage("No token provided");
    }
  }, [location]);

  useEffect(() => {
    console.log("Handle State:", handle);
  }, [handle]);

  if (handle) {
    if (Payment) {
        navigate('/home'); 
    }
    else
    return <Payment/>
  } else {
    return (
      <div className="w-screen h-screen bg-black flex justify-center items-center">
        <div className="text-yellow-500 text-center text-4xl">{message}</div>
      </div>
    );
  }
};

export default VerifyToken;
