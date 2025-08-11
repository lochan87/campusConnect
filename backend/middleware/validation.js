const Joi = require('joi');

// Post validation schema
const postSchema = Joi.object({
  title: Joi.string().max(200).optional().allow(''),
  content: Joi.string().min(1).max(2000).required(),
  category: Joi.string().valid(
    'events', 
    'lost_found', 
    'food', 
    'memes', 
    'announcements',
    'general'
  ).required(),
  location: Joi.string().max(100).optional().allow(''),
  campusId: Joi.string().required(),
  isAnonymous: Joi.boolean().optional(),
  tags: Joi.alternatives().try(
    Joi.array().items(Joi.string().max(50)),
    Joi.string()
  ).optional(),
  userId: Joi.string().when('isAnonymous', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  userName: Joi.string().when('isAnonymous', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Poll validation schema
const pollSchema = Joi.object({
  question: Joi.string().min(5).max(500).required(),
  description: Joi.string().max(1000).optional().allow(''),
  options: Joi.array()
    .items(Joi.string().min(1).max(200))
    .min(2)
    .max(10)
    .required(),
  campusId: Joi.string().required(),
  location: Joi.string().max(100).optional().allow(''),
  userId: Joi.string().when('isAnonymous', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  userName: Joi.string().when('isAnonymous', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  isAnonymous: Joi.boolean().optional(),
  expiresIn: Joi.number().min(1).max(168).optional(), // 1 hour to 1 week
  allowMultiple: Joi.boolean().optional()
});

// User registration schema
const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  studentId: Joi.string().min(1).max(20).required(),
  campusId: Joi.string().required(),
  department: Joi.string().max(100).optional().allow(''),
  year: Joi.string().max(20).optional().allow('')
});

// Comment validation schema
const commentSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  postId: Joi.string().required(),
  userId: Joi.string().when('isAnonymous', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  userName: Joi.string().when('isAnonymous', {
    is: false,
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  isAnonymous: Joi.boolean().optional(),
  parentCommentId: Joi.string().optional() // For reply comments
});

// Middleware functions
const validatePost = (req, res, next) => {
  const { error } = postSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

const validatePoll = (req, res, next) => {
  const { error } = pollSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

const validateUserRegistration = (req, res, next) => {
  const { error } = userRegistrationSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

const validateComment = (req, res, next) => {
  const { error } = commentSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

// Content sanitization
const sanitizeContent = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  // Remove potentially harmful HTML/script tags
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Rate limiting by user
const createUserRateLimit = (maxRequests = 10, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    const userId = req.body.userId || req.query.userId || 'anonymous';
    const now = Date.now();
    
    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }
    
    const requests = userRequests.get(userId);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    validRequests.push(now);
    userRequests.set(userId, validRequests);
    
    next();
  };
};

// Content moderation middleware
const moderateContent = (req, res, next) => {
  if (req.body.content) {
    req.body.content = sanitizeContent(req.body.content);
    
    // Basic profanity filter (you might want to use a more sophisticated library)
    const profanityWords = ['spam', 'scam']; // Add more words as needed
    const content = req.body.content.toLowerCase();
    
    const hasProfanity = profanityWords.some(word => content.includes(word));
    
    if (hasProfanity) {
      return res.status(400).json({
        success: false,
        error: 'Content contains inappropriate language'
      });
    }
  }
  
  if (req.body.title) {
    req.body.title = sanitizeContent(req.body.title);
  }
  
  if (req.body.question) {
    req.body.question = sanitizeContent(req.body.question);
  }
  
  next();
};

module.exports = {
  validatePost,
  validatePoll,
  validateUserRegistration,
  validateComment,
  createUserRateLimit,
  moderateContent,
  sanitizeContent
};
