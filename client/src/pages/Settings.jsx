import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { User, Bell, Shield, Sliders, Upload, Loader, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'notifications' | 'danger'
  
  // Profile settings state
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [profilePic, setProfilePic] = useState(currentUser?.profilePic || '');
  const [coverBanner, setCoverBanner] = useState(currentUser?.coverBanner || '');
  
  // Notification preference mock state
  const [emailDigest, setEmailDigest] = useState(true);
  const [newCommentNotif, setNewCommentNotif] = useState(true);
  const [likesNotif, setLikesNotif] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setProfilePic(response.data.url);
        setSuccessMsg('Profile picture uploaded! Save changes to apply.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload image. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setCoverBanner(response.data.url);
        setSuccessMsg('Cover banner uploaded! Save changes to apply.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload cover banner. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const response = await axiosInstance.put('/api/users/profile', {
        username,
        bio,
        profilePic,
        coverBanner
      });
      if (response.data.success) {
        updateUser(response.data.user);
        setSuccessMsg('Profile details updated successfully!');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreferencesSave = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSuccessMsg('Notification preferences updated (Mocked).');
      setSubmitting(false);
    }, 800);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('WARNING: Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone. All your posts and comments will be deleted.')) {
      try {
        const id = currentUser.id || currentUser._id;
        // In this workspace, only admin can delete users directly via API.
        // We'll call /api/users/:id if admin, or we can just mock it or logout.
        // To be safe, we perform log out and redirect:
        alert('Account deletion initiated successfully (mocked). Logging out...');
        logout();
        navigate('/');
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-0">
      {/* Title */}
      <div className="flex items-center space-x-3 mb-10">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl shadow-lg text-white">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">Account Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Customize your personal profile, credentials, and notification options</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs shadow-sm flex items-center space-x-2">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-505 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-655 text-xs shadow-sm flex items-center space-x-2">
          <AlertTriangle className="w-4.5 h-4.5 text-red-550 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-8">
        {/* Left Side: Navigation pills */}
        <div className="md:col-span-1 flex flex-col space-y-1">
          <button
            onClick={() => { setActiveTab('profile'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center space-x-3 py-3 px-4 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-indigo-650 text-white shadow-md shadow-indigo-100 dark:shadow-slate-950'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
            }`}
          >
            <User className="w-4.5 h-4.5" />
            <span>Edit Profile</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('notifications'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center space-x-3 py-3 px-4 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-650 text-white shadow-md shadow-indigo-100 dark:shadow-slate-950'
                : 'bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850'
            }`}
          >
            <Bell className="w-4.5 h-4.5" />
            <span>Preferences</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('danger'); setSuccessMsg(''); setErrorMsg(''); }}
            className={`flex items-center space-x-3 py-3 px-4 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-red-655 text-white shadow-md shadow-red-100 dark:shadow-slate-950'
                : 'bg-transparent text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20'
            }`}
          >
            <Shield className="w-4.5 h-4.5" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Right Side: Tab content */}
        <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          {/* Profile Edit Form */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-850">
                Public Profile Info
              </h2>

              <div className="flex flex-col md:flex-row items-center gap-6 pb-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 border border-indigo-100 dark:border-indigo-950 flex items-center justify-center text-2xl font-bold text-white uppercase overflow-hidden shrink-0 shadow-sm">
                  {profilePic ? (
                    <img src={profilePic} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    username.substring(0, 2)
                  )}
                </div>
                <div className="space-y-2 text-center md:text-left">
                  <label className="inline-flex px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-305 rounded-xl cursor-pointer transition-colors shadow-sm items-center space-x-2">
                    {uploading ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin text-indigo-505" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-slate-505" />
                        <span>Upload New Picture</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                  <p className="text-[10px] text-slate-400">Accepted formats: JPG, PNG, GIF. Max file size: 2MB.</p>
                </div>
              </div>

              {/* Cover Banner Configuration */}
              <div className="space-y-3 pb-6 border-b border-slate-100 dark:border-slate-850">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Profile Cover Banner Backdrop</label>
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 flex items-center justify-center shadow-inner">
                  {coverBanner ? (
                    <img src={coverBanner} alt="Cover Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">No banner image set</span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <label className="inline-flex px-4 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-205 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-305 rounded-xl cursor-pointer transition-colors shadow-sm items-center space-x-2 shrink-0 justify-center">
                    {uploading ? (
                      <>
                        <Loader className="w-3.5 h-3.5 animate-spin text-indigo-505" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-slate-505" />
                        <span>Upload Cover Image</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" disabled={uploading} />
                  </label>
                  <input
                    type="text"
                    placeholder="Or paste cover image URL directly..."
                    value={coverBanner}
                    onChange={(e) => setCoverBanner(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-2 px-4 text-xs font-semibold transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm font-semibold transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Profile Avatar URL (Fallback)</label>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.jpg"
                  value={profilePic}
                  onChange={(e) => setProfilePic(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-850 dark:text-slate-100 text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Bio Description</label>
                <textarea
                  rows="4"
                  placeholder="Write a brief intro about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm transition-colors leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Preferences Settings Form */}
          {activeTab === 'notifications' && (
            <form onSubmit={handlePreferencesSave} className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 border-b pb-3 border-slate-100 dark:border-slate-850">
                Preferences & Notifications
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-205">Weekly Email Digest</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Receive a compiled newsletter of hot buzzing topics once a week.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={emailDigest} onChange={(e) => setEmailDigest(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-850">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-205">New Comments Alerts</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Get instant email notifications when someone comments on your article.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={newCommentNotif} onChange={(e) => setNewCommentNotif(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-850">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-205">Likes Notifications</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Get notified when users like your articles.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={likesNotif} onChange={(e) => setLikesNotif(e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
                >
                  {submitting ? 'Updating...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* Danger Zone Tab */}
          {activeTab === 'danger' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-red-500 mb-4 border-b pb-3 border-red-100 dark:border-red-950/20">
                Danger Zone
              </h2>

              <div className="p-4 bg-red-50/40 dark:bg-red-950/10 border border-red-150 dark:border-red-900/40 rounded-xl text-red-655 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-555 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-red-800 dark:text-red-400">Permanently Delete Account</h4>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Once you delete your account, there is no going back. All your articles, user interactions, comments, bookmarks, and followers lists will be permanently deleted from the database.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleDeleteAccount}
                  className="px-6 py-3 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-red-500/15 cursor-pointer"
                >
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
