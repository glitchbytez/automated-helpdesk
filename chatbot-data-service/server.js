#!/usr/bin/env node
/**
 * Milvus Document Management API
 * A Node.js Express API for managing documents in Milvus vector database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');

// Import custom modules
const MilvusService = require('./services/milvusService');
const { EmbeddingService } = require('./services/embeddingService');
const { validateDocument, validateDocuments } = require('./middleware/validation');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5502;

// ========== MIDDLEWARE ==========
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// File upload configuration
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// ========== INITIALIZE SERVICES ==========
let milvusService;
let embeddingService;

async function initializeServices() {
  try {
    embeddingService = new EmbeddingService();
    milvusService = new MilvusService(embeddingService);
    await milvusService.initialize();
    console.log('✅ Services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize services:', error.message);
    process.exit(1);
  }
}

// ========== API ROUTES ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get collection info
app.get('/api/collection/info', async (req, res, next) => {
  try {
    const info = await milvusService.getCollectionInfo();
    res.json(info);
  } catch (error) {
    next(error);
  }
});

// Collection management endpoint
app.post('/api/collection/recreate', async (req, res, next) => {
  try {
    await milvusService.forceRecreateCollection();
    res.json({ 
      success: true, 
      message: 'Collection recreated successfully',
      collection_name: milvusService.collectionName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Search documents
app.post('/api/documents/search', async (req, res, next) => {
  try {
    const { query, limit = 10, offset = 0 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query parameter is required and must be a string' });
    }

    const results = await milvusService.searchDocuments(query, limit, offset);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// Note: Individual document retrieval removed for LangChain simplicity
// Use vector search instead to find specific documents

// Add single document
app.post('/api/documents', validateDocument, async (req, res, next) => {
  try {
    const document = req.body;
    const result = await milvusService.addDocument(document);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Add multiple documents via JSON upload
app.post('/api/documents/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fs = require('fs');
    const filePath = req.file.path;
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const documents = JSON.parse(fileContent);
      
      // Validate documents array
      if (!Array.isArray(documents)) {
        return res.status(400).json({ error: 'File must contain an array of documents' });
      }

      const result = await milvusService.addDocuments(documents);
      res.status(201).json(result);
    } finally {
      // Clean up uploaded file
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    next(error);
  }
});

// Add multiple documents via JSON body
app.post('/api/documents/bulk', validateDocuments, async (req, res, next) => {
  try {
    const { documents } = req.body;
    const result = await milvusService.addDocuments(documents);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// Note: Update and delete operations removed for LangChain simplicity
// To modify documents, recreate the collection with new data

// Note: Collection statistics removed - use /api/collection/info for basic info

// ========== ERROR HANDLING ==========
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========== START SERVER ==========
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
      console.log(`🔗 Collection: ${process.env.COLLECTION_NAME || 'test'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  if (milvusService) {
    await milvusService.disconnect();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  if (milvusService) {
    await milvusService.disconnect();
  }
  process.exit(0);
});

startServer(); 