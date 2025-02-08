import lighthouse from "lighthouse";
import puppeteer from "puppeteer";
import { launch } from "chrome-launcher";

export const analyzePerformance = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    let browser, chrome;
    try {
        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"]
        });

        const chromePath = puppeteer.executablePath(); // Get Puppeteer's Chrome path

        // Launch Chrome for Lighthouse
        chrome = await launch({
            chromePath,
            chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"]
        });

        // Run Lighthouse audit
        const result = await lighthouse(url, {
            port: chrome.port,
            output: "json",
            logLevel: "info",
        });

        const { categories, audits } = result.lhr;

        // Extract Core Web Vitals
        const coreWebVitals = {
            FCP: audits["first-contentful-paint"]?.displayValue || "N/A",
            LCP: audits["largest-contentful-paint"]?.displayValue || "N/A",
            CLS: audits["cumulative-layout-shift"]?.displayValue || "N/A",
            INP: audits["interaction-to-next-paint"]?.displayValue || "N/A",
            SpeedIndex: audits["speed-index"]?.displayValue || "N/A",
            TBT: audits["total-blocking-time"]?.displayValue || "N/A",
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
            totalRequests: audits["network-requests"]?.details?.items.length || 0,
            totalPageSize: audits["network-requests"]?.details?.items.reduce((acc, item) => acc + (item.transferSize || 0), 0),
            mainThreadTime: audits["main-thread-tasks"]?.displayValue || "N/A",
        };

        res.json({ coreWebVitals, opportunities, network, scores: categories });
    } catch (error) {
        console.error("❌ Performance analysis failed:", error);
        res.status(500).json({ error: "Failed to analyze performance" });
    } finally {
        if (browser) await browser.close();
        if (chrome) await chrome.kill();
    }
};
