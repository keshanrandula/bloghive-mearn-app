import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SinglePost from './pages/SinglePost';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import './App.css';

// Main Routing and Layout setup inside Auth context
const AppContent = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative flex flex-col justify-between overflow-x-hidden transition-colors duration-200">
      {/* Background Decorative Glow elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-10 relative">
          <Routes>
            {/* Public paths */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/post/:id" element={<SinglePost />} />

            {/* Protected paths */}
            <Route element={<ProtectedRoute />}>
              <Route path="/create" element={<CreatePost />} />
              <Route path="/edit/:id" element={<EditPost />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </main>
      </div>

      <footer className="border-t border-slate-200/60 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-16 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 text-slate-450 dark:text-slate-400 text-xs mb-10">
          {/* Col 1: Brand Info */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-white tracking-tight">BlogHive</h3>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400 max-w-xs">
              A premium, high-fidelity platform where creators share thoughts, tutorials, and stories. Where knowledge flourishes and ideas buzz.
            </p>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Categories</h4>
            <ul className="space-y-2.5 font-semibold text-slate-500 dark:text-slate-400">
              <li><Link to="/?category=Technology" className="hover:text-indigo-600 transition-colors">Technology</Link></li>
              <li><Link to="/?category=Design" className="hover:text-indigo-600 transition-colors">Design</Link></li>
              <li><Link to="/?category=Engineering" className="hover:text-indigo-600 transition-colors">Engineering</Link></li>
              <li><Link to="/?category=Business" className="hover:text-indigo-600 transition-colors">Business</Link></li>
            </ul>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Quick Navigation</h4>
            <ul className="space-y-2.5 font-semibold text-slate-500 dark:text-slate-400">
              <li><Link to="/" className="hover:text-indigo-600 transition-colors">Home Feed</Link></li>
              <li><Link to="/create" className="hover:text-indigo-600 transition-colors">Write Article</Link></li>
              <li><Link to="/settings" className="hover:text-indigo-600 transition-colors">Settings</Link></li>
            </ul>
          </div>

          {/* Col 4: Contact & Socials */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Connect</h4>
            <p className="leading-relaxed text-slate-500 dark:text-slate-400">
              Have questions, feedback, or partnerships? Reach out to our community team anytime.
            </p>
            <div className="flex items-center space-x-4 font-bold text-indigo-600 dark:text-indigo-400">
              <a href="#" className="hover:underline">Twitter</a>
              <span>•</span>
              <a href="#" className="hover:underline">GitHub</a>
              <span>•</span>
              <a href="#" className="hover:underline">Discord</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-100 dark:border-slate-850 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[10px]">
          <div className="text-center md:text-left">
            <p>&copy; {new Date().getFullYear()} BlogHive Inc. All rights reserved.</p>
          </div>
          <div className="flex items-center space-x-6 font-semibold text-slate-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
