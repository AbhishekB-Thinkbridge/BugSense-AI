import { useState } from 'react';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { BugAntIcon } from '@heroicons/react/24/outline';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-8 animate-fade-in-down w-full">
        <BugAntIcon className="h-16 w-16 text-yellow-400 mb-2 animate-bounce" />
        <h1 className="text-3xl font-extrabold text-yellow-400 tracking-tight mb-2">Welcome to BugSense AI</h1>
        <p className="text-gray-300 text-lg">Sign in to continue</p>
      </div>
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up border border-gray-700">
        <form onSubmit={handleSignIn} className="space-y-6 w-full">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 shadow-md transition-all duration-300 text-lg text-white placeholder-yellow-200"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-yellow-300 pointer-events-none transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 7.5v9.75A2.25 2.25 0 0119.5 19.5H4.5a2.25 2.25 0 01-2.25-2.25V7.5m19.5 0A2.25 2.25 0 0019.5 5.25H4.5A2.25 2.25 0 002.25 7.5m19.5 0v.243a2.25 2.25 0 01-.659 1.591l-7.091 7.091a2.25 2.25 0 01-3.182 0l-7.091-7.091A2.25 2.25 0 012.25 7.743V7.5" />
              </svg>
            </span>
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border-2 border-pink-400 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-500 shadow-md transition-all duration-300 text-lg text-white placeholder-pink-200"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-300 pointer-events-none transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m12.75 0A2.25 2.25 0 0119.5 12.75v4.5A2.25 2.25 0 0117.25 19.5H6.75A2.25 2.25 0 014.5 17.25v-4.5A2.25 2.25 0 016.75 10.5h10.5z" />
              </svg>
            </span>
          </div>
          {error && <p className="text-pink-400 text-sm animate-shake">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-gray-900 py-3 rounded-lg font-semibold text-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-300">
          Don't have an account? <Link to="/signup" className="text-yellow-400 hover:underline font-semibold">Sign Up</Link>
        </p>
      </div>
      <style>{`
        .animate-fade-in-down {
          animation: fadeInDown 0.8s cubic-bezier(.39,.575,.565,1) both;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(.39,.575,.565,1) both;
        }
        @keyframes fadeInDown {
          0% { opacity: 0; transform: translateY(-40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          0% { opacity: 0; transform: translateY(40px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-bounce {
          animation: bounce 1.2s infinite alternate;
        }
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
