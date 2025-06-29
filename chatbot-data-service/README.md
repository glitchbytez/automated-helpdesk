# Milvus Document Management API

A production-ready Node.js Express API for managing documents in a Milvus vector database with **native Milvus SDK** and **OpenAI embeddings**, specifically optimized for **Rasa Enterprise Search Policy** integration.

## 🎯 Rasa Enterprise Search Integration

This API is **specifically designed** for seamless integration with Rasa Enterprise Search Policy:

- ✅ **Exact Field Names**: Uses `pk`, `text`, `vector` fields that Rasa expects
- ✅ **Compatible Schema**: Native Milvus schema without LangChain prefixes  
- ✅ **Optimal Performance**: Pure Milvus SDK for maximum efficiency
- ✅ **Production Ready**: Clean codebase with only essential dependencies

## 🚀 Key Features

- 🎯 **Rasa Compatible**: Exact field schema for Rasa Enterprise Search Policy
- 🔧 **Pure Milvus**: Native Milvus SDK for optimal performance
- 💾 **Data Preservation**: Smart collection management preserves existing data
- 📁 **Document Management**: Add single documents with automatic chunking
- 📦 **Bulk Operations**: Upload multiple documents via JSON file or API
- 🔍 **Vector Search**: Semantic search using OpenAI embeddings
- ✂️ **Text Chunking**: Intelligent text splitting with overlap
- 🛡️ **Production Ready**: Rate limiting, CORS, validation, and error handling
- ⚙️ **Collection Management**: Force recreation when needed
- 🧹 **Clean Dependencies**: Only essential packages, no bloat

## 📋 Collection Schema

The API creates collections with the **exact schema** that Rasa Enterprise Search Policy expects:

| Field | Type | Description |
|-------|------|-------------|
| `pk` | VarChar (Primary Key) | Document chunk identifier |
| `text` | VarChar | Document text content |
| `vector` | FloatVector (1536d) | OpenAI embedding vector |

## 🧠 Smart Collection Management

### Data Preservation
- ✅ **Preserves existing data** on server restart
- ✅ **Schema compatibility check** before recreation
- ✅ **Only recreates** when schema is incompatible
- ✅ **Force recreation** options available

### Collection Lifecycle
1. **Startup**: Check if collection exists
2. **Compatibility**: Validate schema matches Rasa requirements
3. **Preserve**: Reuse compatible collections with existing data
4. **Recreate**: Only when schema is incompatible or forced

## 🏗️ Quick Start

### Prerequisites

- Node.js 16+ 
- Milvus database running
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd chatbot-data-service
npm install
```

2. **Create environment file:**
```bash
cp .env.example .env
```

3. **Configure your `.env` file:**
```env
PORT=5502
OPENAI_API_KEY=your_openai_api_key_here
MILVUS_HOST=localhost
MILVUS_PORT=19530
COLLECTION_NAME=test
FORCE_RECREATE_COLLECTION=false
OPENAI_MODEL=text-embedding-3-small
```

4. **Start the server:**
```bash
# Development mode (preserves existing data)
npm run dev

# Force fresh start (recreates collection)
FORCE_RECREATE_COLLECTION=true npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Core API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check and API status |
| GET | `/api/collection/info` | Collection information and statistics |
| POST | `/api/collection/recreate` | Force recreate collection (⚠️ deletes data) |
| POST | `/api/documents` | Add single document |
| POST | `/api/documents/upload` | Upload JSON file with documents |
| POST | `/api/documents/bulk` | Bulk add via JSON payload |
| POST | `/api/documents/search` | Semantic vector search |

## 💡 Usage Examples

### Health Check

```bash
curl http://localhost:5502/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-21T06:29:10.814Z",
  "version": "1.0.0",
  "uptime": "2h 15m 30s"
}
```

### Collection Information

```bash
curl http://localhost:5502/api/collection/info
```

**Response:**
```json
{
  "collection_name": "test",
  "status": "Ready for Rasa Enterprise Search",
  "vector_store_ready": true,
  "embedding_model": "text-embedding-3-small",
  "optimized_for": "Rasa Enterprise Search Policy",
  "field_schema": {
    "pk": "VarChar (Primary Key)",
    "text": "VarChar (Text Field)",
    "vector": "FloatVector (Vector Field for Rasa)"
  },
  "document_count": 10,
  "has_documents": true
}
```

### Add Single Document

```bash
curl -X POST http://localhost:5502/api/documents \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Rasa Documentation",
    "content": "Rasa Enterprise Search Policy allows you to search through documents using vector similarity.",
    "url": "https://rasa.com/docs/rasa-pro/enterprise-search"
  }'
```

### Search Documents

```bash
curl -X POST http://localhost:5502/api/documents/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How does Rasa Enterprise Search work?",
    "limit": 5,
    "offset": 0
  }'
```

### Bulk Upload Documents

