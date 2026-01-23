import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { Mode, KnowledgeBaseDoc, KBVersion } from '../types';
import { EmbeddingsClient } from './embeddings-client';

export class KnowledgeBase {
  private kbPath: string;
  private embeddingsClient: EmbeddingsClient | null = null;
  private embeddingsCache: Map<string, number[]> = new Map();
  private cachePath: string;

  constructor(kbPath: string = join(process.cwd(), 'kb')) {
    this.kbPath = kbPath;
    this.cachePath = join(process.cwd(), '.kb-embeddings-cache.json');
    this.loadEmbeddingsCache();
    
    // Initialize embeddings client if API key is available
    try {
      this.embeddingsClient = new EmbeddingsClient();
    } catch (error) {
      console.warn('Embeddings client not available, falling back to keyword search');
    }
  }

  private extractHeadings(content: string): Array<{ level: number; text: string; anchor: string }> {
    const headings: Array<{ level: number; text: string; anchor: string }> = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const anchor = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
        headings.push({ level, text, anchor });
      }
    }
    
    return headings;
  }

  private loadDoc(filename: string): KnowledgeBaseDoc | null {
    try {
      const filePath = join(this.kbPath, filename);
      const content = readFileSync(filePath, 'utf-8');
      const headings = this.extractHeadings(content);
      
      return {
        filename,
        content,
        headings,
      };
    } catch (error) {
      return null;
    }
  }

  loadForMode(mode: Mode): KBVersion {
    const docs: KnowledgeBaseDoc[] = [];
    
    // Always load these docs
    const commonDocs = ['product_overview.md', 'faq.md'];
    
    // Mode-specific docs
    const modeDocs: Record<Mode, string[]> = {
      operator: ['onboarding_steps.md', 'support_playbook.md'],
      marketing: ['marketing_playbook.md'],
      strategic: ['strategic_framework.md', 'decision_making.md', 'board_coordination.md'],
    };
    
    // For strategic mode, load from ceo subdirectory
    let filesToLoad: string[];
    if (mode === 'strategic') {
      filesToLoad = [...commonDocs, ...modeDocs[mode]];
      // Update kbPath to point to ceo subdirectory
      this.kbPath = join(process.cwd(), 'kb', 'ceo');
    } else {
      filesToLoad = [...commonDocs, ...(modeDocs[mode] || [])];
    }
    
    for (const filename of filesToLoad) {
      const doc = this.loadDoc(filename);
      if (doc) {
        docs.push(doc);
      }
    }
    
    // Compute hash
    const content = docs.map(d => `${d.filename}:${d.content}`).join('\n\n');
    const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
    
    return {
      hash,
      docs,
      mode,
    };
  }

  /**
   * Load embeddings cache from disk
   */
  private loadEmbeddingsCache(): void {
    try {
      if (existsSync(this.cachePath)) {
        const cacheData = readFileSync(this.cachePath, 'utf-8');
        const cache = JSON.parse(cacheData);
        this.embeddingsCache = new Map(Object.entries(cache));
      }
    } catch (error) {
      // Cache doesn't exist or is invalid, start fresh
      this.embeddingsCache = new Map();
    }
  }

  /**
   * Save embeddings cache to disk
   */
  private saveEmbeddingsCache(): void {
    try {
      const cacheObj = Object.fromEntries(this.embeddingsCache);
      writeFileSync(this.cachePath, JSON.stringify(cacheObj, null, 2));
    } catch (error) {
      console.warn('Failed to save embeddings cache:', error);
    }
  }

  /**
   * Get or generate embedding for a document
   */
  private async getDocEmbedding(doc: KnowledgeBaseDoc): Promise<number[]> {
    const cacheKey = `${doc.filename}:${createHash('sha256').update(doc.content).digest('hex').substring(0, 16)}`;
    
    // Check cache first
    if (this.embeddingsCache.has(cacheKey)) {
      return this.embeddingsCache.get(cacheKey)!;
    }

    // Generate embedding
    if (!this.embeddingsClient) {
      // Fallback to simple hash-based embedding
      return this.fallbackEmbedding(doc.content);
    }

    try {
      // Use first 1000 chars for embedding (most models have token limits)
      const textToEmbed = doc.content.substring(0, 1000);
      const embedding = await this.embeddingsClient.embed(textToEmbed);
      
      // Cache it
      this.embeddingsCache.set(cacheKey, embedding);
      this.saveEmbeddingsCache();
      
      return embedding;
    } catch (error) {
      console.warn(`Failed to generate embedding for ${doc.filename}, using fallback:`, error);
      return this.fallbackEmbedding(doc.content);
    }
  }

  /**
   * Fallback embedding when API is not available
   */
  private fallbackEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, idx) => {
      const hash = this.simpleHash(word);
      const position = hash % embedding.length;
      embedding[position] += 1 / (idx + 1);
    });

    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Find citations using semantic search
   * Falls back to keyword matching if embeddings are not available
   */
  async findCitations(content: string, kb: KBVersion): Promise<Array<{ doc: string; anchor?: string; score?: number }>> {
    // If embeddings client is not available, use keyword matching fallback
    if (!this.embeddingsClient) {
      return this.findCitationsKeyword(content, kb);
    }
    const citations: Array<{ doc: string; anchor?: string; score?: number }> = [];
    
    // Generate embedding for query content
    let queryEmbedding: number[];
    if (this.embeddingsClient) {
      try {
        const textToEmbed = content.substring(0, 1000);
        queryEmbedding = await this.embeddingsClient.embed(textToEmbed);
      } catch (error) {
        console.warn('Failed to generate query embedding, using fallback');
        queryEmbedding = this.fallbackEmbedding(content);
      }
    } else {
      queryEmbedding = this.fallbackEmbedding(content);
    }

    // Calculate similarity for each document
    const docScores: Array<{ doc: KnowledgeBaseDoc; score: number; anchor?: string }> = [];
    
    for (const doc of kb.docs) {
      const docEmbedding = await this.getDocEmbedding(doc);
      const similarity = EmbeddingsClient.cosineSimilarity(queryEmbedding, docEmbedding);
      
      // Threshold: only include docs with similarity > 0.3 (adjustable)
      if (similarity > 0.3) {
        // Find best matching heading
        let bestAnchor: string | undefined;
        let bestAnchorScore = 0;
        
        for (const heading of doc.headings) {
          const headingEmbedding = this.fallbackEmbedding(heading.text);
          const headingSimilarity = EmbeddingsClient.cosineSimilarity(queryEmbedding, headingEmbedding);
          
          if (headingSimilarity > bestAnchorScore) {
            bestAnchorScore = headingSimilarity;
            bestAnchor = heading.anchor;
          }
        }
        
        docScores.push({
          doc,
          score: similarity,
          anchor: bestAnchor,
        });
      }
    }

    // Sort by similarity score (highest first) and take top 5
    docScores.sort((a, b) => b.score - a.score);
    const topDocs = docScores.slice(0, 5);

    // Convert to citation format
    for (const { doc, score, anchor } of topDocs) {
      citations.push({
        doc: doc.filename,
        anchor,
        score: Math.round(score * 100) / 100, // Round to 2 decimal places
      });
    }

    return citations;
  }

  /**
   * Fallback keyword-based citation finding (original implementation)
   */
  private findCitationsKeyword(content: string, kb: KBVersion): Array<{ doc: string; anchor?: string; score?: number }> {
    const citations: Array<{ doc: string; anchor?: string; score?: number }> = [];
    
    for (const doc of kb.docs) {
      const keywords = doc.content.toLowerCase().split(/\s+/);
      const contentLower = content.toLowerCase();
      
      let relevance = 0;
      for (const keyword of keywords.slice(0, 100)) {
        if (contentLower.includes(keyword)) {
          relevance++;
        }
      }
      
      if (relevance > 5) {
        let bestAnchor: string | undefined;
        let bestScore = 0;
        
        for (const heading of doc.headings) {
          const headingLower = heading.text.toLowerCase();
          const score = headingLower.split(' ').filter(word => 
            contentLower.includes(word)
          ).length;
          
          if (score > bestScore) {
            bestScore = score;
            bestAnchor = heading.anchor;
          }
        }
        
        citations.push({
          doc: doc.filename,
          anchor: bestAnchor,
          score: Math.min(relevance / 20, 1), // Normalize to 0-1
        });
      }
    }
    
    return citations;
  }
}

