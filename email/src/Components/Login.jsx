import React, { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(""); // State for feedback messages

  const sendEmailFnc = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Error: Email is required");
      return;
    }
  
    try {
      const response = await fetch("https://send-email-vgp4.vercel.app/login-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error sending email");
      }
  
      setMessage("Login link sent. Check your email.");
    } catch (error) {
      console.error("Error sending email:", error);
      setMessage("Error sending email. Please try again.");
    }
  };
  
  return (
    <div className="bg-black w-screen h-screen flex justify-center items-center">
      <form className="flex flex-col md:w-[30%] gap-4 p-4" onSubmit={sendEmailFnc}>
        <div className="w-full">
          <label htmlFor="email" className="text-white">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            id="email"
            placeholder="Enter Email"
            required
            className="w-full p-2"
          />
        </div>
        <button type="submit" className="w-full bg-yellow-400 p-2">
          Login
        </button>
      </form>
      {message && <p className="text-white mt-4">{message}</p>}
    </div>
  );
}

export default Login;
