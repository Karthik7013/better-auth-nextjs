import Redis from "ioredis";

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: false,
    keepAlive: 10000,
  });

  redis.on("error", (err) => {
    console.error("[redis] connection error:", err.message);
  });

  redis.on("reconnecting", () => {
    console.warn("[redis] reconnecting...");
  });
}

const CACHE_PREFIX = "app:";

export async function cacheGetOrSet<T>(
  key: string,
  ttl: number,
  fetch: () => Promise<T>
): Promise<T> {
  if (!redis) return fetch();
  const fullKey = `${CACHE_PREFIX}${key}`;

  try {
    const cached = await redis.get(fullKey);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis unavailable — fall through to DB
  }
  const fresh = await fetch();
  try {
    await redis.setex(fullKey, ttl, JSON.stringify(fresh));
  } catch {
    // Redis unavailable — cache write failed
  }
  return fresh;
}

const INVALIDATION_KEYS = {
  movies: ["home:recently-added", "movies:*"],
  featured: ["home:featured"],
  tags: ["tags:all"],
} as const;

export async function invalidateCache(
  scope: keyof typeof INVALIDATION_KEYS
): Promise<void> {
  if (!redis) return;
  const patterns = INVALIDATION_KEYS[scope];
  try {
    const pipeline = redis.pipeline();
    for (const pattern of patterns) {
      if (pattern.endsWith("*")) {
        const keys = await redis.keys(`${CACHE_PREFIX}${pattern}`);
        if (keys.length > 0) {
          pipeline.del(...keys);
        }
      } else {
        pipeline.del(`${CACHE_PREFIX}${pattern}`);
      }
    }
    await pipeline.exec();
  } catch (err) {
    console.error(`[redis] cache invalidation failed for ${scope}:`, err);
  }
}
