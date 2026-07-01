import Redis from 'ioredis';

export class CooldownManager {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT) || 6379,
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async check(key: string, duration: number): Promise<boolean> {
    const exists = await this.redis.exists(`cooldown:${key}`);
    return exists === 1;
  }

  async set(key: string, duration: number): Promise<void> {
    await this.redis.setex(`cooldown:${key}`, duration, '1');
  }

  async getRemaining(key: string): Promise<number> {
    return this.redis.ttl(`cooldown:${key}`);
  }

  async clear(key: string): Promise<void> {
    await this.redis.del(`cooldown:${key}`);
  }
}
