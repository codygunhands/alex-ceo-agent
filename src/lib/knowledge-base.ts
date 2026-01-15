import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { Mode, KnowledgeBaseDoc, KBVersion } from '../types';

export class KnowledgeBase {
  private kbPath: string;

  constructor(kbPath: string = join(process.cwd(), 'kb')) {
    this.kbPath = kbPath;
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

  findCitations(content: string, kb: KBVersion): Array<{ doc: string; anchor?: string }> {
    const citations: Array<{ doc: string; anchor?: string }> = [];
    
    for (const doc of kb.docs) {
      // Simple keyword matching - in production, use better semantic search
      const keywords = doc.content.toLowerCase().split(/\s+/);
      const contentLower = content.toLowerCase();
      
      // Check if doc is relevant
      let relevance = 0;
      for (const keyword of keywords.slice(0, 100)) { // Limit to first 100 words
        if (contentLower.includes(keyword)) {
          relevance++;
        }
      }
      
      if (relevance > 5) { // Threshold for citation
        // Try to find relevant heading
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
        });
      }
    }
    
    return citations;
  }
}

