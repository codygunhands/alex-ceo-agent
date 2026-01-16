/**
 * Circuit Breaker Pattern (TypeScript)
 * 
 * Prevents cascade failures by opening circuit after threshold failures.
 */

export class CircuitBreaker {
  private failureThreshold: number;
  private resetTimeout: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime: number | null = null;

  constructor(options: {
    failureThreshold?: number;
    resetTimeout?: number;
  } = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 60 seconds
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    // Check if circuit should be reset
    if (this.state === 'OPEN') {
      if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        console.log(`🔄 Circuit breaker HALF_OPEN - testing recovery`);
      } else {
        // Circuit still open, use fallback
        if (fallback) {
          return await fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      
      // Success - reset failure count
      if (this.state === 'HALF_OPEN') {
        this.successCount++;
        if (this.successCount >= 2) {
          // Recovery successful
          this.state = 'CLOSED';
          this.failureCount = 0;
          this.successCount = 0;
          console.log(`✅ Circuit breaker CLOSED - recovery successful`);
        }
      } else {
        // Normal operation - reset failure count on success
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      // Failure - increment count
      this.failureCount++;
      this.lastFailureTime = Date.now();

      // Check if threshold exceeded
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        this.nextAttemptTime = Date.now() + this.resetTimeout;
        console.log(`🚨 Circuit breaker OPEN - too many failures (${this.failureCount})`);
      }

      // If circuit is open or half-open, use fallback
      if (this.state === 'OPEN' || this.state === 'HALF_OPEN') {
        if (fallback) {
          return await fallback();
        }
      }

      throw error;
    }
  }

  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }
}

