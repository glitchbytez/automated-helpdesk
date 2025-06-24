const { OpenAIEmbeddings } = require('@langchain/openai');

class EmbeddingService {
  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_MODEL || 'text-embedding-3-small',
    });
  }

  async getEmbedding(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Text must be a non-empty string');
      }

      const embedding = await this.embeddings.embedQuery(text.trim());
      return embedding;
    } catch (error) {
      console.error('❌ Error generating embedding:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async getEmbeddings(texts) {
    try {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('Texts must be a non-empty array');
      }

      const validTexts = texts.filter(text => text && typeof text === 'string' && text.trim());
      
      if (validTexts.length === 0) {
        throw new Error('No valid texts provided');
      }

      const embeddings = await this.embeddings.embedDocuments(validTexts.map(text => text.trim()));
      return embeddings;
    } catch (error) {
      console.error('❌ Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  // Get the LangChain embeddings instance for use with vector stores
  getLangChainEmbeddings() {
    return this.embeddings;
  }
}

module.exports = { EmbeddingService }; 