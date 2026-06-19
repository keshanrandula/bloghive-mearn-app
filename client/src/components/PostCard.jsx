import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText } from 'lucide-react';

const PostCard = ({ post }) => {
  if (!post) return null;

  return (
    <article className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-indigo-500/35 dark:hover:border-indigo-500/35 transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md">
      {post.coverImage && (
        <div className="h-44 w-full overflow-hidden relative">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-slate-900 via-transparent to-transparent opacity-80"></div>
        </div>
      )}
      <div className="p-6 flex-grow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400">
                {post.category}
              </span>
              {post.isPaid && (
                <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-55 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 select-none">
                  Premium
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
            {post.title}
          </h3>
          <p className="text-slate-600 dark:text-slate-450 text-xs mb-6 line-clamp-3 leading-relaxed">
            {post.content.replace(/<[^>]*>?/gm, '')}
          </p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase overflow-hidden">
              {post.author?.profilePic ? (
                <img src={post.author.profilePic} alt={post.author.username} className="h-full w-full object-cover" />
              ) : (
                post.author?.username?.substring(0, 2) || 'U'
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-350 truncate max-w-[120px]">
                {post.author?.username || 'Anonymous'}
              </span>
              <div className="flex items-center space-x-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                {post.likes && (
                  <span>
                    {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
                  </span>
                )}
                <span>•</span>
                <span>{post.views || 0} {post.views === 1 ? 'view' : 'views'}</span>
              </div>
            </div>
          </div>
          <Link
            to={`/post/${post._id}`}
            className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-500 dark:text-slate-400 hover:text-white dark:hover:text-white rounded-lg transition-all"
          >
            <BookOpenText className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
