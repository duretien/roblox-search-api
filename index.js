import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/search", async (req, res) => {
    const query = req.body.query;
    if (!query) return res.json({ error: "Missing query" });

    try {
        const response = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`);
        const data = await response.json();

        const results = [];

        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                description: data.AbstractText,
                url: data.AbstractURL || "https://duckduckgo.com/?q=" + encodeURIComponent(query)
            });
        }

        if (data.RelatedTopics) {
            for (const topic of data.RelatedTopics) {
                if (topic.Text && topic.FirstURL) {
                    results.push({
                        title: topic.Text,
                        description: "",
                        url: topic.FirstURL
                    });
                }
            }
        }

        res.json({ query, results });
    } catch (err) {
        res.json({ error: err.message });
    }
});

app.listen(3000, () => console.log("DuckDuckGo API proxy running"));
