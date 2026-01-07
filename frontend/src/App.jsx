import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './components/AuthProvider';
import Header from './components/Layout/Header';
import Home from './pages/Home';
import SubmitBug from './pages/SubmitBug';
import BugDetails from './pages/BugDetails';
import Dashboard from './pages/Dashboard';
import SignIn from './pages/SignIn';
import ProtectedRoute from './components/ProtectedRoute';

function AppContent() {
  const location = useLocation();
  const hideHeader = location.pathname === '/signin';

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideHeader && <Header />}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitBug />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bug/:id"
            element={
              <ProtectedRoute>
                <BugDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
