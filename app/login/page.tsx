'use client';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState("");

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">VoIP Dashboard Login</h1>
      <input
        className="w-full p-2 border rounded mb-4"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="w-full bg-blue-500 text-white p-2 rounded">
        Continue to Dashboard →
      </button>
      <p className="text-sm mt-4">Demo: skip login for now</p>
    </div>
  );
}
