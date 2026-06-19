import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import CommentSection from '../components/CommentSection';
import { Heart, MessageSquare, Calendar, Trash2, ArrowLeft, Bookmark, AlertCircle, Edit, Shield, Loader, Lock, CreditCard } from 'lucide-react';

const SinglePost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [post, setPost] = useState(null);
  const [commentCount, setCommentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  // Scroll indicator state
  const [scrollProgress, setScrollProgress] = useState(0);

  // Paywall & payment simulation states
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.pageYOffset / totalHeight) * 100;
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchPostData = async () => {
    try {
      const postResponse = await axiosInstance.get(`/api/posts/${id}`);
      if (postResponse.data.success) {
        const p = postResponse.data.post;
        setPost(p);
        setLikesCount(p.likes.length);
        setIsUnlocked(postResponse.data.isUnlocked !== undefined ? postResponse.data.isUnlocked : true);
        
        if (currentUser) {
          const uId = currentUser.id || currentUser._id;
          setLiked(p.likes.includes(uId));
          setBookmarked(p.bookmarks?.includes(uId) || false);
        }
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Could not load post. It may have been deleted or the server is offline.');
    }
  };

  const fetchCommentCount = async () => {
    try {
      const commentsResponse = await axiosInstance.get(`/api/comments/${id}`);
      if (commentsResponse.data.success) {
        setCommentCount(commentsResponse.data.comments.length);
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchPostData(), fetchCommentCount()]);
      setLoading(false);
    };
    loadData();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      const response = await axiosInstance.put(`/api/posts/${id}/like`);
      if (response.data.success) {
        setLikesCount(response.data.likes.length);
        setLiked(response.data.likes.includes(currentUser.id || currentUser._id));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleBookmark = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    try {
      const response = await axiosInstance.put(`/api/posts/${id}/bookmark`);
      if (response.data.success) {
        setBookmarked(response.data.bookmarks.includes(currentUser.id || currentUser._id));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setPaymentProcessing(true);
    try {
      // Simulate validation latency
      await new Promise(resolve => setTimeout(resolve, 1500));
      const response = await axiosInstance.post(`/api/posts/${id}/purchase`);
      if (response.data.success) {
        setShowPaymentModal(false);
        await fetchPostData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment simulation failed.');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        const response = await axiosInstance.delete(`/api/posts/${id}`);
        if (response.data.success) {
          navigate('/');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-700 dark:text-slate-350 px-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-655 p-6 rounded-2xl max-w-md w-full text-center flex flex-col items-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-550 dark:text-red-400" />
          <h2 className="text-xl font-bold">Error Loading Article</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
          <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-755 dark:text-slate-350 transition-all cursor-pointer shadow-sm">
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back Home</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-slate-555">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!post) return null;

  const isOwner = currentUser && (post.author?._id === (currentUser.id || currentUser._id) || post.author === (currentUser.id || currentUser._id));

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 md:px-0 relative">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-transparent z-[100] pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <Link to="/" className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Articles</span>
      </Link>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400">
              {post.category}
            </span>
            {post.isPaid && (
              <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center space-x-1 select-none">
                <Lock className="w-3 h-3" />
                <span>Premium (${post.price?.toFixed(2)})</span>
              </span>
            )}
          </div>
          {isOwner && (
            <div className="flex items-center space-x-2">
              <Link
                to={`/edit/${id}`}
                className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 text-indigo-600 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </Link>
              <button
                onClick={handleDeletePost}
                className="flex items-center space-x-1 px-3 py-1 text-xs font-semibold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-655 hover:bg-red-600 dark:hover:bg-red-655 hover:text-white dark:hover:text-white rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
          {post.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 uppercase overflow-hidden">
              {post.author?.profilePic ? (
                <img src={post.author.profilePic} alt={post.author.username} className="h-full w-full object-cover" />
              ) : (
                post.author?.username?.substring(0, 2) || 'U'
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{post.author?.username || 'Anonymous'}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-440 dark:text-slate-500" />
                <span>{new Date(post.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-550 dark:text-slate-400">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                liked
                  ? 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900/40 text-pink-600 dark:text-pink-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
              <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
            </button>
            <button
              onClick={handleBookmark}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm ${
                bookmarked
                  ? 'bg-amber-50 dark:bg-amber-955/30 border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-current' : ''}`} />
              <span>{bookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>
            <div className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 shadow-sm">
              <MessageSquare className="w-4 h-4" />
              <span>{commentCount} {commentCount === 1 ? 'Comment' : 'Comments'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="w-full rounded-2xl overflow-hidden mb-10 border border-slate-205 dark:border-slate-800 shadow-sm max-h-[450px]">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Article Content */}
      <article className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-250 leading-relaxed text-base mb-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div
          dangerouslySetInnerHTML={{ __html: post.content }}
          className={`quill-render space-y-4 ${!isUnlocked ? 'blur-xs select-none pointer-events-none' : ''}`}
        />
        
        {!isUnlocked && (
          <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-6 text-center z-20">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 p-8 rounded-3xl max-w-md w-full shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl"></div>
              
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 rounded-2xl inline-flex text-amber-600 dark:text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              
              <div>
                <h3 className="text-xl font-extrabold text-slate-850 dark:text-white">Unlock Premium Article</h3>
                <p className="text-xs text-slate-450 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                  This is a premium high-quality article. Purchase this content directly to support the creator and unlock lifetime full access.
                </p>
              </div>

              <div className="py-2.5 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-center justify-between text-sm">
                <span className="font-bold text-slate-500">Price:</span>
                <span className="text-xl font-black text-indigo-650 dark:text-indigo-400">${post.price?.toFixed(2) || '0.99'}</span>
              </div>

              <button
                onClick={() => {
                  if (!currentUser) {
                    navigate('/login');
                  } else {
                    setCardName(currentUser.username || '');
                    setShowPaymentModal(true);
                  }
                }}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                {currentUser ? 'Unlock Now (Simulate Payment)' : 'Sign In to Unlock'}
              </button>
            </div>
          </div>
        )}

        {post.tags && post.tags.length > 0 && isUnlocked && (
          <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/?tag=${encodeURIComponent(tag)}`}
                className="text-xs bg-slate-50 dark:bg-slate-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 px-2.5 py-1 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/35 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </article>

      {/* Comments Section */}
      {isUnlocked && <CommentSection postId={id} />}

      {/* Simulated Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs px-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 p-6 md:p-8 rounded-3xl max-w-sm w-full shadow-2xl space-y-6 relative">
            <h3 className="text-lg font-extrabold text-slate-850 dark:text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-indigo-505" />
              <span>Simulated Payment</span>
            </h3>
            <p className="text-[11px] text-slate-405 leading-relaxed">
              This is a simulated transaction for testing purposes. No actual money will be charged.
            </p>

            <form onSubmit={handlePurchase} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number</label>
                <input
                  type="text"
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiry Date</label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-none text-center"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVV</label>
                  <input
                    type="text"
                    required
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl py-2 px-3 text-xs font-semibold text-slate-800 dark:text-slate-205 focus:outline-none text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-850">
                <span className="text-xs font-bold text-slate-400">Total Price:</span>
                <span className="text-base font-black text-indigo-650 dark:text-indigo-400">${post.price?.toFixed(2) || '0.99'}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  disabled={paymentProcessing}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-855 text-slate-600 dark:text-slate-300 font-bold rounded-xl text-xs cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="py-2.5 bg-indigo-600 hover:opacity-95 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
                >
                  {paymentProcessing ? (
                    <>
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Paying...</span>
                    </>
                  ) : (
                    <span>Pay Simulated</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SinglePost;
