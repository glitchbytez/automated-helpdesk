# Chatbot Data Service Technical Architecture

## Overview

The Chatbot Data Service is a specialized Node.js microservice responsible for knowledge base management, document processing, and vector embeddings. It bridges the gap between uploaded documents and AI-powered semantic search by converting text content into searchable vector embeddings using OpenAI's embedding models and storing them in Milvus vector database.

## Technology Stack

### Core Technologies
- **Node.js 18+**: JavaScript runtime environment
- **Express.js 4.21.2**: RESTful API framework
- **Multer 1.4.5-lts.1**: File upload middleware

### AI/ML Integration
- **OpenAI API**: Text embedding generation (`text-embedding-3-small`)
- **PDF-Parse**: Document text extraction
- **Natural Language Processing**: Text chunking and preprocessing

### Vector Database
- **Milvus 2.5.5**: High-performance vector database
- **Vector Similarity Search**: Cosine similarity-based retrieval
- **Collection Management**: Dynamic schema management

## System Architecture

### High-Level Data Flow

```
Document Upload → Text Extraction → Text Chunking → Embedding Generation → Vector Storage
                                                                                  ↓
User Query → Query Embedding → Similarity Search → Ranked Results → Response
```

### Service Components

```
chatbot-data-service/
├── server.js                 # Express server entry point
├── middleware/                # Request processing middleware
│   ├── errorHandler.js       # Global error handling
│   └── validation.js         # Input validation
├── services/                  # Core business logic
│   ├── embeddingService.js   # OpenAI integration
│   └── milvusService.js      # Vector database operations
├── utils/                    # Utility functions
│   ├── textProcessor.js      # Text chunking and cleanup
│   └── fileHandler.js        # File processing utilities
└── uploads/                  # Temporary file storage
```

## Core Services

### 1. Embedding Service

Handles OpenAI API integration for vector embedding generation.

```javascript
// services/embeddingService.js
class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000,
      maxRetries: 3
    });
    this.model = process.env.OPENAI_MODEL || 'text-embedding-3-small';
    this.maxTokens = 8191; // Model token limit
    this.batchSize = 100;  // OpenAI batch limit
  }

  async generateEmbedding(text) {
    try {
      // Preprocess text
      const processedText = this.preprocessText(text);
      
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: processedText,
        encoding_format: 'float'
      });

      return {
        embedding: response.data[0].embedding,
        tokenCount: response.usage.total_tokens,
        model: this.model
      };
    } catch (error) {
      if (error.code === 'context_length_exceeded') {
        // Handle long text by chunking
        return await this.generateEmbeddingForLongText(text);
      }
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts) {
    const results = [];
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      
      try {
        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
          encoding_format: 'float'
        });

        const batchResults = response.data.map((item, index) => ({
          text: batch[index],
          embedding: item.embedding,
          index: i + index
        }));

        results.push(...batchResults);
        
        // Rate limiting delay
        if (i + this.batchSize < texts.length) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`Batch ${i} failed:`, error);
        // Add error handling for failed batches
        throw error;
      }
    }

    return results;
  }

  preprocessText(text) {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:-]/g, '')
      .substring(0, this.maxTokens * 4); // Rough token estimation
  }
}
```

### 2. Milvus Service

Manages vector database operations and collection management.

```javascript
// services/milvusService.js
class MilvusService {
  constructor() {
    this.client = new MilvusClient({
      address: process.env.MILVUS_HOST || 'localhost:19530',
      username: process.env.MILVUS_USERNAME,
      password: process.env.MILVUS_PASSWORD,
      timeout: 30000
    });
    this.collectionName = process.env.COLLECTION_NAME || 'knowledge_base';
    this.dimension = 1536; // text-embedding-3-small dimension
  }

  async initializeCollection() {
    try {
      const hasCollection = await this.client.hasCollection({
        collection_name: this.collectionName
      });

      if (process.env.FORCE_RECREATE_COLLECTION === 'true' || !hasCollection.value) {
        if (hasCollection.value) {
          await this.dropCollection();
        }
        await this.createCollection();
      }

      await this.loadCollection();
    } catch (error) {
      console.error('Collection initialization failed:', error);
      throw error;
    }
  }

  async createCollection() {
    const collectionSchema = {
      collection_name: this.collectionName,
      fields: [
        {
          name: 'id',
          description: 'Unique identifier',
          data_type: 'VarChar',
          max_length: 100,
          is_primary_key: true
        },
        {
          name: 'content',
          description: 'Original text content',
          data_type: 'VarChar',
          max_length: 2000
        },
        {
          name: 'embedding',
          description: 'Vector representation',
          data_type: 'FloatVector',
          dim: this.dimension
        },
        {
          name: 'metadata',
          description: 'Document metadata',
          data_type: 'JSON'
        },
        {
          name: 'timestamp',
          description: 'Upload timestamp',
          data_type: 'Int64'
        }
      ]
    };

    await this.client.createCollection(collectionSchema);

    // Create vector index
    await this.createIndex();
  }

  async createIndex() {
    const indexParams = {
      collection_name: this.collectionName,
      field_name: 'embedding',
      index_type: 'IVF_FLAT',
      metric_type: 'COSINE',
      params: {
        nlist: 1024
      }
    };

    await this.client.createIndex(indexParams);
  }

  async insertDocuments(documents) {
    const insertData = documents.map(doc => ({
      id: doc.id,
      content: doc.content,
      embedding: doc.embedding,
      metadata: JSON.stringify(doc.metadata),
      timestamp: Date.now()
    }));

    const result = await this.client.insert({
      collection_name: this.collectionName,
      data: insertData
    });

    return result;
  }

  async searchSimilar(queryEmbedding, limit = 5, threshold = 0.7) {
    const searchParams = {
      collection_name: this.collectionName,
      vectors: [queryEmbedding],
      vector_field_name: 'embedding',
      limit: limit,
      metric_type: 'COSINE',
      params: {
        nprobe: 16
      },
      output_fields: ['content', 'metadata', 'timestamp']
    };

    const results = await this.client.search(searchParams);
    
    // Filter by similarity threshold and parse metadata
    return results[0]?.filter(result => result.score >= threshold)
                     .map(result => ({
                       ...result,
                       metadata: JSON.parse(result.metadata)
                     })) || [];
  }

  async getCollectionStats() {
    const stats = await this.client.getCollectionStatistics({
      collection_name: this.collectionName
    });

    return {
      row_count: parseInt(stats.data.row_count),
      size_in_bytes: parseInt(stats.data.size),
      index_building_progress: stats.data.index_building_progress || '100%'
    };
  }
}
```

