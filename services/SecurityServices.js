import whois from "whois-json";
import dns from "dns/promises";
import puppeteer from "puppeteer";
import sslChecker from "ssl-checker";
import fetch from "node-fetch";

export const analyzeWebsite = async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    try {
        const domain = new URL(url).hostname;
        let results = { domain };

        // WHOIS Info
        results.whois = await whois(domain);

        // DNS Records
        try {
            results.dnsRecords = await dns.resolveAny(domain);
        } catch (dnsError) {
            results.dnsRecords = "Failed to retrieve DNS records";
        }

        // SSL Certificate
        results.sslInfo = await sslChecker(domain).catch(() => "SSL info not available");

        // Puppeteer Analysis
        const browser = await puppeteer.launch({ headless: true,
            executablePath: process.env.CHROME_PATH || puppeteer.executablePath(),
            args: ["--no-sandbox", "--disable-setuid-sandbox"], });
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "domcontentloaded" });

        // Extract Page Information
        results.pageInfo = await page.evaluate(() => ({
            title: document.title,
            description: document.querySelector("meta[name='description']")?.content || "No description found",
            metaKeywords: document.querySelector("meta[name='keywords']")?.content || "No keywords found",
        }));

        // Security Headers Detection
        const response = await fetch(url, { method: "HEAD" });
        const headers = response.headers.raw();
        results.securityHeaders = {
            "Content-Security-Policy": headers["content-security-policy"] || "Not found",
            "X-Frame-Options": headers["x-frame-options"] || "Not found",
            "Strict-Transport-Security": headers["strict-transport-security"] || "Not found",
        };

        // Detect CDN & Load Balancer
        results.cdnProvider = headers["server"] ? headers["server"][0] : "Unknown";

        // Performance Metrics
        const perfData = await page.evaluate(() => performance.timing);
        results.performance = {
            pageLoadTime: perfData.loadEventEnd - perfData.navigationStart,
            domReadyTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        };

        // API Calls Detection
        let requests = [];
        page.on("request", (request) => {
            requests.push({ url: request.url(), method: request.method() });
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));
        results.apiCalls = requests.slice(0, 20);

        // Detect Frontend Technologies
        results.frontendTechnologies = await page.evaluate(() => {
            const frameworks = [];
            if (window.React) frameworks.push("React");
            if (window.Vue) frameworks.push("Vue.js");
            if (window.Angular) frameworks.push("Angular");
            return frameworks.length ? frameworks : ["Unknown"];
        });

        // Additional Security Checks
        results.securityChecks = {
            xssProtection: headers["x-xss-protection"] || "Not found",
            referrerPolicy: headers["referrer-policy"] || "Not found",
            permissionsPolicy: headers["permissions-policy"] || "Not found",
        };

        await browser.close();

        res.json(results);
    } catch (error) {
        console.error("❌ Error analyzing dependencies:", error);
        res.status(500).json({ error: "Failed to analyze dependencies" });
    }
};
