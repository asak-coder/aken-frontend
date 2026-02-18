"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function handleLogin(e: any) {
    e.preventDefault();

    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/admin");
    } else {
      alert("Invalid password");
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-lg">
        <h1 className="text-2xl mb-4">Admin Login</h1>
        <input
          type="password"
          placeholder="Enter Password"
          className="p-3 text-black rounded w-full mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-white text-black px-4 py-2 rounded w-full">
          Login
        </button>
      </form>
    </div>
  );
}
