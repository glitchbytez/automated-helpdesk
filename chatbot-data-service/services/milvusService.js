const { MilvusClient, DataType } = require('@zilliz/milvus2-sdk-node');
const { v4: uuidv4 } = require('uuid');

class MilvusService {
  constructor(embeddingService, options = {}) {
    this.client = null;
    this.embeddingService = embeddingService;
    this.collectionName = process.env.COLLECTION_NAME || 'test';
    this.host = process.env.MILVUS_HOST || 'localhost';
    this.port = process.env.MILVUS_PORT || '19530';
    
    // Options for collection management
    this.forceRecreate = options.forceRecreate || process.env.FORCE_RECREATE_COLLECTION === 'true';
    
    // Text chunking configuration
    this.chunkSize = 1000;
    this.chunkOverlap = 200;
    
    // Connection retry configuration
    this.maxRetries = parseInt(process.env.MILVUS_MAX_RETRIES) || 10;
    this.retryDelay = parseInt(process.env.MILVUS_RETRY_DELAY) || 5000; // 5 seconds
    this.backoffMultiplier = 1.5;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForMilvus() {
    console.log('🔄 Waiting for Milvus to be ready...');
    let retryCount = 0;
    let delay = this.retryDelay;

    while (retryCount < this.maxRetries) {
      try {
        console.log(`🔗 Attempt ${retryCount + 1}/${this.maxRetries}: Connecting to Milvus at ${this.host}:${this.port}`);
        
        // Create a new client for each attempt
        if (this.client) {
          try {
            await this.client.closeConnection();
          } catch (e) {
            // Ignore errors when closing
          }
        }
        
        this.client = new MilvusClient({ address: `${this.host}:${this.port}` });
        
        // Test the connection with a simple operation
        await this.client.listCollections();
        
        console.log('✅ Successfully connected to Milvus');
        return true;
      } catch (error) {
        console.log(`❌ Connection attempt ${retryCount + 1} failed: ${error.message}`);
        
        retryCount++;
        if (retryCount >= this.maxRetries) {
          console.error(`❌ Failed to connect to Milvus after ${this.maxRetries} attempts`);
          throw new Error(`Unable to connect to Milvus at ${this.host}:${this.port} after ${this.maxRetries} attempts. Last error: ${error.message}`);
        }
        
        console.log(`⏳ Waiting ${delay/1000} seconds before retry...`);
        await this.sleep(delay);
        delay = Math.min(delay * this.backoffMultiplier, 60000); // Cap at 1 minute
      }
    }
    
    return false;
  }

  async initialize() {
    try {
      console.log('🔧 Initializing pure Milvus service for Rasa Enterprise Search...');
      console.log(`📋 Target collection: '${this.collectionName}' (Rasa-compatible)`);
      
      // Wait for Milvus to be ready with retry logic
      await this.waitForMilvus();
      
      // Check if collection exists and is compatible, otherwise create/recreate
      await this.ensureCompatibleCollection();
      
      console.log('✅ Pure Milvus service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Milvus service:', error);
      throw error;
    }
  }

  async ensureCompatibleCollection() {
    try {
      const collections = await this.client.listCollections();
      const collectionExists = collections.collection_names.includes(this.collectionName);
      
      if (collectionExists) {
        console.log(`🔍 Collection '${this.collectionName}' exists, checking compatibility...`);
        
        // Force recreate if requested
        if (this.forceRecreate) {
          console.log('🔄 Force recreate requested, dropping existing collection...');
          await this.client.dropCollection({ collection_name: this.collectionName });
        } else {
          // Check if existing collection has correct schema
          const isCompatible = await this.checkSchemaCompatibility();
          
          if (isCompatible) {
            console.log('✅ Existing collection is compatible with Rasa Enterprise Search');
            console.log('🔄 Reusing existing collection and preserving data');
            
            // Load collection if not already loaded
            await this.client.loadCollection({ collection_name: this.collectionName });
            return;
          } else {
            console.log('⚠️ Existing collection has incompatible schema');
            console.log('🗑️ Dropping incompatible collection to recreate with correct schema...');
            await this.client.dropCollection({ collection_name: this.collectionName });
          }
        }
      } else {
        console.log(`ℹ️ Collection '${this.collectionName}' does not exist`);
      }
      
      // Create new collection with correct schema
      console.log('🏗️ Creating new collection with Rasa-compatible schema...');
      await this.createRasaCompatibleCollection();
      
    } catch (error) {
      console.error('❌ Error ensuring compatible collection:', error);
      throw error;
    }
  }

  async checkSchemaCompatibility() {
    try {
      const schema = await this.client.describeCollection({ collection_name: this.collectionName });
      
      // Check if all required fields exist with correct types
      const fields = schema.schema.fields;
      const fieldMap = {};
      fields.forEach(field => {
        fieldMap[field.name] = field.data_type;
      });
      
      // Required fields for Rasa compatibility
      const requiredFields = {
        'pk': 'VarChar',
        'text': 'VarChar', 
        'vector': 'FloatVector'
      };
      
      // Check if all required fields exist with correct types
      for (const [fieldName, expectedType] of Object.entries(requiredFields)) {
        if (!fieldMap[fieldName]) {
          console.log(`❌ Missing required field: ${fieldName}`);
          return false;
        }
        if (fieldMap[fieldName] !== expectedType) {
          console.log(`❌ Field '${fieldName}' has wrong type: ${fieldMap[fieldName]} (expected: ${expectedType})`);
          return false;
        }
      }
      
      // Check primary key
      const primaryField = fields.find(f => f.is_primary_key);
      if (!primaryField || primaryField.name !== 'pk') {
        console.log(`❌ Primary key field is not 'pk'`);
        return false;
      }
      
      console.log('✅ Schema compatibility check passed');
      return true;
      
    } catch (error) {
      console.log(`❌ Error checking schema compatibility: ${error.message}`);
      return false;
    }
  }

  async dropCollectionIfExists() {
    try {
      const collections = await this.client.listCollections();
      const collectionExists = collections.collection_names.includes(this.collectionName);
      
      if (collectionExists) {
        console.log(`🗑️ Dropping existing collection '${this.collectionName}'...`);
        await this.client.dropCollection({ collection_name: this.collectionName });
        console.log('✅ Existing collection dropped');
      } else {
        console.log('ℹ️ No existing collection to drop');
      }
    } catch (error) {
      console.log('ℹ️ Could not check/drop existing collection:', error.message);
    }
  }

  async createRasaCompatibleCollection() {
    console.log('🏗️ Creating collection with exact Rasa Enterprise Search schema...');
    
    // Define exact schema that Rasa expects
    const fields = [
      {
        name: 'pk',
        data_type: DataType.VarChar,
        max_length: 65535,
        is_primary_key: true,
        auto_id: false
      },
      {
        name: 'text',
        data_type: DataType.VarChar,
        max_length: 65535
      },
      {
        name: 'vector',
        data_type: DataType.FloatVector,
        dim: 1536  // OpenAI text-embedding-3-small dimension
      }
    ];

    // Create collection
    const schema = {
      collection_name: this.collectionName,
      fields: fields,
      description: 'Collection with exact schema for Rasa Enterprise Search Policy'
    };

    await this.client.createCollection(schema);
    console.log(`✅ Collection '${this.collectionName}' created with Rasa schema`);

    // Create vector index
    console.log('📊 Creating vector index on "vector" field...');
    await this.client.createIndex({
      collection_name: this.collectionName,
      field_name: 'vector',
      index_type: 'IVF_FLAT',
      metric_type: 'COSINE',
      params: { nlist: 128 }
    });

    // Load collection into memory
    await this.client.loadCollection({ collection_name: this.collectionName });
    
    console.log('✅ Collection loaded and ready for Rasa Enterprise Search');
  }

  async addDocument(document) {
    try {
      const { title = '', content = '', url = '' } = document;
      
      if (!content.trim()) {
        throw new Error('Document content cannot be empty');
      }

      console.log(`📄 Processing document: "${title || 'Untitled'}"`);

      // Create searchable text
      const searchableText = this.formatDocumentText(title, content, url);
      
      // Split into chunks
      const chunks = this.splitText(searchableText);
      console.log(`✂️ Split into ${chunks.length} chunks`);

      // Process each chunk
      const processedChunks = [];
      for (const chunk of chunks) {
        processedChunks.push({
          text: chunk,
          metadata: {
            title: title,
            url: url,
            doc_id: uuidv4(),
            content_length: content.length,
            has_url: !!url,
            created_at: new Date().toISOString()
          }
        });
      }

      // Insert chunks into Milvus
      await this.insertChunks(processedChunks);

      return {
        success: true,
        doc_id: processedChunks[0].metadata.doc_id,
        title: title,
        chunks_created: chunks.length,
        content_length: content.length
      };
    } catch (error) {
      console.error('❌ Error adding document:', error);
      throw error;
    }
  }

  async addDocuments(documents) {
    try {
      if (!Array.isArray(documents) || documents.length === 0) {
        throw new Error('Documents must be a non-empty array');
      }

      console.log(`📚 Processing ${documents.length} documents with pure Milvus...`);

      const allChunks = [];
      const processedDocs = [];
      const errors = [];

      // Process each document
      for (let i = 0; i < documents.length; i++) {
        try {
          const { title = '', content = '', url = '' } = documents[i];
          
          if (!content.trim()) {
            errors.push({ index: i, error: 'Content cannot be empty' });
            continue;
          }

          // Create searchable text
          const searchableText = this.formatDocumentText(title, content, url);
          
          // Split into chunks
          const chunks = this.splitText(searchableText);
          
          const docId = uuidv4();
          for (const chunk of chunks) {
            allChunks.push({
              text: chunk,
              metadata: {
                title: title,
                url: url,
                doc_id: docId,
                content_length: content.length,
                has_url: !!url,
                created_at: new Date().toISOString()
              }
            });
          }
          
          processedDocs.push({
            doc_id: docId,
            title: title,
            chunks: chunks.length
          });

        } catch (error) {
          errors.push({ index: i, error: error.message });
        }
      }

      console.log(`✂️ Created ${allChunks.length} total chunks from ${processedDocs.length} documents`);

      // Insert all chunks into Milvus
      if (allChunks.length > 0) {
        await this.insertChunks(allChunks);
      }

      return {
        success: true,
        total_documents: documents.length,
        processed_documents: processedDocs.length,
        total_chunks: allChunks.length,
        documents: processedDocs,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('❌ Error adding documents:', error);
      throw error;
    }
  }

  async insertChunks(chunks) {
    console.log(`📝 Inserting ${chunks.length} chunks using pure Milvus SDK...`);
    
    // Generate embeddings for all chunks
    const textContents = chunks.map(chunk => chunk.text);
    const embeddings = await this.generateEmbeddings(textContents);
    
    // Prepare data in the format Milvus expects (array of objects)
    const insertData = [];
    for (let i = 0; i < chunks.length; i++) {
      insertData.push({
        pk: chunks[i].metadata.doc_id,
        text: chunks[i].text,
        vector: embeddings[i]
      });
    }
    
    console.log(`🔍 Inserting ${insertData.length} records into collection '${this.collectionName}'`);
    
    // Insert data into the exact fields Rasa expects
    await this.client.insert({
      collection_name: this.collectionName,
      data: insertData
    });
    
    // Flush to ensure data is persisted
    await this.client.flush({ collection_names: [this.collectionName] });
    
    console.log(`✅ Successfully inserted ${chunks.length} chunks into 'vector' field`);
  }

  async generateEmbeddings(texts) {
    console.log(`🧮 Generating embeddings for ${texts.length} text chunks...`);
    
    // Use OpenAI directly for embeddings
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: texts,
        model: 'text-embedding-3-small'
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data.map(item => item.embedding);
  }

  splitText(text) {
    // Simple text splitting (can be enhanced later)
    const chunks = [];
    const textLength = text.length;
    
    if (textLength <= this.chunkSize) {
      return [text];
    }
    
    let start = 0;
    while (start < textLength) {
      let end = start + this.chunkSize;
      
      // Try to break at word boundary
      if (end < textLength) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }
      
      chunks.push(text.slice(start, end).trim());
      start = end - this.chunkOverlap;
      
      if (start >= textLength) break;
    }
    
    return chunks.filter(chunk => chunk.length > 0);
  }

  formatDocumentText(title, content, url) {
    let text = '';
    
    if (title) {
      text += `Title: ${title}\n\n`;
    }
    
    text += `Content: ${content}`;
    
    if (url) {
      text += `\n\nSource: ${url}`;
    }
    
    return text;
  }

  async searchDocuments(query, limit = 10, offset = 0) {
    try {
      console.log(`🔍 Searching for: "${query}"`);

      // Generate embedding for query
      const queryEmbeddings = await this.generateEmbeddings([query]);
      const queryVector = queryEmbeddings[0];

      // Perform vector search using pure Milvus
      const searchResults = await this.client.search({
        collection_name: this.collectionName,
        vector: queryVector,
        filter: '',
        limit: limit + offset,
        output_fields: ['pk', 'text'],
        params: { nprobe: 10 }
      });

      // Format results
      const documents = searchResults.results
        .slice(offset, offset + limit)
        .map(result => ({
          id: result.pk,
          content: this.extractContentFromText(result.text),
          pageContent: result.text,
          score: result.score,
          similarity: Math.round((1 - result.score) * 100)
        }));

      console.log(`📊 Found ${searchResults.results.length} results, returning ${documents.length}`);

      return {
        query,
        total_results: searchResults.results.length,
        returned_count: documents.length,
        documents,
        collection: this.collectionName
      };
    } catch (error) {
      console.error('❌ Error searching documents:', error);
      throw error;
    }
  }

  extractContentFromText(text) {
    // Extract content from formatted text
    const contentMatch = text.match(/Content: (.*?)(?:\n\nSource:|$)/s);
    return contentMatch ? contentMatch[1].trim() : text;
  }

  async getCollectionInfo() {
    try {
      const info = {
        collection_name: this.collectionName,
        milvus_host: this.host,
        milvus_port: this.port,
        status: 'Ready for Rasa Enterprise Search',
        vector_store_ready: true,
        embedding_model: 'text-embedding-3-small',
        optimized_for: 'Rasa Enterprise Search Policy',
        field_schema: {
          pk: 'VarChar (Primary Key)',
          text: 'VarChar (Text Field)',
          vector: 'FloatVector (Vector Field for Rasa)'
        },
        text_splitter: {
          chunk_size: this.chunkSize,
          chunk_overlap: this.chunkOverlap
        },
        index_config: {
          type: 'IVF_FLAT',
          metric: 'COSINE'
        }
      };

      // Check if collection has documents
      try {
        const stats = await this.client.getCollectionStatistics({
          collection_name: this.collectionName
        });
        info.document_count = parseInt(stats.row_count) || 0;
        info.has_documents = info.document_count > 0;
      } catch (error) {
        info.document_count = 0;
        info.has_documents = false;
      }

      return info;
    } catch (error) {
      console.error('❌ Error getting collection info:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.closeConnection();
        this.client = null;
      }
      console.log('✅ Disconnected from Milvus');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }

  async forceRecreateCollection() {
    console.log('🔄 Force recreating collection...');
    try {
      // Drop if exists
      const collections = await this.client.listCollections();
      const collectionExists = collections.collection_names.includes(this.collectionName);
      
      if (collectionExists) {
        console.log(`🗑️ Dropping existing collection '${this.collectionName}'...`);
        await this.client.dropCollection({ collection_name: this.collectionName });
      }
      
      // Create new collection
      await this.createRasaCompatibleCollection();
      console.log('✅ Collection recreated successfully');
      
    } catch (error) {
      console.error('❌ Error force recreating collection:', error);
      throw error;
    }
  }
}

module.exports = MilvusService;