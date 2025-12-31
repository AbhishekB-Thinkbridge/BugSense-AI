import { Link } from 'react-router-dom';
import { BugAntIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../AuthProvider';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data());
        }
      } else {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <BugAntIcon className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">
              BugSense <span className="text-primary-600">AI</span>
            </span>
          </Link>
          {user && (
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Home
              </Link>
              <Link
                to="/submit"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Submit Bug
              </Link>
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-primary-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/submit"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                New Bug Report
              </Link>
              <button
                onClick={() => setShowProfile((v) => !v)}
                className="flex items-center gap-1 bg-gray-200 px-3 py-1 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <UserCircleIcon className="h-6 w-6 text-primary-600" />
                <span className="font-semibold text-primary-600">Profile</span>
              </button>
              {showProfile && profile && (
                <div className="flex flex-col items-end bg-gray-100 px-3 py-2 rounded-lg shadow-md absolute top-16 right-8 z-50 min-w-[180px]">
                  <span className="font-semibold text-primary-600">
                    {profile.firstName} {profile.lastName}
                  </span>
                  <span className="text-xs text-gray-500 mb-2">
                    {profile.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors w-full mt-2"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
