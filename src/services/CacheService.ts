/**
 * CacheService - Simple in-memory caching with TTL
 */

export interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class CacheService {
    private static instance: CacheService;
    private cache: Map<string, CacheEntry<any>>;
    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor() {
        this.cache = new Map();
        this.startCleanup();
    }

    public static getInstance(): CacheService {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }

    /**
     * Set cache entry with TTL
     */
    public set<T>(key: string, value: T, ttlSeconds: number = 300): void {
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiresAt });
    }

    /**
     * Get cache entry
     */
    public get<T>(key: string): T | null {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Check if key exists and not expired
     */
    public has(key: string): boolean {
        return this.get(key) !== null;
    }

    /**
     * Delete cache entry
     */
    public delete(key: string): void {
        this.cache.delete(key);
    }

    /**
     * Clear all cache
     */
    public clear(): void {
        this.cache.clear();
    }

    /**
     * Get cache size
     */
    public size(): number {
        return this.cache.size;
    }

    /**
     * Start periodic cleanup of expired entries
     */
    private startCleanup(): void {
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now > entry.expiresAt) {
                    this.cache.delete(key);
                }
            }
        }, 60000); // Run every minute
    }

    /**
     * Stop cleanup interval
     */
    public stopCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}
