import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axiosInstance';
import { Send, Heart, Reply, CornerDownRight } from 'lucide-react';

const CommentSection = ({ postId }) => {
  const { currentUser } = useAuth();
  
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [replyTargetId, setReplyTargetId] = useState(null); // ID of comment being replied to
  const [replyText, setReplyText] = useState('');

  const fetchComments = async () => {
    try {
      const response = await axiosInstance.get(`/api/comments/${postId}`);
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const response = await axiosInstance.post(`/api/comments/${postId}`, { text: newCommentText });
      if (response.data.success) {
        setNewCommentText('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleReplySubmit = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const response = await axiosInstance.post(`/api/comments/${postId}`, {
        text: replyText,
        parentId
      });
      if (response.data.success) {
        setReplyText('');
        setReplyTargetId(null);
        fetchComments();
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const handleCommentLike = async (commentId) => {
    if (!currentUser) return;
    try {
      const response = await axiosInstance.put(`/api/comments/${commentId}/like`);
      if (response.data.success) {
        setComments(prev => prev.map(c => c._id === commentId ? { ...c, likes: response.data.likes } : c));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Group comments: separate parent comments and their replies
  const parentComments = comments.filter(c => !c.parentId);
  const getRepliesForComment = (parentId) => {
    // Sort replies chronologically (oldest first)
    return comments
      .filter(c => c.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  };

  return (
    <div className="border-t border-slate-205 dark:border-slate-800 pt-10">
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6">Discussion ({comments.length})</h3>

      {/* Main Comment Form */}
      {currentUser ? (
        <form onSubmit={handleCommentSubmit} className="mb-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-4 flex flex-col space-y-3">
          <textarea
            placeholder="What are your thoughts on this article?"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
            required
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none rounded-xl p-4 text-slate-800 dark:text-slate-100 text-sm resize-none transition-colors placeholder-slate-400 dark:placeholder-slate-500"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white rounded-xl flex items-center space-x-1.5 transition-all shadow shadow-indigo-500/10 cursor-pointer"
            >
              <span>Post Comment</span>
              <Send className="w-3 h-3" />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-205 dark:border-slate-800 rounded-2xl text-center text-sm text-slate-500 dark:text-slate-400">
          Please{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
            sign in
          </Link>{' '}
          to participate in the conversation.
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {parentComments.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-6">No comments yet. Start the discussion!</p>
        ) : (
          parentComments.map((comment) => {
            const replies = getRepliesForComment(comment._id);
            const isLiked = currentUser && comment.likes?.includes(currentUser.id || currentUser._id);
            const likesCount = comment.likes?.length || 0;

            return (
              <div key={comment._id} className="space-y-4">
                {/* Parent Comment */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex items-start space-x-4">
                  <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-indigo-650 dark:text-indigo-400 text-xs uppercase overflow-hidden shrink-0">
                    {comment.userId?.profilePic ? (
                      <img src={comment.userId.profilePic} alt={comment.userId.username} className="h-full w-full object-cover" />
                    ) : (
                      comment.userId?.username?.substring(0, 2) || 'U'
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-350">{comment.userId?.username || 'Anonymous'}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(comment.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-slate-655 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                    
                    {/* Action Bar (Like & Reply buttons) */}
                    <div className="flex items-center space-x-4 mt-3 text-xs font-medium text-slate-400">
                      <button
                        onClick={() => handleCommentLike(comment._id)}
                        className={`flex items-center space-x-1 hover:text-pink-500 transition-colors cursor-pointer ${isLiked ? 'text-pink-500 font-bold' : ''}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                        <span>{likesCount} {likesCount === 1 ? 'Like' : 'Likes'}</span>
                      </button>
                      
                      {currentUser && (
                        <button
                          onClick={() => {
                            setReplyTargetId(replyTargetId === comment._id ? null : comment._id);
                            setReplyText('');
                          }}
                          className="flex items-center space-x-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                        >
                          <Reply className="w-3.5 h-3.5" />
                          <span>Reply</span>
                        </button>
                      )}
                    </div>

                    {/* Inline Reply Form */}
                    {replyTargetId === comment._id && (
                      <form onSubmit={(e) => handleReplySubmit(e, comment._id)} className="mt-4 flex flex-col space-y-2.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-150 dark:border-slate-850">
                        <textarea
                          placeholder="Write a reply..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          required
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-100 resize-none transition-colors"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setReplyTargetId(null)}
                            className="px-3.5 py-1.5 text-[10px] font-bold bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3.5 py-1.5 text-[10px] font-bold bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white rounded-lg transition-all shadow cursor-pointer"
                          >
                            Reply
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Nested Replies List */}
                {replies.length > 0 && (
                  <div className="pl-6 md:pl-10 space-y-3">
                    {replies.map((reply) => {
                      const isReplyLiked = currentUser && reply.likes?.includes(currentUser.id || currentUser._id);
                      const replyLikesCount = reply.likes?.length || 0;

                      return (
                        <div key={reply._id} className="bg-slate-50/40 dark:bg-slate-950/20 border border-slate-200/60 dark:border-slate-850/80 rounded-2xl p-4 flex items-start space-x-3.5 relative">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0 mt-2" />
                          <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center font-bold text-indigo-650 dark:text-indigo-400 text-[10px] uppercase overflow-hidden shrink-0">
                            {reply.userId?.profilePic ? (
                              <img src={reply.userId.profilePic} alt={reply.userId.username} className="h-full w-full object-cover" />
                            ) : (
                              reply.userId?.username?.substring(0, 2) || 'U'
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-350">{reply.userId?.username || 'Anonymous'}</span>
                              <span className="text-[9px] text-slate-400 dark:text-slate-500">
                                {new Date(reply.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                              </span>
                            </div>
                            <p className="text-slate-655 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{reply.text}</p>
                            
                            {/* Action Bar (Reply Like button only) */}
                            <div className="flex items-center space-x-4 mt-2 text-[10px] font-medium text-slate-400">
                              <button
                                onClick={() => handleCommentLike(reply._id)}
                                className={`flex items-center space-x-1 hover:text-pink-500 transition-colors cursor-pointer ${isReplyLiked ? 'text-pink-500 font-bold' : ''}`}
                              >
                                <Heart className={`w-3 h-3 ${isReplyLiked ? 'fill-current' : ''}`} />
                                <span>{replyLikesCount} {replyLikesCount === 1 ? 'Like' : 'Likes'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;
