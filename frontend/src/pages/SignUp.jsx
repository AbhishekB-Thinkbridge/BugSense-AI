import { BugAntIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function SignUp() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Create user authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('User created in Auth:', user.uid);
      
      // Store user info in Firestore using doc reference directly
      try {
        await setDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          email,
          createdAt: new Date().toISOString()
        });
        console.log('User data saved to Firestore successfully');
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        throw new Error(`Failed to save user data: ${firestoreError.message}`);
      }

      // Navigate to dashboard after successful signup and Firestore write
      navigate('/dashboard');
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center mb-8 animate-fade-in-down w-full">
        <BugAntIcon className="h-16 w-16 text-yellow-400 mb-2 animate-bounce" />
        <h1 className="text-3xl font-extrabold text-yellow-400 tracking-tight mb-2">Create Your Account</h1>
        <p className="text-gray-300 text-lg">Sign up to get started</p>
      </div>
      <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up border border-gray-700">
        <form onSubmit={handleSignUp} className="space-y-6 w-full">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="w-1/2 px-4 py-3 bg-gray-800 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 shadow-md transition-all duration-300 text-lg text-white placeholder-yellow-200"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-1/2 px-4 py-3 bg-gray-800 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 shadow-md transition-all duration-300 text-lg text-white placeholder-yellow-200"
            />
          </div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border-2 border-yellow-400 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-500 shadow-md transition-all duration-300 text-lg text-white placeholder-yellow-200"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border-2 border-pink-400 rounded-lg focus:ring-2 focus:ring-pink-400 focus:border-pink-500 shadow-md transition-all duration-300 text-lg text-white placeholder-pink-200"
          />
          {error && <p className="text-pink-400 text-sm animate-shake">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-500 text-gray-900 py-3 rounded-lg font-semibold text-lg shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-300">
          Already have an account? <Link to="/signin" className="text-yellow-400 hover:underline font-semibold">Sign In</Link>
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
