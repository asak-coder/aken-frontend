"use client";
import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
const [phone, setPhone] = useState("");

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch("https://aken-backend-1.onrender.com/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setStatus("✅ Enquiry submitted successfully!");
      e.target.reset();
    } else {
      setStatus("❌ Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-10">
      <h1 className="text-4xl font-bold mb-6">
        A K ENGINEERING – Industrial EPC Solutions
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md">
        <input name="contactPerson" placeholder="Your Name" required className="p-3 rounded text-black" />
        <input name="email" placeholder="Your Email" required className="p-3 rounded text-black" />
        <input name="companyName" placeholder="Company Name" required className="p-3 rounded text-black" />
        <input   type="text"   placeholder="Phone Number"   value={phone}   onChange={(e) => setPhone(e.target.value)}
  required
/>

        <textarea name="message" placeholder="Project Requirement" required className="p-3 rounded text-black" />

        <button type="submit" className="bg-white text-black py-3 rounded font-semibold">
          Submit Enquiry
        </button>
      </form>

      {status && <p className="mt-4">{status}</p>}
    </div>
  );
}
