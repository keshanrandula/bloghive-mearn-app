import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axiosInstance from '../utils/axiosInstance';
import { PenTool, Image, Tag, Folder, Upload, Loader } from 'lucide-react';

const CATEGORIES = ['Technology', 'Design', 'Engineering', 'Lifestyle', 'Business'];

const CreatePost = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [price, setPrice] = useState('0.99');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Handle Cover Image upload to Cloudinary via server API
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    setError('');
    try {
      const response = await axiosInstance.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setCoverImage(response.data.url);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload image. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e, status = 'published') => {
    e.preventDefault();
    if (!content.trim() || content === '<p><br></p>') {
      setError('Please add some content to your article.');
      return;
    }

    setSubmitting(true);
    setError('');

    // Parse comma separated tags
    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag !== '');

    try {
      const response = await axiosInstance.post('/api/posts', {
        title,
        content,
        category,
        tags: tagArray,
        coverImage,
        isPaid,
        price: isPaid ? parseFloat(price) : 0,
        status
      });
      if (response.data.success) {
        navigate(`/post/${response.data.post._id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to publish article.');
    } finally {
      setSubmitting(false);
    }
  };

  // React Quill formats/modules
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'blockquote', 'code-block'],
      ['clean']
    ]
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 md:px-0 relative">
      <div className="flex items-center space-x-3 mb-8">
        <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-xl shadow-lg shadow-indigo-500/20">
          <PenTool className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Create Article</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-xl text-red-655 text-xs shadow-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Article Title</label>
          <input
            type="text"
            required
            placeholder="Type your headline..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm font-semibold transition-colors"
          />
        </div>

        {/* Category & Tags */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1">
              <Folder className="w-3.5 h-3.5 text-slate-400" />
              <span>Category</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-700 dark:text-slate-350 text-sm transition-colors cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-white dark:bg-slate-900">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. tutorial, css, tech"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm transition-colors"
            />
          </div>
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center space-x-1">
            <Image className="w-3.5 h-3.5 text-slate-400" />
            <span>Cover Image</span>
          </label>
          <div className="grid md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 relative">
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-3 px-4 text-slate-800 dark:text-slate-100 text-sm transition-colors pr-28"
              />
              <label className="absolute right-2.5 top-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 hover:text-slate-800 dark:hover:text-white rounded-lg text-[10px] text-slate-500 dark:text-slate-400 font-semibold cursor-pointer flex items-center space-x-1 select-none transition-colors shadow-sm">
                <Upload className="w-3 h-3 text-slate-400" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="h-12 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-xs text-slate-400 overflow-hidden relative shadow-inner">
              {uploading ? (
                <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </div>
              ) : coverImage ? (
                <img src={coverImage} alt="Cover Preview" className="h-full w-full object-cover" />
              ) : (
                <span>No cover uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Paid / Free Toggle */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-205/60 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Premium Article</h3>
              <p className="text-[10px] text-slate-400">Require readers to purchase this article to unlock full content.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650"></div>
            </label>
          </div>

          {isPaid && (
            <div className="animate-fade-in">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Price ($)</label>
              <input
                type="number"
                min="0.99"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full max-w-[150px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:outline-none rounded-xl py-2 px-3.5 text-slate-805 dark:text-slate-100 text-sm font-semibold transition-colors"
              />
            </div>
          )}
        </div>

        {/* Rich Text Editor */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">Content Body</label>
          <div className="quill-container rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={modules}
              placeholder="Tell your story..."
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4 space-x-3">
          <button
            type="button"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, 'draft')}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-205 dark:hover:bg-slate-750 font-semibold rounded-xl text-sm transition-all cursor-pointer shadow-sm"
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 cursor-pointer"
          >
            {submitting ? 'Publishing...' : 'Publish Article'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
