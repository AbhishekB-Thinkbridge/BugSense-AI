import { Link } from 'react-router-dom';
import { BugAntIcon } from '@heroicons/react/24/outline';

export default function Header() {
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
          </div>
        </div>
      </nav>
    </header>
  );
}
