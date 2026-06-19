const Post = require('../models/Post');
const Comment = require('../models/Comment');

// @desc    Get all posts (paginated)
// @route   GET /api/posts
// @access  Public
const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 6;
    const skip = (page - 1) * limit;

    // Filter build-up (optional utility for categories/tags/authors if requested)
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }
    if (req.query.author) {
      filter.author = req.query.author;
    }
    
    // Only return published posts unless drafts are explicitly requested by their author
    if (req.query.status === 'draft') {
      if (req.query.author && req.headers.authorization) {
        try {
          const jwt = require('jsonwebtoken');
          const token = req.headers.authorization.split(' ')[1];
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded.id === req.query.author) {
            filter.status = 'draft';
          } else {
            return res.status(403).json({ success: false, message: 'Not authorized to view drafts of another user' });
          }
        } catch (err) {
          return res.status(401).json({ success: false, message: 'Invalid token' });
        }
      } else {
        return res.status(400).json({ success: false, message: 'Author parameter and authorization token required to view drafts' });
      }
    } else {
      filter.status = 'published';
    }
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.bookmarkedBy) {
      filter.bookmarks = req.query.bookmarkedBy;
    }
    if (req.query.followingOf) {
      const User = require('../models/User');
      const user = await User.findById(req.query.followingOf);
      if (user) {
        filter.author = { $in: user.following };
      }
    }

    const totalPosts = await Post.countDocuments(filter);
    const totalPages = Math.ceil(totalPosts / limit);

    if (req.query.sort === 'trending') {
      const mongoose = require('mongoose');
      const aggregateFilter = { ...filter };

      // Manually cast string IDs to ObjectIds for the aggregate stage
      if (aggregateFilter.author && typeof aggregateFilter.author === 'string') {
        try {
          aggregateFilter.author = new mongoose.Types.ObjectId(aggregateFilter.author);
        } catch (e) {
          // ignore
        }
      } else if (aggregateFilter.author && aggregateFilter.author.$in) {
        aggregateFilter.author.$in = aggregateFilter.author.$in.map(id => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch (e) {
            return id;
          }
        });
      }

      if (aggregateFilter.bookmarks && typeof aggregateFilter.bookmarks === 'string') {
        try {
          aggregateFilter.bookmarks = new mongoose.Types.ObjectId(aggregateFilter.bookmarks);
        } catch (e) {
          // ignore
        }
      }

      const posts = await Post.aggregate([
        { $match: aggregateFilter },
        {
          $addFields: {
            likesCount: { $size: { $ifNull: ["$likes", []] } },
            ageInHours: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                3600000
              ]
            }
          }
        },
        {
          $addFields: {
            trendingScore: {
              $divide: [
                { $add: ["$views", { $multiply: ["$likesCount", 5] }, 1] },
                { $pow: [{ $add: ["$ageInHours", 2] }, 1.5] }
              ]
            }
          }
        },
        { $sort: { trendingScore: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      const populatedPosts = await Post.populate(posts, { path: 'author', select: 'username profilePic' });

      return res.status(200).json({
        success: true,
        posts: populatedPosts,
        pagination: {
          currentPage: page,
          totalPages,
          totalPosts,
          limit
        }
      });
    }

    let sortQuery = { createdAt: -1 };
    if (req.query.sort === 'views') {
      sortQuery = { views: -1 };
    }

    const posts = await Post.find(filter)
      .populate('author', 'username profilePic')
      .sort(sortQuery)
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single post by ID
// @route   GET /api/posts/:id
// @access  Public
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'username profilePic');

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Optional user token decoding to verify premium content access
    let viewer = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const jwt = require('jsonwebtoken');
        const User = require('../models/User');
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        viewer = await User.findById(decoded.id);
      } catch (err) {
        console.error('Optional token verification failed in getPostById:', err);
      }
    }

    const isUnlocked = !post.isPaid || 
      (viewer && (
        post.author.toString() === viewer._id.toString() ||
        viewer.role === 'admin' ||
        viewer.purchasedPosts.some(pId => pId.toString() === post._id.toString())
      ));

    if (!isUnlocked) {
      const maskedPost = {
        _id: post._id,
        title: post.title,
        coverImage: post.coverImage,
        author: post.author,
        category: post.category,
        tags: post.tags,
        likes: post.likes,
        bookmarks: post.bookmarks,
        views: post.views,
        isPaid: post.isPaid,
        price: post.price,
        createdAt: post.createdAt,
        content: '<p><em>This is a premium article. Please purchase to unlock the full story...</em></p>'
      };

      return res.status(200).json({
        success: true,
        post: maskedPost,
        isUnlocked: false
      });
    }

    return res.status(200).json({
      success: true,
      post,
      isUnlocked: true
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = async (req, res, next) => {
  try {
    const { title, content, coverImage, category, tags, isPaid, price, status } = req.body;

    // Validation
    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required' });
    }

    const newPost = new Post({
      title,
      content,
      coverImage,
      category,
      tags: tags || [],
      author: req.user.id,
      likes: [],
      bookmarks: [],
      isPaid: isPaid || false,
      price: price || 0,
      status: status || 'published'
    });

    const savedPost = await newPost.save();
    
    // Populate author before returning
    await savedPost.populate('author', 'username profilePic');

    return res.status(201).json({
      success: true,
      post: savedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private (Owner Only)
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Owner check
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this post' });
    }

    const { title, content, coverImage, category, tags, isPaid, price, status } = req.body;

    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (category !== undefined) post.category = category;
    if (tags !== undefined) post.tags = tags;
    if (isPaid !== undefined) post.isPaid = isPaid;
    if (price !== undefined) post.price = price;
    if (status !== undefined) post.status = status;

    const updatedPost = await post.save();
    await updatedPost.populate('author', 'username profilePic');

    return res.status(200).json({
      success: true,
      post: updatedPost
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private (Owner Only)
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Owner or Admin check
    if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
    }

    // Delete post and its comments
    await post.deleteOne();
    await Comment.deleteMany({ postId: req.params.id });

    return res.status(200).json({
      success: true,
      message: 'Post and associated comments deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on a post
// @route   PUT /api/posts/:id/like
// @access  Private
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user.id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike: remove userId from likes array
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      // Like: add userId to likes array
      post.likes.push(userId);
      // Trigger notification
      if (post.author.toString() !== userId) {
        const Notification = require('../models/Notification');
        await Notification.create({
          sender: userId,
          receiver: post.author,
          type: 'like_post',
          post: post._id
        });
      }
    }

    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? 'Post unliked successfully' : 'Post liked successfully',
      likes: updatedPost.likes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle bookmark on a post
// @route   PUT /api/posts/:id/bookmark
// @access  Private
const toggleBookmark = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const userId = req.user.id;
    const isBookmarked = post.bookmarks.includes(userId);

    if (isBookmarked) {
      // Unbookmark: remove userId from bookmarks array
      post.bookmarks = post.bookmarks.filter((id) => id.toString() !== userId);
    } else {
      // Bookmark: add userId to bookmarks array
      post.bookmarks.push(userId);
    }

    const updatedPost = await post.save();

    return res.status(200).json({
      success: true,
      message: isBookmarked ? 'Post unbookmarked successfully' : 'Post bookmarked successfully',
      bookmarks: updatedPost.bookmarks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Simulate purchasing/unlocking a premium post
// @route   POST /api/posts/:id/purchase
// @access  Private
const purchasePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if already purchased
    const alreadyPurchased = user.purchasedPosts.includes(post._id);
    if (alreadyPurchased) {
      return res.status(400).json({ success: false, message: 'Post already purchased' });
    }

    user.purchasedPosts.push(post._id);
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Article purchased successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get autocomplete suggestions for post titles
// @route   GET /api/posts/suggestions
// @access  Public
const getSearchSuggestions = async (req, res, next) => {
  try {
    const { search } = req.query;
    if (!search || !search.trim()) {
      return res.status(200).json({ success: true, suggestions: [] });
    }
    
    // Find up to 5 published posts matching search query
    const posts = await Post.find({
      title: { $regex: search.trim(), $options: 'i' },
      status: 'published'
    })
    .select('title')
    .limit(5);

    return res.status(200).json({
      success: true,
      suggestions: posts
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  toggleLike,
  toggleBookmark,
  purchasePost,
  getSearchSuggestions
};