### 3. Text Processing Pipeline

Handles document processing and text chunking strategies.

```javascript
// utils/textProcessor.js
class TextProcessor {
  constructor() {
    this.maxChunkSize = 1000;
    this.overlapSize = 100;
    this.minChunkSize = 50;
  }

  async extractTextFromPDF(filePath) {
    try {
      const pdfBuffer = fs.readFileSync(filePath);
      const pdfData = await pdf(pdfBuffer);
      
      return {
        text: pdfData.text,
        pages: pdfData.numpages,
        metadata: {
          title: pdfData.info?.Title || 'Unknown',
          author: pdfData.info?.Author || 'Unknown',
          creator: pdfData.info?.Creator || 'Unknown',
          pages: pdfData.numpages
        }
      };
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  chunkText(text, options = {}) {
    const {
      maxChunkSize = this.maxChunkSize,
      overlap = this.overlapSize,
      preserveSentences = true
    } = options;

    if (text.length <= maxChunkSize) {
      return [{
        content: text.trim(),
        startIndex: 0,
        endIndex: text.length,
        chunkIndex: 0
      }];
    }

    const chunks = [];
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < text.length) {
      let endPosition = Math.min(currentPosition + maxChunkSize, text.length);
      
      // Try to break at sentence boundaries
      if (preserveSentences && endPosition < text.length) {
        const sentenceEnd = this.findSentenceBreak(text, currentPosition, endPosition);
        if (sentenceEnd > currentPosition + this.minChunkSize) {
          endPosition = sentenceEnd;
        }
      }

      const chunkContent = text.substring(currentPosition, endPosition).trim();
      
      if (chunkContent.length >= this.minChunkSize) {
        chunks.push({
          content: chunkContent,
          startIndex: currentPosition,
          endIndex: endPosition,
          chunkIndex: chunkIndex++
        });
      }

      // Move to next chunk with overlap
      currentPosition = Math.max(endPosition - overlap, currentPosition + 1);
    }

    return chunks;
  }

  findSentenceBreak(text, start, maxEnd) {
    const sentenceEnders = /[.!?]\s+/g;
    let match;
    let lastMatch = start;

    sentenceEnders.lastIndex = start;
    
    while ((match = sentenceEnders.exec(text)) !== null) {
      if (match.index > maxEnd) break;
      lastMatch = match.index + match[0].length;
    }

    return lastMatch;
  }

  cleanText(text) {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove special characters but keep punctuation
      .replace(/[^\w\s.,!?;:\-'"()]/g, '')
      // Remove multiple punctuation
      .replace(/([.!?]){2,}/g, '$1')
      // Trim
      .trim();
  }
}
```

## API Endpoints

### Document Upload Endpoint