```bash
curl -X POST http://localhost:5502/api/documents/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "title": "Rasa Forms",
        "content": "Rasa forms are used to collect information from users through conversation.",
        "url": "https://rasa.com/docs/rasa/forms"
      },
      {
        "title": "Rasa Actions",
        "content": "Custom actions allow you to run any code you want in response to user messages.",
        "url": "https://rasa.com/docs/rasa/custom-actions"
      }
    ]
  }'
```

### Upload JSON File

```bash
curl -X POST http://localhost:5502/api/documents/upload \
  -F "file=@documents.json"
```

## 🔧 Troubleshooting

### Connection Issues

The service includes robust connection handling for Milvus:

#### Automatic Retry Logic
- **Connection Retries**: Up to 15 attempts with exponential backoff
- **Service Initialization**: Multiple retry attempts with configurable delays
- **Background Recovery**: Continues trying to connect even after initial failure

#### Environment Variables for Connection Tuning
```env
# Milvus connection retry settings
MILVUS_MAX_RETRIES=15                    # Max connection attempts
MILVUS_RETRY_DELAY=5000                  # Initial delay (5 seconds)

# Service initialization settings  
SERVICE_INIT_MAX_RETRIES=5               # Service init attempts
SERVICE_INIT_RETRY_DELAY=10000           # Delay between init attempts (10 seconds)
BACKGROUND_RETRY_INTERVAL=30000          # Background retry frequency (30 seconds)
```

#### Health Status Monitoring
The service provides detailed health information:
- **Service Status**: Shows if services are ready or initializing
- **Component Status**: Individual status for Milvus and embedding services
- **Graceful Degradation**: Server stays running even if Milvus is temporarily unavailable

#### Common Connection Errors

**DNS Resolution Failed**: 
```
Error: 14 UNAVAILABLE: Name resolution failed for target dns:milvus:19530
```
- **Cause**: Milvus container not ready or network issues
- **Solution**: Service automatically retries with exponential backoff

**Milvus Proxy Not Ready**:
```
Error: 2 UNKNOWN: service unavailable: internal: Milvus Proxy is not ready yet. please wait
```
- **Cause**: Milvus container started but service not fully initialized  
- **Solution**: Automatic retry logic waits for Milvus to be fully ready

#### Testing Connection
Use the included test script:
```bash
node test-health.js
```

### Docker Compose Improvements

The docker-compose.yml now includes:
- **Health Checks**: Proper health checks for all dependent services
- **Service Dependencies**: Wait for services to be healthy before starting
- **Restart Policies**: Automatic restart on failure
- **Startup Order**: Correct dependency chain (etcd → minio → milvus → chatbot-data-service)

### Force Recreate Collection

⚠️ **Warning: This deletes all existing data**

```bash
curl -X POST http://localhost:5502/api/collection/recreate
```

## 📄 Document Format

### Standard Document Format
```json
{
  "title": "Document Title",
  "content": "Document content that will be embedded and searched...",
  "url": "https://source-url.com"
}
```

### Bulk Documents Format
```json
{
  "documents": [
    {
      "title": "Document 1",
      "content": "Content of document 1...",
      "url": "https://example1.com"
    },
    {
      "title": "Document 2", 
      "content": "Content of document 2...",
      "url": "https://example2.com"
    }
  ]
}
```

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5502 | Server port |
| `MILVUS_HOST` | localhost | Milvus server host |
| `MILVUS_PORT` | 19530 | Milvus server port |
| `COLLECTION_NAME` | test | Milvus collection name |
| `OPENAI_API_KEY` | - | OpenAI API key (required) |
| `OPENAI_MODEL` | text-embedding-3-small | OpenAI embedding model |
| `FORCE_RECREATE_COLLECTION` | false | Force recreate collection on startup |

### Text Chunking Configuration

- **Chunk Size**: 1000 characters
- **Chunk Overlap**: 200 characters
- **Embedding Model**: `text-embedding-3-small` (1536 dimensions)
- **Vector Index**: IVF_FLAT with COSINE similarity

## 🐳 Docker Deployment

### Quick Start with Docker

1. **Clone the repository:**
```bash
git clone <repository-url>
cd chatbot-data-service
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. **Deploy with Docker Compose:**
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f chatbot-api

# Check service health
docker-compose ps
```

4. **Access the API:**
- API: http://localhost:5502
- Milvus: localhost:19530
- MinIO Console: http://localhost:9001

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `chatbot-api` | 5502 | Main Node.js API service |
| `milvus` | 19530, 9091 | Vector database |
| `minio` | 9000, 9001 | Object storage for Milvus |
| `etcd` | 2379 | Configuration store for Milvus |

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild API service
docker-compose build chatbot-api
docker-compose up -d chatbot-api

# View service logs
docker-compose logs -f chatbot-api
docker-compose logs -f milvus

# Clean up (removes data!)
docker-compose down -v
```

### Data Persistence

- **Milvus Data**: Stored in `milvus_data` volume
- **MinIO Data**: Stored in `minio_data` volume  
- **Upload Files**: Stored in `uploads_data` volume
- **Etcd Data**: Stored in `etcd_data` volume

## 🏢 Production Deployment

### Production Checklist
- ✅ Environment variables configured
- ✅ OpenAI API key provided in .env
- ✅ Docker and Docker Compose installed
- ✅ Firewall configured for required ports
- ✅ SSL/TLS certificates (for HTTPS)
- ✅ Monitoring and logging configured

### Collection Management Strategy

```bash
# Normal operation (preserves data)
npm start

