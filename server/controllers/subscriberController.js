const Subscriber = require('../models/Subscriber');

// @desc    Subscribe to newsletter
// @route   POST /api/subscribers
// @access  Public
const subscribeNewsletter = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const subscriberExists = await Subscriber.findOne({ email: email.toLowerCase() });
    if (subscriberExists) {
      return res.status(400).json({ success: false, message: 'Email already subscribed' });
    }

    await Subscriber.create({ email: email.toLowerCase() });
    return res.status(201).json({
      success: true,
      message: 'Subscribed to newsletter successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all newsletter subscribers
// @route   GET /api/subscribers
// @access  Private (Admin Only)
const getSubscribers = async (req, res, next) => {
  try {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      subscribers
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  subscribeNewsletter,
  getSubscribers
};
