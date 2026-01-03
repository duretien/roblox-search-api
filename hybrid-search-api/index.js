import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { getFromCache, saveToCache } from "./cache.js";
import { recordQuery, getTrending } from "./trending.js";

const app = express();
app.use(cors());
app.use(express.json());

async function searchDuckDuckGo(query) {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(url);
    const data = await res.json();

    const results = [];

    if (data.AbstractText) {
        results.push({
            title: data.Heading || query,
            description: data.AbstractText,
            url: data.AbstractURL || ""
        });
    }

    if (Array.isArray(data.RelatedTopics)) {
        for (const item of data.RelatedTopics) {
            if (item.Text) {
                results.push({
                    title: item.Text.split(" - ")[0] || item.Text,
                    description: item.Text,
                    url: item.FirstURL || ""
                });
            } else if (Array.isArray(item.Topics)) {
                for (const sub of item.Topics) {
                    if (sub.Text) {
                        results.push({
                            title: sub.Text.split(" - ")[0] || sub.Text,
                            description: sub.Text,
                            url: sub.FirstURL || ""
                        });
                    }
                }
            }
        }
    }

    return results;
}

async function searchWikipedia(query) {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();

    if (data.extract) {
        return [{
            title: data.title || query,
            description: data.extract,
            url: data.content_urls?.desktop?.page || ""
        }];
    }

    return [];
}

app.get("/", (req, res) => {
    res.send("Hybrid search API (DuckDuckGo + Wikipedia + cache + trending) is running");
});

app.get("/trending", (req, res) => {
    res.json({ trending: getTrending() });
});

app.post("/search", async (req, res) => {
    const query = (req.body.query || "").trim();
    if (!query) {
        return res.json({ error: "Missing query" });
    }

    recordQuery(query);

    const cached = getFromCache(query);
    if (cached) {
        return res.json({
            query,
            results: cached.results,
            source: cached.source,
            cached: true,
            trending: getTrending()
        });
    }

    try {
        let results = await searchDuckDuckGo(query);
        let source = "duckduckgo";

        if (!results || results.length === 0) {
            results = await searchWikipedia(query);
            source = "wikipedia";
        }

        if (!results || results.length === 0) {
            results = [];
        }

        const payload = { results, source };
        saveToCache(query, payload);

        res.json({
            query,
            results,
            source,
            cached: false,
            trending: getTrending()
        });
    } catch (err) {
        res.json({
            query,
            results: [],
            source: "error",
            error: err.message,
            trending: getTrending()
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Hybrid search API running on port", PORT);
});
