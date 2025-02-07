import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import { launch } from "chrome-launcher";

export const analyzePerformance = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        // Launch Chrome
        const chrome = await launch({ chromeFlags: ["--headless"] });

        // Run Lighthouse audit
        const result = await lighthouse(url, {
            port: chrome.port,
            output: "json",
            logLevel: "info",
        });

        const { categories, audits } = result.lhr;

        // Extract Core Web Vitals
        const coreWebVitals = {
            FCP: audits["first-contentful-paint"].displayValue,
            LCP: audits["largest-contentful-paint"].displayValue,
            CLS: audits["cumulative-layout-shift"].displayValue,
            INP: audits["interaction-to-next-paint"]?.displayValue || "N/A",
            SpeedIndex: audits["speed-index"].displayValue,
            TBT: audits["total-blocking-time"].displayValue,
        };

        // Extract Opportunities (Areas of Improvement)
        const opportunities = {
            renderBlocking: audits["render-blocking-resources"]?.details?.items.length || 0,
            unusedCSS: audits["unused-css-rules"]?.details?.overallSavingsBytes || 0,
            unusedJS: audits["unused-javascript"]?.details?.overallSavingsBytes || 0,
            thirdPartyResources: audits["third-party-summary"]?.details?.items.length || 0,
        };

        // Extract Network Performance
        const network = {
            totalRequests: audits["network-requests"].details.items.length,
            totalPageSize: audits["network-requests"].details.items.reduce((acc, item) => acc + (item.transferSize || 0), 0),
            mainThreadTime: audits["main-thread-tasks"].displayValue,
        };

        // Close Chrome
        await chrome.kill();

        res.json({ coreWebVitals, opportunities, network, scores: categories });
    } catch (error) {
        console.error("❌ Performance analysis failed:", error);
        res.status(500).json({ error: "Failed to analyze performance" });
    }
};
