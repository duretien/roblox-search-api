const trendingMap = new Map();

export function recordQuery(query) {
    const key = query.toLowerCase();
    trendingMap.set(key, (trendingMap.get(key) || 0) + 1);
}

export function getTrending(limit = 10) {
    const arr = Array.from(trendingMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([term, count]) => ({ term, count }));
    return arr;
}