# Development with fresh data  
FORCE_RECREATE_COLLECTION=true npm run dev

# Emergency reset via API
curl -X POST http://localhost:5502/api/collection/recreate
```

### Rasa Integration

Configure your Rasa `endpoints.yml`:

```yaml
action_endpoint:
  url: http://localhost:5055/webhook

vector_db:
  type: "milvus"
  host: "localhost"
  port: 19530
  collection_name: "test"  # Match your COLLECTION_NAME
```

## 🏗️ Architecture

```
├── server.js              # Main Express server
├── services/
│   ├── milvusService.js    # Pure Milvus SDK operations (Rasa compatible)
│   └── embeddingService.js # OpenAI embedding service
├── middleware/
│   ├── validation.js       # Request validation
│   └── errorHandler.js     # Error handling
├── uploads/                # Temporary file uploads
│   └── .gitkeep           # Preserves directory structure
├── package.json           # Dependencies (production-optimized)
└── .gitignore            # Comprehensive ignore patterns
```

## 🔧 Technology Stack

### Core Dependencies
- **@zilliz/milvus2-sdk-node**: Native Milvus operations
- **@langchain/openai**: OpenAI embeddings integration
- **express**: REST API framework
- **joi**: Request validation
- **multer**: File upload handling
- **uuid**: Unique identifier generation

### Security & Middleware
- **helmet**: Security headers
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting
- **dotenv**: Environment configuration

### Development
- **nodemon**: Development server with auto-restart

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Cross-origin resource sharing enabled
- **Helmet**: Security headers protection
- **Input Validation**: Joi schema validation
- **File Upload**: Size limits (50MB) and type checking
- **Error Handling**: Comprehensive error responses
- **Environment Variables**: Sensitive data protection

## 🔍 Error Handling

### Common Error Responses

```json
{
  "error": "Validation Error",
  "message": "Content cannot be empty",
  "details": ["Document content is required"]
}
```

```json
{
  "error": "OpenAI API Error", 
  "message": "Invalid API key provided"
}
```

```json
{
  "error": "Milvus Connection Error",
  "message": "Failed to connect to Milvus server"
}
```

## 🚀 Development

### Local Development (without Docker)
```bash
# Install dependencies
npm install

# Start local Milvus (requires separate installation)
# See: https://milvus.io/docs/install_standalone-docker.md

# Run in development mode (preserves data)
npm run dev

# Run with fresh collection
FORCE_RECREATE_COLLECTION=true npm run dev

# Production start
npm start
```

### Development with Docker
```bash
# Start only the database services
docker-compose up -d etcd minio milvus

# Run the API locally for development
npm run dev

# Or run everything in Docker
docker-compose up -d
```

### Project Structure
- Clean, production-ready codebase
- Only essential dependencies
- Comprehensive `.gitignore` and `.dockerignore`
- Docker containerization ready
- Proper error handling and security

## 🔧 Docker Troubleshooting

### Common Issues

**1. Services not starting:**
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs etcd
docker-compose logs milvus
docker-compose logs chatbot-api
```

**2. API can't connect to Milvus:**
```bash
# Ensure Milvus is healthy
docker-compose exec milvus curl -f http://localhost:9091/healthz

# Check network connectivity
docker-compose exec chatbot-api ping milvus
```

**3. Permission errors:**
```bash
# Fix upload directory permissions
sudo chown -R 1001:1001 uploads/
```

**4. Port conflicts:**
```bash
# Check what's using the ports
netstat -tulpn | grep :5502
netstat -tulpn | grep :19530

# Stop conflicting services or change ports in docker-compose.yml
```

### Health Checks

```bash
# API Health
curl http://localhost:5502/api/health

# Milvus Health  
curl http://localhost:9091/healthz

# MinIO Health
curl http://localhost:9000/minio/health/live
```

## 📊 Monitoring

### Health Checks
- **Endpoint**: `GET /api/health`
- **Collection Info**: `GET /api/collection/info`
- **Server Logs**: Comprehensive logging for debugging

### Performance Metrics
- Document count tracking
- Schema compatibility validation
- Vector search performance
- Embedding generation timing
- API response times

## 🔄 Production Optimization

### Performance Features
- ✅ **Minimal Dependencies**: Only essential packages installed
- ✅ **Native Milvus SDK**: Direct integration without LangChain overhead
- ✅ **Efficient Memory Usage**: Optimized for production workloads
- ✅ **Smart Caching**: Connection reuse and proper resource management
- ✅ **Error Recovery**: Graceful error handling and recovery

### Deployment Best Practices
- Environment-based configuration
- Proper logging and monitoring
- Security headers and rate limiting
- Clean codebase structure
- Git ignore patterns for sensitive files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper testing
4. Ensure all dependencies are necessary
5. Submit a pull request

## 📄 License

MIT License 