const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const cache = new Map();

export function getFromCache(query) {
    const entry = cache.get(query.toLowerCase());
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
        cache.delete(query.toLowerCase());
        return null;
    }
    return entry.data;
}

export function saveToCache(query, data) {
    cache.set(query.toLowerCase(), {
        timestamp: Date.now(),
        data
    });
}
