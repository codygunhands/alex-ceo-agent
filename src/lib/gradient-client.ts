import axios, { AxiosInstance } from 'axios';

export interface GradientMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GradientCompletionRequest {
  model: string;
  messages: GradientMessage[];
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
}

export interface GradientCompletionResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class GradientClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private defaultTimeout: number = 30000; // 30 seconds
  private maxRetries: number = 1;

  constructor() {
    this.apiKey = process.env.GRADIENT_API_KEY || '';
    this.baseUrl = process.env.GRADIENT_BASE_URL || 'https://api.gradient.ai/api/v1';
    this.model = process.env.GRADIENT_MODEL || '';

    if (!this.apiKey) {
      throw new Error('GRADIENT_API_KEY is required');
    }
    if (!this.model) {
      throw new Error('GRADIENT_MODEL is required');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: this.defaultTimeout,
    });
  }

  async complete(request: GradientCompletionRequest): Promise<GradientCompletionResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.post<GradientCompletionResponse>(
          '/chat/completions',
          {
            model: this.model,
            messages: request.messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens ?? 2000,
          },
          {
            timeout: request.timeout ?? this.defaultTimeout,
          }
        );

        const latencyMs = Date.now() - startTime;
        return {
          ...response.data,
          usage: response.data.usage ?? {
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
          },
        };
      } catch (error: any) {
        lastError = error;
        if (attempt < this.maxRetries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw new Error(`Gradient API call failed after ${this.maxRetries + 1} attempts: ${lastError?.message}`);
  }
}

// Provider interface for future extensibility
export interface LLMProvider {
  complete(request: GradientCompletionRequest): Promise<GradientCompletionResponse>;
}

export class GradientProvider implements LLMProvider {
  private client: GradientClient;

  constructor() {
    this.client = new GradientClient();
  }

  async complete(request: GradientCompletionRequest): Promise<GradientCompletionResponse> {
    return this.client.complete(request);
  }
}

