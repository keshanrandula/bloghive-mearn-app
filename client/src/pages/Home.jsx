import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Search, ChevronLeft, ChevronRight, Users, Hash, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import PostCard from '../components/PostCard';

const CATEGORIES = ['All', 'Technology', 'Design', 'Engineering', 'Lifestyle', 'Business'];

const Home = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState('');
  
  // URL query parameters synchronization
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get('search') || '';
  const activeCategory = searchParams.get('category') || 'All';
  const activeTag = searchParams.get('tag') || '';

  // Input states synchronized on submit
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [activeFeed, setActiveFeed] = useState('trending'); // 'trending' | 'following'

  // Autocomplete Suggestions states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Newsletter subscription states
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Trending Slider Carousel states
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      // Limit set to 7 to support 1 featured + 3 sidebars + 3 grid cards on page 1
      let url = `/api/posts?page=${currentPage}&limit=7`;
      if (activeCategory !== 'All') {
        url += `&category=${encodeURIComponent(activeCategory)}`;
      }
      if (activeSearch) {
        url += `&search=${encodeURIComponent(activeSearch)}`;
      }
      if (activeTag) {
        url += `&tag=${encodeURIComponent(activeTag)}`;
      }
      if (activeFeed === 'following' && currentUser) {
        url += `&followingOf=${currentUser.id || currentUser._id}`;
      } else if (activeFeed === 'trending') {
        url += '&sort=trending';
      }
      
      const response = await axiosInstance.get(url);
      if (response.data.success) {
        setPosts(response.data.posts);
        setTotalPages(response.data.pagination.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch articles. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingPosts = async () => {
    try {
      const response = await axiosInstance.get('/api/posts?limit=4&sort=trending');
      if (response.data.success) {
        setTrendingPosts(response.data.posts);
      }
    } catch (err) {
      console.error('Error fetching trending posts:', err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [currentPage, activeCategory, activeSearch, activeTag, activeFeed]);

  useEffect(() => {
    fetchTrendingPosts();
  }, []);

  useEffect(() => {
    if (trendingPosts.length === 0) return;
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % trendingPosts.length);
    }, 6000);
    return () => clearInterval(slideInterval);
  }, [trendingPosts]);

  // Debounced search suggestions fetch
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchInput.trim() || searchInput.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axiosInstance.get(`/api/posts/suggestions?search=${encodeURIComponent(searchInput)}`);
        if (response.data.success) {
          setSuggestions(response.data.suggestions);
        }
      } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchSuggestions();
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchParams({
      search: searchInput,
      category: activeCategory,
      tag: activeTag
    });
    setCurrentPage(1);
  };

  const handleCategorySelect = (cat) => {
    setSearchParams({
      search: activeSearch,
      category: cat,
      tag: ''
    });
    setCurrentPage(1);
  };

  const handleClearTag = () => {
    setSearchParams({
      search: activeSearch,
      category: activeCategory,
      tag: ''
    });
    setCurrentPage(1);
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribing(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/subscribers', { email: emailInput.trim() });
      if (response.data.success) {
        setSubscribed(true);
        setEmailInput('');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to subscribe to newsletter. Check your email or try again.');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="relative">
      {/* Trending Carousel Slider */}
      {trendingPosts.length > 0 && (
        <div className="relative max-w-6xl mx-auto my-8 px-4 h-[350px] md:h-[450px] rounded-3xl overflow-hidden shadow-2xl group border border-slate-200 dark:border-slate-800/80">
          {trendingPosts.map((post, index) => {
            const isSelected = index === activeSlide;
            const readTime = Math.ceil(post.content.replace(/<[^>]*>?/gm, '').split(' ').length / 200) || 1;
            
            return (
              <div
                key={post._id}
                className={`absolute inset-0 w-full h-full flex flex-col justify-end transition-opacity duration-1000 ease-in-out ${
                  isSelected ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Background Image / Gradient */}
                {post.coverImage ? (
                  <>
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover brightness-[0.4] dark:brightness-[0.3] group-hover:scale-[1.02] transition-transform duration-[6000ms] ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-900 to-violet-950">
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/20 to-transparent"></div>
                  </div>
                )}

                {/* Content Overlay */}
                <div className="relative z-20 p-6 md:p-12 max-w-3xl text-left text-white space-y-3">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-xs font-bold text-indigo-300 uppercase tracking-wide">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Trending #{index + 1} • {post.category}</span>
                  </div>

                  <Link to={`/post/${post._id}`}>
                    <h2 className="text-2xl md:text-5xl font-extrabold tracking-tight hover:text-indigo-300 transition-colors leading-tight line-clamp-2 md:line-clamp-3">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-xs md:text-sm text-slate-300 line-clamp-2 max-w-xl font-medium leading-relaxed">
                    {post.content.replace(/<[^>]*>?/gm, '')}
                  </p>

                  <div className="flex items-center space-x-4 pt-4 border-t border-white/10 mt-4">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-500/20 border border-white/10 flex items-center justify-center font-bold text-indigo-300 text-[10px] uppercase overflow-hidden shrink-0">
                        {post.author?.profilePic ? (
                          <img src={post.author.profilePic} alt={post.author.username} className="h-full w-full object-cover" />
                        ) : (
                          post.author?.username?.substring(0, 2) || 'U'
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-200">{post.author?.username || 'Anonymous'}</span>
                    </div>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400 font-medium">{new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span className="text-xs text-slate-400 font-medium">•</span>
                    <span className="text-xs text-slate-400 font-medium">{readTime} min read</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Navigation Controls */}
          <button
            onClick={() => setActiveSlide((prev) => (prev - 1 + trendingPosts.length) % trendingPosts.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 text-white z-30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg animate-fade-in"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveSlide((prev) => (prev + 1) % trendingPosts.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 text-white z-30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-lg animate-fade-in"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-6 right-6 flex space-x-2 z-30">
            {trendingPosts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeSlide ? 'w-6 bg-indigo-500' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search Bar container */}
      <div className="max-w-xl mx-auto py-10 px-4">
        {/* Search Bar with autocomplete suggestions dropdown */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center z-[90]">
          <div className="relative w-full shadow-xl shadow-indigo-100/50 dark:shadow-slate-950/50 rounded-full">
            <Search className="absolute left-5 top-4.5 h-5 w-5 text-slate-400 dark:text-slate-505" />
            <input
              type="text"
              placeholder="Explore thoughts, tutorials, and stories..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-full py-4 pl-14 pr-32 text-slate-800 dark:text-slate-100 text-sm transition-all placeholder-slate-400 dark:placeholder-slate-500 font-medium"
            />
            
            <button
              type="submit"
              className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full hover:opacity-95 text-xs font-bold transition-all cursor-pointer"
            >
              Search
            </button>

            {/* Live Autocomplete suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto">
                {suggestions.map(s => (
                  <Link
                    key={s._id}
                    to={`/post/${s._id}`}
                    className="block px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 text-xs font-semibold text-left transition-colors border-b border-slate-100 dark:border-slate-850 last:border-0 truncate"
                  >
                    {s.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 px-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategorySelect(cat)}
            className={`px-5 py-2 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              activeCategory === cat && !activeTag
                ? 'bg-indigo-650 border-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-slate-950'
                : 'bg-slate-100 dark:bg-slate-900 border-transparent dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Tag Banner */}
      {activeTag && (
        <div className="flex items-center justify-center mb-8">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-150 dark:border-indigo-900 text-xs font-semibold text-indigo-600 dark:text-indigo-400 rounded-full shadow-sm">
            <Hash className="w-3.5 h-3.5 text-indigo-450" />
            <span>Filtering tag: #{activeTag}</span>
            <button
              onClick={handleClearTag}
              className="ml-2 font-extrabold hover:text-indigo-850 dark:hover:text-white transition-colors cursor-pointer"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Feed Toggle (Trending vs Following) */}
      {currentUser && (
        <div className="flex justify-center mb-12 border-b border-slate-200 dark:border-slate-800 max-w-xs mx-auto">
          <button
            onClick={() => { setActiveFeed('trending'); setCurrentPage(1); }}
            className={`flex items-center space-x-1.5 pb-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeFeed === 'trending'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-605'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trending Feed</span>
          </button>
          <button
            onClick={() => { setActiveFeed('following'); setCurrentPage(1); }}
            className={`flex items-center space-x-1.5 pb-3 px-4 text-xs font-bold border-b-2 cursor-pointer transition-colors ${
              activeFeed === 'following'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-extrabold'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-605'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Following Feed</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="max-w-md mx-auto mb-10 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-655 text-center text-sm shadow-sm">
          {error}
        </div>
      )}

      {/* Posts Section */}
      <section className="mb-16 px-4 md:px-0 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {activeFeed === 'following' ? 'From Following' : 'Latest Buzz'}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 animate-pulse h-64 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full mb-1"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
                </div>
                <div className="h-10 bg-slate-250 dark:bg-slate-800 rounded w-full pt-4 mt-4"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <p className="text-slate-500 dark:text-slate-400 text-base">
              {activeFeed === 'following' 
                ? 'No articles from authors you follow yet. Follow some creators first!' 
                : 'No posts found. Be the first to create one!'}
            </p>
            {activeFeed !== 'following' && (
              <Link
                to="/create"
                className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-medium rounded-xl text-sm shadow-md shadow-indigo-500/10 hover:opacity-95"
              >
                Write Article
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Conditional Premium Layout: Featured + Sidebar on Page 1 if no search/category filters/following feed are active */}
            {currentPage === 1 && activeCategory === 'All' && !activeSearch && !activeTag && activeFeed === 'trending' && posts.length >= 4 ? (
              <div className="flex flex-col lg:flex-row gap-8 mb-12">
                {/* Left: Featured article */}
                <div className="lg:w-[65%] w-full flex">
                  {(() => {
                    const featured = posts[0];
                    const readTime = Math.ceil(featured.content.replace(/<[^>]*>?/gm, '').split(' ').length / 200) || 1;
                    return (
                      <article className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between w-full">
                        <div>
                          {featured.coverImage && (
                            <div className="rounded-2xl overflow-hidden aspect-[16/10] mb-6 relative">
                              <img
                                src={featured.coverImage}
                                alt={featured.title}
                                className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-550"
                              />
                            </div>
                          )}
                          <div className="flex items-center space-x-3 text-[10px] text-slate-400 dark:text-slate-505 font-semibold mb-4">
                            <span className="font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                              {featured.category}
                            </span>
                            <span>•</span>
                            <span>{new Date(featured.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                            <span>•</span>
                            <span>{readTime} min read</span>
                          </div>
                          <Link to={`/post/${featured._id}`}>
                            <h3 className="text-xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                              {featured.title}
                            </h3>
                          </Link>
                          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                            {featured.content.replace(/<[^>]*>?/gm, '')}
                          </p>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 uppercase overflow-hidden">
                              {featured.author?.profilePic ? (
                                <img src={featured.author.profilePic} alt={featured.author.username} className="h-full w-full object-cover" />
                              ) : (
                                featured.author?.username?.substring(0, 2) || 'U'
                              )}
                            </div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-330">{featured.author?.username || 'Anonymous'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold">{featured.views || 0} views</span>
                        </div>
                      </article>
                    );
                  })()}
                </div>

                {/* Right: Stacked Sidebar */}
                <div className="lg:w-[35%] w-full flex flex-col justify-between gap-6">
                  {posts.slice(1, 4).map((sidePost) => (
                    <article
                      key={sidePost._id}
                      className="group bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          {sidePost.category}
                        </span>
                        <Link to={`/post/${sidePost._id}`}>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2 mt-1 mb-2 leading-snug">
                            {sidePost.title}
                          </h4>
                        </Link>
                        <p className="text-slate-400 dark:text-slate-550 text-xs line-clamp-2 leading-relaxed">
                          {sidePost.content.replace(/<[^>]*>?/gm, '')}
                        </p>
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-550 font-semibold mt-3 text-right">
                        {sidePost.views || 0} views
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Grid display for the rest of posts */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {(() => {
                const displayPosts = currentPage === 1 && activeCategory === 'All' && !activeSearch && !activeTag && activeFeed === 'trending' && posts.length >= 4
                  ? posts.slice(4)
                  : posts;
                
                return displayPosts.map((post) => (
                  <PostCard key={post._id} post={post} />
                ));
              })()}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-12">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-555 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-40 disabled:hover:text-slate-500 transition-colors cursor-pointer shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Newsletter Subscription Box */}
      <section className="my-16 px-4 md:px-0 animate-fade-in">
        <div className="relative bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-12 shadow-xl overflow-hidden border border-indigo-900/35">
          {/* Decorative gradients */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <div className="inline-flex p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6 text-indigo-400">
              <Mail className="w-6 h-6" />
            </div>
            
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-4">
              Subscribe to our Newsletter
            </h2>
            <p className="text-slate-350 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
              Get the latest insights, programming tutorials, and design tips delivered directly to your inbox. No spam, ever.
            </p>

            {subscribed ? (
              <div className="inline-flex items-center space-x-2 px-6 py-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm font-semibold animate-fade-in shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
                <span>You are successfully subscribed to BlogHive newsletter!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="flex-grow bg-slate-950/60 border border-indigo-900/60 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-white text-sm font-medium transition-colors placeholder-slate-505 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-500/20 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {subscribing ? 'Subscribing...' : 'Subscribe Now'}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
