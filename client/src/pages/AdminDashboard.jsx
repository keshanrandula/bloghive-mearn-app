import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { Users, FileText, BarChart3, Trash2, Shield, UserX, AlertTriangle, ArrowLeft, Loader, ShieldAlert, Mail, Download } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'posts' | 'subscribers'
  
  // Action submitting states
  const [actionLoading, setActionLoading] = useState(false);

  // Check admin authorization
  const isAdmin = currentUser && currentUser.role === 'admin';

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'admin') {
      setError('Access denied. Admins only.');
      setLoading(false);
      return;
    }

    const fetchAdminData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch all users
        const usersRes = await axiosInstance.get('/api/users');
        // Fetch all posts (we pass limit=1000 to get a large set for administration)
        const postsRes = await axiosInstance.get('/api/posts?limit=1000');
        // Fetch subscribers
        const subsRes = await axiosInstance.get('/api/subscribers');
        
        if (usersRes.data.success) {
          setUsers(usersRes.data.users);
        }
        if (postsRes.data.success) {
          setPosts(postsRes.data.posts);
        }
        if (subsRes.data.success) {
          setSubscribers(subsRes.data.subscribers);
        }
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load system administration details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [currentUser, navigate]);

  const handleExportSubscribers = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Email", "Joined Date"].join(",") + "\n"
      + subscribers.map(sub => `"${sub.email}","${new Date(sub.createdAt).toLocaleDateString()}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRoleToggle = async (userId) => {
    setActionLoading(true);
    try {
      const response = await axiosInstance.put(`/api/users/${userId}/role`);
      if (response.data.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: response.data.user.role } : u));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('WARNING: Are you sure you want to delete this user? All their published posts and comments will be permanently deleted.')) {
      setActionLoading(true);
      try {
        const response = await axiosInstance.delete(`/api/users/${userId}`);
        if (response.data.success) {
          setUsers(prev => prev.filter(u => u._id !== userId));
          // Filter out deleted user's posts
          setPosts(prev => prev.filter(p => (p.author?._id || p.author) !== userId));
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      setActionLoading(true);
      try {
        const response = await axiosInstance.delete(`/api/posts/${postId}`);
        if (response.data.success) {
          setPosts(prev => prev.filter(p => p._id !== postId));
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete post.');
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-650"></div>
      </div>
    );
  }

  if (error || !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-700 dark:text-slate-300 px-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-655 p-6 rounded-2xl max-w-md w-full text-center flex flex-col items-center space-y-4 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-red-550 dark:text-red-400 animate-bounce" />
          <h2 className="text-xl font-bold">Unauthorized Access</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'You must be logged in as an administrator to view this page.'}</p>
          <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-755 dark:text-slate-350 transition-all cursor-pointer shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back Home</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalUsers = users.length;
  const totalPosts = posts.length;
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 md:px-0">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-slate-900 to-indigo-950 border border-indigo-500/10 rounded-xl shadow-lg">
            <Shield className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">System Administration</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage users, articles, system logs and analytics</p>
          </div>
        </div>
        
        {actionLoading && (
          <div className="flex items-center space-x-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-xl border border-indigo-150 dark:border-indigo-900">
            <Loader className="w-3.5 h-3.5 animate-spin" />
            <span>Processing changes...</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-650 dark:text-indigo-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Registered Users</p>
            <p className="text-2xl font-bold text-slate-850 dark:text-white mt-0.5">{totalUsers}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Articles</p>
            <p className="text-2xl font-bold text-slate-850 dark:text-white mt-0.5">{totalPosts}</p>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl text-amber-600 dark:text-amber-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Cumulative Views</p>
            <p className="text-2xl font-bold text-slate-850 dark:text-white mt-0.5">{totalViews}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-850 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'users'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'posts'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Article Management ({posts.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('subscribers')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'subscribers'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Subscribers ({subscribers.length})</span>
        </button>
      </div>

      {/* Tables Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {activeTab === 'users' ? (
          users.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No registered users in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="py-4 px-6">Avatar & Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6 text-center">Role</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-655 dark:text-slate-350">
                  {users.map((user) => {
                    const isSelf = user._id === currentUser.id || user._id === currentUser._id;
                    return (
                      <tr key={user._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-indigo-650 dark:text-indigo-400 uppercase overflow-hidden shrink-0">
                              {user.profilePic ? (
                                <img src={user.profilePic} alt={user.username} className="h-full w-full object-cover" />
                              ) : (
                                user.username.substring(0, 2)
                              )}
                            </div>
                            <div>
                              <Link to={`/profile/${user._id}`} className="font-semibold text-slate-850 dark:text-slate-200 hover:text-indigo-650 transition-colors">
                                {user.username}
                              </Link>
                              {isSelf && (
                                <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/30 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-150">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300 font-semibold">{user.email}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-semibold">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleRoleToggle(user._id)}
                              disabled={isSelf || actionLoading}
                              className={`p-2 rounded-lg transition-all ${
                                isSelf
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                              }`}
                              title={user.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={isSelf || actionLoading}
                              className={`p-2 rounded-lg transition-all ${
                                isSelf
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
                              }`}
                              title="Delete Account"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : activeTab === 'posts' ? (
          posts.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No articles published on this platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="py-4 px-6">Title</th>
                    <th className="py-4 px-6">Author</th>
                    <th className="py-4 px-6 text-center">Views</th>
                    <th className="py-4 px-6 text-center">Likes</th>
                    <th className="py-4 px-6">Published Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-655 dark:text-slate-300">
                  {posts.map((post) => (
                    <tr key={post._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                      <td className="py-4 px-6">
                        <Link to={`/post/${post._id}`} className="font-semibold text-slate-850 dark:text-slate-200 hover:text-indigo-655 transition-colors line-clamp-1">
                          {post.title}
                        </Link>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded mt-1 inline-block">
                          {post.category}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Link to={`/profile/${post.author?._id || post.author}`} className="font-semibold text-slate-600 dark:text-slate-350 hover:underline">
                          {post.author?.username || 'Anonymous'}
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-center text-slate-700 dark:text-slate-250 font-bold">{post.views || 0}</td>
                      <td className="py-4 px-6 text-center text-slate-700 dark:text-slate-250 font-bold">{post.likes?.length || 0}</td>
                      <td className="py-4 px-6 text-slate-400 font-semibold">{new Date(post.createdAt).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDeletePost(post._id)}
                            disabled={actionLoading}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                            title="Delete Article"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          subscribers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No newsletter subscribers yet.
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center px-6 py-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-850 animate-fade-in">
                <span className="text-xs text-slate-400 font-semibold">Total: {subscribers.length} subscribers</span>
                <button
                  onClick={handleExportSubscribers}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-850">
                      <th className="py-4 px-6">Email Address</th>
                      <th className="py-4 px-6">Joined Date</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-655 dark:text-slate-300">
                    {subscribers.map((sub) => (
                      <tr key={sub._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">{sub.email}</td>
                        <td className="py-4 px-6 text-slate-400 font-semibold">{new Date(sub.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-1 bg-emerald-550/10 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40 rounded-full text-[9px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
