import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, FileText, AlertCircle, Camera, Upload, Loader } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingPic(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setProfilePic(response.data.url);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload image. Try again.');
    } finally {
      setUploadingPic(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, password, profilePic, bio);
      // Optional: registration sends back user token and logs in automatically, so direct back to home
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 relative backdrop-blur-md shadow-xl">
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 rounded-xl mb-4 text-indigo-600 dark:text-indigo-400">
          <UserPlus className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Create Account</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Join the BlogHive network to share your ideas</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-650 dark:text-red-400 text-xs flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Profile Picture Upload */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative group w-24 h-24 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden shadow-inner">
            {uploadingPic ? (
              <div className="flex flex-col items-center justify-center text-emerald-600">
                <Loader className="w-6 h-6 animate-spin" />
                <span className="text-[10px] mt-1 font-semibold">Uploading</span>
              </div>
            ) : profilePic ? (
              <img src={profilePic} alt="Profile Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                <Camera className="w-7 h-7" />
                <span className="text-[9px] mt-1 font-bold uppercase tracking-wider">Photo</span>
              </div>
            )}
            
            {!uploadingPic && (
              <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-semibold">
                <Upload className="w-4 h-4 mb-0.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">Click to upload avatar</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Username</label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
            <input
              type="text"
              required
              minLength={3}
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-100 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-100 text-sm transition-colors placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-100 text-sm transition-colors placeholder-slate-455 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Short Bio (Optional)</label>
          <div className="relative">
            <FileText className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-550" />
            <textarea
              placeholder="Tell us about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={2}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 pl-12 pr-4 text-slate-800 dark:text-slate-100 text-sm transition-colors resize-none placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Register;