```javascript
// POST /api/upload
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded',
        code: 'MISSING_FILE'
      });
    }

    // Validate file type
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'Only PDF files are supported',
        code: 'INVALID_FILE_TYPE'
      });
    }

    // Extract text from PDF
    const extractedData = await textProcessor.extractTextFromPDF(req.file.path);
    
    // Clean and chunk text
    const cleanedText = textProcessor.cleanText(extractedData.text);
    const chunks = textProcessor.chunkText(cleanedText);

    // Generate embeddings for all chunks
    const chunkTexts = chunks.map(chunk => chunk.content);
    const embeddingResults = await embeddingService.generateBatchEmbeddings(chunkTexts);

    // Prepare documents for insertion
    const documents = embeddingResults.map((result, index) => ({
      id: `${req.file.filename}_chunk_${index}`,
      content: result.text,
      embedding: result.embedding,
      metadata: {
        filename: req.file.originalname,
        chunkIndex: index,
        totalChunks: chunks.length,
        startIndex: chunks[index].startIndex,
        endIndex: chunks[index].endIndex,
        documentMetadata: extractedData.metadata,
        uploadedAt: new Date().toISOString(),
        processingVersion: '1.0'
      }
    }));

    // Insert into Milvus
    const insertResult = await milvusService.insertDocuments(documents);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Document processed successfully',
      data: {
        filename: req.file.originalname,
        chunksProcessed: documents.length,
        totalTokens: embeddingResults.reduce((sum, r) => sum + (r.tokenCount || 0), 0),
        insertedIds: insertResult.IDs
      }
    });

  } catch (error) {
    console.error('Upload processing error:', error);
    
    // Clean up file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Document processing failed',
      message: error.message,
      code: 'PROCESSING_ERROR'
    });
  }
});
```

### Semantic Search Endpoint

```javascript
// GET /api/search
app.get('/api/search', async (req, res) => {
  try {
    const { 
      query, 
      limit = 5, 
      threshold = 0.7,
      includeContent = true 
    } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Query parameter is required',
        code: 'MISSING_QUERY'
      });
    }

    // Generate embedding for search query
    const queryEmbedding = await embeddingService.generateEmbedding(query);

    // Search for similar documents
    const searchResults = await milvusService.searchSimilar(
      queryEmbedding.embedding,
      parseInt(limit),
      parseFloat(threshold)
    );

    // Format results
    const formattedResults = searchResults.map(result => ({
      content: includeContent === 'true' ? result.content : null,
      similarity: result.score,
      metadata: result.metadata,
      id: result.id
    }));

    res.json({
      success: true,
      query: query,
      results: formattedResults,
      totalResults: searchResults.length,
      searchMetadata: {
        threshold: parseFloat(threshold),
        queryEmbeddingModel: queryEmbedding.model,
        searchTime: Date.now()
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search operation failed',
      message: error.message,
      code: 'SEARCH_ERROR'
    });
  }
});
```

## Error Handling and Resilience

### Comprehensive Error Handler

```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(`Error ${err.status || 500}: ${err.message}`);
  console.error('Stack trace:', err.stack);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, status: 404, code: 'RESOURCE_NOT_FOUND' };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, status: 400, code: 'DUPLICATE_ENTRY' };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, status: 400, code: 'VALIDATION_ERROR' };
  }

  // OpenAI API errors
  if (err.response?.status === 429) {
    error = { 
      message: 'Rate limit exceeded. Please try again later.',
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Milvus errors
  if (err.message?.includes('Milvus')) {
    error = {
      message: 'Vector database operation failed',
      status: 503,
      code: 'DATABASE_ERROR'
    };
  }

  res.status(error.status || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      code: error.code || 'INTERNAL_ERROR',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack 
      })
    }
  });
};

module.exports = errorHandler;
```

### Circuit Breaker Pattern

```javascript
// utils/circuitBreaker.js
class CircuitBreaker {
  constructor(service, options = {}) {
    this.service = service;
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 30000;
    this.resetTimeout = options.resetTimeout || 60000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async call(method, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        this.service[method](...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), this.timeout)
        )
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}
```

## Performance Optimization

### Caching Layer

```javascript
// utils/cache.js
class DocumentCache {
  constructor(maxSize = 1000, ttl = 3600000) { // 1 hour TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.accessOrder = new Map(); // LRU tracking
  }

  get(key) {
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.ttl) {
      this.delete(key);
      return null;
    }

    // Update access order for LRU
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
    
    return cached.data;
  }

  set(key, data) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.keys().next().value;
      this.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    this.accessOrder.set(key, Date.now());
  }

  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }

  size() {
    return this.cache.size;
  }
}
```

### Batch Processing Queue

```javascript
// utils/batchProcessor.js
class BatchProcessor {
  constructor(processor, options = {}) {
    this.processor = processor;
    this.batchSize = options.batchSize || 10;
    this.maxWaitTime = options.maxWaitTime || 1000;
    this.queue = [];
    this.processing = false;
    this.timer = null;
  }

  async add(item) {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.processBatch(), this.maxWaitTime);
      }
    });
  }

  async processBatch() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      const results = await this.processor(batch.map(b => b.item));
      
      batch.forEach((batchItem, index) => {
        batchItem.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(batchItem => {
        batchItem.reject(error);
      });
    } finally {
      this.processing = false;
      
      // Process remaining items
      if (this.queue.length > 0) {
        setImmediate(() => this.processBatch());
      }
    }
  }
}
```

---

*This architecture provides a robust, scalable foundation for document processing and semantic search capabilities, optimized for AI-powered knowledge retrieval.*

*Last updated: [Current Date]*
*Version: 1.0* 