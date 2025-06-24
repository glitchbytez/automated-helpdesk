const Joi = require('joi');

// Document schema - simplified to match Python script
const documentSchema = Joi.object({
  title: Joi.string().max(1000).default(''),
  content: Joi.string().required().min(1).max(65000),
  url: Joi.string().uri().max(2000).default('').allow(''),
});

// Documents array schema
const documentsSchema = Joi.object({
  documents: Joi.array().items(documentSchema).min(1).required(),
});

const validateDocument = (req, res, next) => {
  const { error, value } = documentSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message),
    });
  }
  
  req.body = value;
  next();
};

const validateDocuments = (req, res, next) => {
  const { error, value } = documentsSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      error: 'Validation failed',
      details: error.details.map(detail => detail.message),
      note: 'Expected format: {"documents": [{"title": "...", "content": "...", "url": "..."}]}',
    });
  }
  
  req.body = value;
  next();
};

module.exports = {
  validateDocument,
  validateDocuments,
  documentSchema,
}; 