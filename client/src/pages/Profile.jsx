import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import PostCard from '../components/PostCard';
import { Mail, FileText, Bookmark, AlertCircle, BarChart3, Eye, Heart, Edit, Trash2, FolderPlus, Folder, Plus, X, Lock } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const { currentUser, updateUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userDrafts, setUserDrafts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'drafts' | 'bookmarks' | 'dashboard'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Follow/Unfollow States
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  // Collections state
  const [collections, setCollections] = useState([]);
  const [activeCollectionName, setActiveCollectionName] = useState('All Bookmarks');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddCollection, setShowAddCollection] = useState(false);

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUserId = currentUser?.id || currentUser?._id;
      
      // 1. Fetch User Profile Info
      const userRes = await axiosInstance.get(`/api/users/${id}`);
      if (userRes.data.success) {
        const user = userRes.data.user;
        setProfileUser(user);
        setFollowersCount(user.followers?.length || 0);
        setFollowingCount(user.following?.length || 0);
        setCollections(user.collections || []);
        if (currentUser) {
          setIsFollowing(user.followers?.includes(currentUserId) || false);
        }
      }

      // 2. Fetch user's published posts
      const postsRes = await axiosInstance.get(`/api/posts?author=${id}&limit=100`);
      if (postsRes.data.success) {
        setUserPosts(postsRes.data.posts);
      }

      // 3. Fetch user's drafts (only if own profile)
      if (currentUser && currentUserId === id) {
        const draftsRes = await axiosInstance.get(`/api/posts?author=${id}&status=draft&limit=100`);
        if (draftsRes.data.success) {
          setUserDrafts(draftsRes.data.posts);
        }
      }

      // 4. Fetch user's bookmarked posts
      const bookmarksRes = await axiosInstance.get(`/api/posts?bookmarkedBy=${id}&limit=100`);
      if (bookmarksRes.data.success) {
        setBookmarkedPosts(bookmarksRes.data.posts);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setError('Could not load user profile. The user may not exist.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) return;
    try {
      const response = await axiosInstance.put(`/api/users/${id}/follow`);
      if (response.data.success) {
        setFollowersCount(response.data.followersCount);
        setIsFollowing(response.data.isFollowing);
        const currentUserId = currentUser.id || currentUser._id;
        if (profileUser && (profileUser._id === currentUserId || profileUser.id === currentUserId)) {
          setFollowingCount(response.data.followingCount);
        }
      }
    } catch (err) {
      console.error('Error toggling follow status:', err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const response = await axiosInstance.delete(`/api/posts/${postId}`);
        if (response.data.success) {
          setUserPosts(prev => prev.filter(p => p._id !== postId));
          setUserDrafts(prev => prev.filter(p => p._id !== postId));
        }
      } catch (err) {
        console.error('Error deleting post:', err);
      }
    }
  };

  // Collections Actions
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const response = await axiosInstance.post('/api/users/collections', { name: newCollectionName.trim() });
      if (response.data.success) {
        setCollections(response.data.collections);
        setNewCollectionName('');
        setShowAddCollection(false);
        // Sync context
        if (currentUser) {
          updateUser({ ...currentUser, collections: response.data.collections });
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create collection.');
    }
  };

  const handleAddPostToCollection = async (collectionName, postId) => {
    try {
      const response = await axiosInstance.post(`/api/users/collections/${encodeURIComponent(collectionName)}/add`, { postId });
      if (response.data.success) {
        setCollections(response.data.collections);
        alert(`Article added to "${collectionName}" collection.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add post to collection.');
    }
  };

  const handleRemovePostFromCollection = async (collectionName, postId) => {
    try {
      const response = await axiosInstance.post(`/api/users/collections/${encodeURIComponent(collectionName)}/remove`, { postId });
      if (response.data.success) {
        setCollections(response.data.collections);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove post from collection.');
    }
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-700 dark:text-slate-350 px-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-655 p-6 rounded-2xl max-w-md w-full text-center flex flex-col items-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-550 dark:text-red-450" />
          <h2 className="text-xl font-bold">Error Loading Profile</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-350 transition-all cursor-pointer shadow-sm">
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profileUser) return null;

  const currentUserId = currentUser?.id || currentUser?._id;
  const profileUserId = profileUser?._id || id;
  const isCurrentUser = currentUser && currentUserId === profileUserId;
  const displayName = profileUser?.username || 'Creator';
  const displayBio = profileUser?.bio || 'No bio provided.';

  // Calculate Creator Analytics
  const totalViews = userPosts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = userPosts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);

  // Filter bookmarks by active collection
  let displayedBookmarks = bookmarkedPosts;
  if (activeCollectionName !== 'All Bookmarks') {
    const activeCol = collections.find(c => c.name === activeCollectionName);
    if (activeCol) {
      displayedBookmarks = bookmarkedPosts.filter(p => activeCol.posts.includes(p._id));
    }
  }

  // Draw custom SVG charts metrics
  const categories = ['Technology', 'Design', 'Engineering', 'Lifestyle', 'Business'];
  const categoryStats = categories.map(cat => {
    const postsInCat = userPosts.filter(p => p.category === cat);
    const viewsInCat = postsInCat.reduce((sum, p) => sum + (p.views || 0), 0);
    return { name: cat, count: postsInCat.length, views: viewsInCat };
  });

  const maxViews = Math.max(...categoryStats.map(s => s.views), 10);

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 md:px-0">
      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl mb-10 overflow-hidden backdrop-blur-md relative">
        
        {/* Cover Banner Backdrop */}
        {profileUser?.coverBanner ? (
          <div className="h-48 w-full overflow-hidden relative">
            <img src={profileUser.coverBanner} alt="Profile Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
          </div>
        ) : (
          <div className="h-32 w-full bg-gradient-to-r from-indigo-900/40 via-indigo-600/30 to-violet-900/40 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
          </div>
        )}

        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start md:space-x-8 relative">
          {/* Glow backdrop */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-600 border-2 border-white dark:border-slate-900 flex items-center justify-center text-3xl font-extrabold text-white uppercase overflow-hidden mb-6 md:mb-0 shrink-0 shadow-lg shadow-indigo-500/10 -mt-16 md:-mt-20 z-10 relative">
            {profileUser?.profilePic ? (
              <img src={profileUser.profilePic} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              displayName.substring(0, 2)
            )}
          </div>

        <div className="text-center md:text-left flex-grow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-850 dark:text-slate-100 tracking-tight">
                {displayName}
              </h1>
              {/* Stats row */}
              <div className="flex justify-center md:justify-start space-x-6 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{followersCount}</strong> Followers
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{followingCount}</strong> Following
                </div>
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 font-bold">{userPosts.length}</strong> Articles
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              {isCurrentUser ? (
                <span className="inline-block px-2.5 py-1.5 rounded bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  My Dashboard
                </span>
              ) : (
                currentUser && (
                  <button
                    onClick={handleFollowToggle}
                    className={`px-5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                      isFollowing
                        ? 'bg-slate-100 dark:bg-slate-855 border-slate-200 dark:border-slate-800 text-slate-770 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                        : 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent hover:opacity-95'
                    }`}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                )
              )}
            </div>
          </div>
          
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center md:justify-start space-x-1.5 mt-4">
            <Mail className="w-3.5 h-3.5 text-slate-450 dark:text-slate-500" />
            <span className="text-slate-600 dark:text-slate-350">{isCurrentUser ? currentUser.email : 'Author Contact Hidden'}</span>
          </p>

          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl max-w-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed shadow-inner">
            <p className="font-semibold text-slate-500 dark:text-slate-400 text-xs mb-1 uppercase tracking-wider flex items-center space-x-1">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Bio</span>
            </p>
            {displayBio}
          </div>
        </div>
      </div>
    </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-850 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'posts'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Published Articles ({userPosts.length})</span>
        </button>

        {isCurrentUser && (
          <button
            onClick={() => setActiveTab('drafts')}
            className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drafts'
                ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Drafts ({userDrafts.length})</span>
          </button>
        )}

        {isCurrentUser && (
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'dashboard'
                ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics Dashboard</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'bookmarks'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          <span>Bookmarks ({bookmarkedPosts.length})</span>
        </button>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'posts' && (
          userPosts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <p className="text-slate-500 dark:text-slate-450 text-sm">No articles published by this user yet.</p>
              {isCurrentUser && (
                <Link
                  to="/create"
                  className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-xl text-xs shadow-md shadow-indigo-500/10 hover:opacity-95"
                >
                  Create First Article
                </Link>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )
        )}

        {activeTab === 'drafts' && isCurrentUser && (
          userDrafts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
              <p className="text-slate-500 dark:text-slate-450 text-sm">No drafts saved.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {userDrafts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )
        )}

        {activeTab === 'dashboard' && isCurrentUser && (
          <div className="space-y-8">
            {/* Creator Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Published</p>
                  <p className="text-2xl font-bold text-slate-850 dark:text-white mt-0.5">{userPosts.length}</p>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Views</p>
                  <p className="text-2xl font-bold text-slate-850 dark:text-white mt-0.5">{totalViews}</p>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex items-center space-x-4">
                <div className="p-3.5 bg-pink-50 dark:bg-pink-950/40 rounded-xl text-pink-600 dark:text-pink-400">
                  <Heart className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Likes Received</p>
                  <p className="text-2xl font-bold text-slate-850 dark:text-white mt-0.5">{totalLikes}</p>
                </div>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">Views By Category</h3>
              <p className="text-[10px] text-slate-400">Visual performance of your published articles separated by classification.</p>
              
              <div className="pt-6">
                <svg viewBox="0 0 500 240" className="w-full h-auto overflow-visible select-none">
                  {/* Grid Lines */}
                  <line x1="45" y1="10" x2="480" y2="10" stroke="#f1f5f9" className="dark:stroke-slate-850" strokeWidth="1" />
                  <line x1="45" y1="70" x2="480" y2="70" stroke="#f1f5f9" className="dark:stroke-slate-850" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="45" y1="130" x2="480" y2="130" stroke="#f1f5f9" className="dark:stroke-slate-850" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="45" y1="190" x2="480" y2="190" stroke="#e2e8f0" className="dark:stroke-slate-800" strokeWidth="1.5" />

                  {/* Y-Axis scale tags */}
                  <text x="10" y="15" fill="#94a3b8" fontSize="9" fontWeight="bold">{(maxViews).toFixed(0)}</text>
                  <text x="10" y="75" fill="#94a3b8" fontSize="9" fontWeight="bold">{(maxViews * 0.66).toFixed(0)}</text>
                  <text x="10" y="135" fill="#94a3b8" fontSize="9" fontWeight="bold">{(maxViews * 0.33).toFixed(0)}</text>
                  <text x="10" y="195" fill="#94a3b8" fontSize="9" fontWeight="bold">0</text>

                  {/* Bars */}
                  {categoryStats.map((stat, i) => {
                    const barWidth = 32;
                    const spacing = 80;
                    const xCoord = 65 + (i * spacing);
                    
                    // Calculate height percentage
                    const barHeight = (stat.views / maxViews) * 180;
                    const yCoord = 190 - barHeight;

                    return (
                      <g key={stat.name} className="group cursor-pointer">
                        {/* Hover Tooltip Box */}
                        <rect
                          x={xCoord - 10}
                          y={yCoord - 32}
                          width={barWidth + 20}
                          height="20"
                          rx="5"
                          fill="#1e293b"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        />
                        <text
                          x={xCoord + (barWidth / 2)}
                          y={yCoord - 19}
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          {stat.views} views
                        </text>

                        {/* Bar Shape */}
                        <rect
                          x={xCoord}
                          y={yCoord}
                          width={barWidth}
                          height={Math.max(barHeight, 2)}
                          rx="6"
                          fill={`url(#barGrad-${i})`}
                          className="hover:brightness-95 transition-all duration-300"
                        />
                        
                        {/* Gradients definitions inline */}
                        <defs>
                          <linearGradient id={`barGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>

                        {/* X-axis tag labels */}
                        <text
                          x={xCoord + (barWidth / 2)}
                          y="210"
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="middle"
                          className="dark:fill-slate-400"
                        >
                          {stat.name}
                        </text>
                        <text
                          x={xCoord + (barWidth / 2)}
                          y="225"
                          fill="#94a3b8"
                          fontSize="8"
                          textAnchor="middle"
                        >
                          {stat.count} {stat.count === 1 ? 'article' : 'articles'}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Articles Table Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">Manage Your Articles</h3>
                <Link
                  to="/create"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 hover:opacity-95"
                >
                  New Article
                </Link>
              </div>

              {userPosts.length === 0 && userDrafts.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  You haven't written any articles yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100 dark:border-slate-850">
                        <th className="py-4 px-6">Title</th>
                        <th className="py-4 px-6 text-center">Status</th>
                        <th className="py-4 px-6 text-center">Views</th>
                        <th className="py-4 px-6 text-center">Likes</th>
                        <th className="py-4 px-6">Published Date</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-xs font-medium text-slate-655 dark:text-slate-300">
                      {[...userPosts, ...userDrafts].map((post) => (
                        <tr key={post._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-950/20 transition-colors">
                          <td className="py-4 px-6">
                            <Link to={`/post/${post._id}`} className="font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 transition-colors line-clamp-1">
                              {post.title}
                            </Link>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded mt-1 inline-block">
                              {post.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              post.status === 'draft'
                                ? 'bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-450'
                            }`}>
                              {post.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center text-slate-700 dark:text-slate-205 font-bold">{post.views || 0}</td>
                          <td className="py-4 px-6 text-center text-slate-700 dark:text-slate-205 font-bold">{post.likes?.length || 0}</td>
                          <td className="py-4 px-6 text-slate-400 font-semibold">{new Date(post.createdAt).toLocaleDateString()}</td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                to={`/edit/${post._id}`}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-all"
                                title="Edit Article"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={() => handleDeletePost(post._id)}
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
              )}
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-8 animate-fade-in">
            {/* Bookmarks Collections Folders */}
            {isCurrentUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Folder className="w-4 h-4 text-slate-400" />
                    <span>Bookmark Collections</span>
                  </h3>
                  
                  <button
                    onClick={() => setShowAddCollection(!showAddCollection)}
                    className="flex items-center space-x-1 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    {showAddCollection ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                    <span>{showAddCollection ? 'Cancel' : 'New Collection'}</span>
                  </button>
                </div>

                {/* Create Collection Input Form */}
                {showAddCollection && (
                  <form onSubmit={handleCreateCollection} className="flex gap-2 max-w-sm">
                    <input
                      type="text"
                      required
                      placeholder="Folder name (e.g. React, Coding)..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      className="flex-grow bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 hover:opacity-95 text-white font-bold rounded-xl text-xs cursor-pointer shadow"
                    >
                      Create
                    </button>
                  </form>
                )}

                {/* Collection folders tabs */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveCollectionName('All Bookmarks')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      activeCollectionName === 'All Bookmarks'
                        ? 'bg-indigo-650 border-indigo-500 text-white shadow'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                    }`}
                  >
                    All Bookmarks ({bookmarkedPosts.length})
                  </button>

                  {collections.map(col => (
                    <button
                      key={col.name}
                      onClick={() => setActiveCollectionName(col.name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        activeCollectionName === col.name
                          ? 'bg-indigo-650 border-indigo-500 text-white shadow'
                          : 'bg-white dark:bg-slate-900 border-slate-205 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50'
                      }`}
                    >
                      {col.name} ({col.posts?.length || 0})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bookmarked articles list */}
            <div>
              {displayedBookmarks.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
                  <p className="text-slate-500 dark:text-slate-450 text-sm">No bookmarks in this folder.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Collections quick folders dropdown for items if viewing own profile */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedBookmarks.map((post) => (
                      <div key={post._id} className="relative group/card">
                        <PostCard post={post} />
                        
                        {/* Collection Organizer overlay on hover */}
                        {isCurrentUser && (
                          <div className="absolute top-2 right-2 flex space-x-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity z-20">
                            {activeCollectionName !== 'All Bookmarks' ? (
                              <button
                                onClick={() => handleRemovePostFromCollection(activeCollectionName, post._id)}
                                className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow transition-colors cursor-pointer"
                                title={`Remove from ${activeCollectionName}`}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              collections.length > 0 && (
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddPostToCollection(e.target.value, post._id);
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-[9px] bg-slate-900 text-white border border-slate-800 rounded-lg p-1.5 focus:outline-none cursor-pointer font-bold shadow-md"
                                  defaultValue=""
                                >
                                  <option value="" disabled>Add to folder...</option>
                                  {collections.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                  ))}
                                </select>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
