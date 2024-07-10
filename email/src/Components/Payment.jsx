import React from 'react'
import { loadStripe } from '@stripe/stripe-js';
import CheckoutForm from './CheckoutForm';
import { Elements } from '@stripe/react-stripe-js';
import bg from "../assets/bg-image.jpg";

const stripePromise = loadStripe('pk_test_51NYU27DHq3QzD7GbaWIc7E7RSzoa3QCStBesHyU2IykhMKgBHjR9UK7XTMJcshAKC7bDEtVTuxR6V8ENTC6ERaek00XAIUJvIv');


function Payment() {
    return (
        <Elements stripe={stripePromise}>
      <div
        className="w-screen h-screen font-sans"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-[#f5c22a] text-center py-[8vw] md:py-[2vw] text-[4vh] md:text-[3.2vw] font-bold">
          Payment Method
        </div>
        <div className="w-full flex flex-col gap-[2vw] justify-center items-center rounded-xl px-4">
          <div className="lg:w-[30%] md:w-[50%] sm:w-[70%] w-full bg-black bg-opacity-70 border-[2px] border-white rounded-lg py-[4vh] px-[2vw] md::p-[2vw] text-white">
            <CheckoutForm />
          </div>
        </div>
      </div>
    </Elements>
    )
}

export default Payment
