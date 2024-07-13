import React, { useState } from "react";
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import Home from "./Home";

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [nameOnCard, setNameOnCard] = useState("");
  const [coupon, setCoupon] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false); // New state to handle success

  const cardElementOptions = {
    style: {
      base: {
        color: "#ffffff", // white text color
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a",
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentProcessing(true);

    const cardElement = elements.getElement(CardNumberElement);

    if (!cardElement) {
      setError("Please complete the form");
      setPaymentProcessing(false);
      return;
    }

    try {
      // Fetch the client secret from your backend
      const response = await fetch("https://send-email-vgp4.vercel.app/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: coupon === 'itsAizaz' ? (4000 * 0.9) : 4000 }), // Specify the payment amount in the smallest currency unit
      });

      if (!response.ok) {
        throw new Error("Failed to fetch client secret");
      }

      const { clientSecret } = await response.json();

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: nameOnCard,
          },
        },
      });

      if (error) {
        setError(error.message);
        setPaymentProcessing(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        alert("Payment succeeded!");

        // Send a POST request to update the payment status
        const token = new URLSearchParams(window.location.search).get('token');
        const updateResponse = await fetch("https://send-email-vgp4.vercel.app/update-payment-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to update payment status");
        }

        // Set state to display the Home component
        setPaymentSucceeded(true);
      }
    } catch (err) {
      setError("Payment failed. Please try again.");
    }

    setPaymentProcessing(false);
  };

  if (paymentSucceeded) {
    return <Home />; // Render Home component if payment succeeded
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block w-full pb-2 text-sm text-white" htmlFor="ccn">
          Card Number
        </label>
        <CardNumberElement
          options={cardElementOptions}
          className="block w-full text-white bg-[#2e2e2e] rounded-lg p-[0.4vw]"
        />
      </div>
      <div className="flex flex-row justify-between w-full mb-4">
        <div className="w-[45%]">
          <label className="block pb-2 text-sm" htmlFor="expDate">
            Exp Date
          </label>
          <CardExpiryElement
            options={cardElementOptions}
            className="w-full px-2 py-1 rounded-lg text-white bg-[#2e2e2e]"
          />
        </div>
        <div className="w-[45%]">
          <label className="block pb-2 text-sm" htmlFor="cvv">
            CVV
          </label>
          <CardCvcElement
            options={cardElementOptions}
            className="w-full px-2 py-1 rounded-lg text-white bg-[#2e2e2e]"
          />
        </div>
      </div>
      <div className="flex flex-col mb-4">
        <label className="block pb-2 text-sm" htmlFor="nameOnCard">
          Name On Card
        </label>
        <input
          type="text"
          className="rounded-lg bg-[#2e2e2e] p-[0.4vw]"
          id="nameOnCard"
          placeholder="Name"
          required
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
        />
      </div>
      <div className="flex flex-col pb-2">
        <label htmlFor="coupon" className="block pb-2 text-sm">
          Coupon Code
        </label>
        <input
          type="text"
          id="coupon"
          name="coupon"
          className="rounded-lg bg-[#2e2e2e] pb-2 text-white p-[0.4vw]"
          placeholder="XXXXXXXX"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
        />
      </div>
      {error && <div className="text-red-500">{error}</div>}
      <button
        type="submit"
        className="rounded-lg bg-[#f5c22a] mt-2 text-black text-center text-[2vh] md:text-[1vw] w-full py-2 font-bold"
        disabled={paymentProcessing}
      >
        {paymentProcessing ? "Processing..." : "Pay $40"}
      </button>
    </form>
  );
};

export default CheckoutForm;
