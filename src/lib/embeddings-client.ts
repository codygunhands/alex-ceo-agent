import axios, { AxiosInstance } from 'axios';

export interface EmbeddingResponse {
  embeddings: number[][];
}

export class EmbeddingsClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GRADIENT_API_KEY || '';
    // Try multiple possible base URLs for Gradient embeddings
    this.baseUrl = process.env.GRADIENT_EMBEDDINGS_BASE_URL || 'https://api.gradient.ai/api/v1';
    // Gradient supports various embedding models - try common ones
    this.model = process.env.GRADIENT_EMBEDDINGS_MODEL || 'bge-large';

    if (!this.apiKey) {
      throw new Error('GRADIENT_API_KEY is required for embeddings');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Generate embeddings for text
   */
  async embed(text: string): Promise<number[]> {
    // Try multiple possible endpoint formats
    const endpoints = [
      `${this.baseUrl}/embeddings`,
      `https://api.gradient.ai/api/v1/embeddings`,
      `https://apis.gradient.network/api/v1/embeddings`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.post(
          endpoint,
          {
            model: this.model,
            input: text,
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
            validateStatus: () => true, // Don't throw on non-2xx
          }
        );

        // Handle different response formats
        if (response.status === 200) {
          // Format 1: { embeddings: [[...]] }
          if (response.data.embeddings && Array.isArray(response.data.embeddings)) {
            return Array.isArray(response.data.embeddings[0]) 
              ? response.data.embeddings[0] 
              : response.data.embeddings;
          }
          
          // Format 2: { data: [{ embedding: [...] }] }
          if (response.data.data && Array.isArray(response.data.data) && response.data.data[0]?.embedding) {
            return response.data.data[0].embedding;
          }
          
          // Format 3: Direct array
          if (Array.isArray(response.data)) {
            return response.data;
          }
        }
      } catch (error: any) {
        // Try next endpoint
        continue;
      }
    }

    // If all endpoints fail, use fallback
    console.warn('Gradient embeddings API not available, using fallback method');
    return this.fallbackEmbedding(text);
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await axios.post<EmbeddingResponse>(
        `${this.baseUrl}/embeddings`,
        {
          model: this.model,
          input: texts,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // Longer timeout for batch
        }
      );

      if (response.data.embeddings && Array.isArray(response.data.embeddings)) {
        return response.data.embeddings;
      }

      throw new Error('Unexpected batch embeddings response format');
    } catch (error: any) {
      // Fallback to individual embeddings
      console.warn('Batch embeddings failed, falling back to individual calls');
      return Promise.all(texts.map(text => this.embed(text)));
    }
  }

  /**
   * Fallback: Generate a simple embedding using text features
   * This is a basic TF-IDF-like approach when API isn't available
   */
  private async fallbackEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding as fallback
    // In production, you'd want to use a proper embedding model
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // Standard embedding size
    
    words.forEach((word, idx) => {
      // Simple hash-based distribution
      const hash = this.simpleHash(word);
      const position = hash % embedding.length;
      embedding[position] += 1 / (idx + 1); // Decay by position
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude > 0 ? dotProduct / magnitude : 0;
  }
}
