'use client';
import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState("");

  return (
    <div className="p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">VoIP Dashboard</h1>
      <input
        className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="email@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <a href="/dashboard" className="w-full block bg-blue-600 text-white p-3 rounded-lg text-center font-medium hover:bg-blue-700 transition">
        → Enter Dashboard
      </a>
      <p className="text-xs text-gray-500 mt-3 text-center">Magic login coming soon</p>
    </div>
  );
}
