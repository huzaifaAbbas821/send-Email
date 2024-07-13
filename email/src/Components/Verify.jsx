import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import PaymentComponent from "./Payment";
import Home from "./Home";

const VerifyToken = () => {
  const [message, setMessage] = useState("");
  const [handle, setHandle] = useState(false);
  const [payment, setPayment] = useState(false);
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

  useEffect(() => {
    if (handle && payment) {
      <Route path="/home" element={<Home />} />
      navigate('/home');
    }
  }, [handle, payment, navigate]);

  if (handle) {
    if (!payment) {
      return <PaymentComponent />;
    }
    return null;
  } else {
    return (
      <div className="w-screen h-screen bg-black flex justify-center items-center">
        <div className="text-yellow-500 text-center text-4xl">{message}</div>
      </div>
    );
  }
};

export default VerifyToken;
