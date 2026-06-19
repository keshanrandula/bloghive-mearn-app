import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Feather, LogOut, Sun, Moon, Settings, Bell } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const response = await axiosInstance.get('/api/notifications');
      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async () => {
    try {
      await axiosInstance.put('/api/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-b border-slate-100/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group shrink-0">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Feather className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent tracking-tight hidden xs:inline">
            BlogHive
          </span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Home</Link>
          {currentUser && (
            <Link to={`/profile/${currentUser.id || currentUser._id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">My Profile</Link>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <Link to="/admin" className="text-amber-600 dark:text-amber-400 hover:text-amber-700 transition-colors">Admin Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-105"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-500" /> : <Moon className="w-4.5 h-4.5 text-slate-500" />}
          </button>

          {/* Notifications Center */}
          {currentUser && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setShowDropdown(!showDropdown);
                  if (!showDropdown && unreadCount > 0) {
                    handleMarkAsRead();
                  }
                }}
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:scale-105 shadow-sm cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[9px] font-extrabold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center border border-white dark:border-slate-950 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 overflow-hidden backdrop-blur-lg transition-all duration-200 ease-out py-2">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAsRead}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-850">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const getNotifContent = () => {
                          const username = (
                            <span className="font-bold text-slate-850 dark:text-slate-205">
                              {notif.sender?.username || 'Someone'}
                            </span>
                          );
                          const postTitle = notif.post ? (
                            <span className="italic font-medium text-slate-700 dark:text-slate-300">
                              "{notif.post.title}"
                            </span>
                          ) : null;

                          switch (notif.type) {
                            case 'follow':
                              return <span>{username} started following you.</span>;
                            case 'like_post':
                              return <span>{username} liked your article {postTitle}.</span>;
                            case 'like_comment':
                              return <span>{username} liked your comment on {postTitle}.</span>;
                            case 'comment':
                              return <span>{username} commented on {postTitle}.</span>;
                            case 'reply':
                              return <span>{username} replied to your comment on {postTitle}.</span>;
                            default:
                              return <span>New activity from {username}.</span>;
                          }
                        };

                        const getNotifLink = () => {
                          if (notif.post) {
                            return `/post/${notif.post._id || notif.post}`;
                          }
                          if (notif.sender) {
                            return `/profile/${notif.sender._id || notif.sender}`;
                          }
                          return '#';
                        };

                        return (
                          <Link
                            key={notif._id}
                            to={getNotifLink()}
                            onClick={() => setShowDropdown(false)}
                            className={`flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs text-slate-650 dark:text-slate-350 ${
                              !notif.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                            }`}
                          >
                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-slate-100 dark:border-slate-850 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-[10px] uppercase overflow-hidden shrink-0">
                              {notif.sender?.profilePic ? (
                                <img src={notif.sender.profilePic} alt={notif.sender.username} className="h-full w-full object-cover" />
                              ) : (
                                notif.sender?.username?.substring(0, 2) || '?'
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="leading-snug">{getNotifContent()}</div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                {new Date(notif.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 self-center shrink-0" />
                            )}
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Settings Button */}
          {currentUser && (
            <Link
              to="/settings"
              className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:scale-105 shadow-sm cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </Link>
          )}

          {currentUser ? (
            <>
              {/* Authenticated user menu */}
              <Link
                to={`/profile/${currentUser.id || currentUser._id}`}
                className="flex items-center space-x-2 text-xs font-semibold text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 px-3.5 py-2 rounded-xl transition-all shadow-sm"
              >
                <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-[11px] uppercase overflow-hidden shrink-0">
                  {currentUser.profilePic ? (
                    <img src={currentUser.profilePic} alt={currentUser.username} className="h-full w-full object-cover" />
                  ) : (
                    currentUser.username?.substring(0, 2) || 'U'
                  )}
                </div>
                <span>{currentUser.username || 'User'}</span>
              </Link>

              <Link
                to="/create"
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:scale-105 shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all"
              >
                Write Article
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/20 border border-slate-200 dark:border-slate-800 hover:border-red-200 dark:hover:border-red-900/30 rounded-xl transition-colors cursor-pointer shadow-sm"
                title="Sign Out"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </>
          ) : (
            <>
              {/* Anonymous navigation items */}
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl hover:scale-105 shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
