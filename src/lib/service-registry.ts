/**
 * Service Registry Client (TypeScript)
 * 
 * Redis-based service registry for agent discovery and health tracking.
 */

import Redis from 'ioredis';

export class ServiceRegistry {
  private redis: Redis;
  private heartbeatInterval: number = 30000; // 30 seconds
  private serviceTTL: number = 60000; // 60 seconds
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || '');
  }

  /**
   * Register a service
   */
  async register(serviceName: string, serviceInfo: {
    url: string;
    role: string;
    [key: string]: any;
  }): Promise<any> {
    const key = `service:registry:${serviceName}`;
    const healthKey = `service:health:${serviceName}`;
    
    const registration = {
      name: serviceName,
      registeredAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
      ...serviceInfo,
      // Ensure url and role are set from serviceInfo
      url: serviceInfo.url,
      role: serviceInfo.role,
    };

    // Store service info
    await this.redis.setex(key, this.serviceTTL / 1000, JSON.stringify(registration));
    
    // Set health status
    await this.redis.setex(healthKey, this.serviceTTL / 1000, JSON.stringify({
      status: 'healthy',
      lastCheck: new Date().toISOString(),
    }));

    console.log(`✅ Registered service: ${serviceName} at ${serviceInfo.url}`);
    return registration;
  }

  /**
   * Update heartbeat
   */
  async heartbeat(serviceName: string): Promise<any> {
    const key = `service:registry:${serviceName}`;
    const healthKey = `service:health:${serviceName}`;
    
    const existing = await this.redis.get(key);
    if (!existing) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    const serviceInfo = JSON.parse(existing);
    serviceInfo.lastHeartbeat = new Date().toISOString();

    // Update with extended TTL
    await this.redis.setex(key, this.serviceTTL / 1000, JSON.stringify(serviceInfo));
    await this.redis.setex(healthKey, this.serviceTTL / 1000, JSON.stringify({
      status: 'healthy',
      lastCheck: new Date().toISOString(),
    }));

    return serviceInfo;
  }

  /**
   * Get service URL (cached)
   */
  async getServiceUrl(serviceName: string): Promise<string | null> {
    const key = `service:registry:${serviceName}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    
    const service = JSON.parse(data);
    return service.url || null;
  }

  /**
   * Get all registered services
   */
  async getAllServices(): Promise<any[]> {
    const keys = await this.redis.keys('service:registry:*');
    const services = [];

    for (const key of keys) {
      const data = await this.redis.get(key);
      if (data) {
        services.push(JSON.parse(data));
      }
    }

    return services;
  }

  /**
   * Start heartbeat for a service
   */
  startHeartbeat(serviceName: string, serviceInfo: any): void {
    // Register initially
    this.register(serviceName, serviceInfo);

    // Set up heartbeat interval
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.heartbeat(serviceName);
      } catch (error: any) {
        console.error(`❌ Heartbeat failed for ${serviceName}:`, error.message);
        if (this.heartbeatTimer) {
          clearInterval(this.heartbeatTimer);
        }
      }
    }, this.heartbeatInterval);

    // Cleanup on process exit
    process.on('SIGTERM', () => {
      this.stop();
    });
  }

  /**
   * Stop heartbeat
   */
  stop(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Disconnect Redis
   */
  async disconnect(): Promise<void> {
    this.stop();
    await this.redis.quit();
  }
}

