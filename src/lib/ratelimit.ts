import { RateLimiter } from 'limiter';

const limiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
});

export async function rateLimit(): Promise<void> {
  const hasToken = await limiter.tryRemoveTokens(1);
  if (!hasToken) {
    throw new Error('Rate limit exceeded');
  }
}