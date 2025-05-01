// src/pages/SignUpPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/your-logo.jpg';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../contexts/AuthContext';

export default function SignUpPage() {
  const { user, signUpWithGoogle, isLoading, authError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already signed in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleEmailSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement email/password sign-up
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="flex items-center justify-center w-full h-full bg-black bg-opacity-50">
        <div className="backdrop-blur-md bg-white bg-opacity-20 rounded-2xl p-8 max-w-sm w-full text-center">
          <img
            src={logo}
            alt="Your App Logo"
            className="mx-auto h-16 mb-6 w-auto filter drop-shadow-lg"
          />

          {authError && (
            <p className="text-red-100 bg-red-700 bg-opacity-50 px-3 py-2 rounded mb-4">
              {authError}
            </p>
          )}

          <button
            onClick={() => signUpWithGoogle()}
            disabled={isLoading}
            className="flex items-center justify-center w-full mb-6 space-x-2 px-4 py-2 rounded bg-white bg-opacity-80 hover:bg-opacity-90 backdrop-blur-sm"
          >
            <FcGoogle size={24} />
            <span className="font-medium text-gray-800">
              Sign up with Google
            </span>
          </button>

          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded bg-white bg-opacity-70 placeholder-gray-500 focus:outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded bg-white bg-opacity-70 placeholder-gray-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded bg-blue-600 bg-opacity-80 hover:bg-opacity-90 text-white"
            >
              Create account
            </button>
          </form>

          <p className="text-sm text-gray-200 mt-6">
            Already have an account?{' '}
            <a href="/" className="underline hover:text-white">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
