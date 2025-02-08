import { exec } from "child_process";
import util from "util";
import fetch from "node-fetch";

const execPromise = util.promisify(exec);

export const checkGithubSecurity = async (packageName) => {
    try {
        const response = await fetch(`https://api.github.com/search/advisories?q=${packageName}`);
        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("GitHub Security API error:", error);
        return [];
    }
};

export const analyzeDependencies = async (req, res) => {
    try {
        const { packageJson } = req.body;
        if (!packageJson || !packageJson.dependencies) {
            return res.status(400).json({ error: "Invalid package.json data" });
        }

        let vulnerabilities = {};

        console.log("Running Snyk scan...");
        try {
            const { stdout } = await execPromise("snyk test --json");
            vulnerabilities.snyk = JSON.parse(stdout).vulnerabilities || {};
        } catch (error) {
            console.warn("Warning: Snyk scan failed.");
            vulnerabilities.snyk = { error: "Snyk scan failed, check logs" };
        }

        console.log("Running Retire.js scan...");
        try {
            const { stdout } = await execPromise("retire --outputformat json");
            vulnerabilities.retirejs = JSON.parse(stdout);
        } catch (error) {
            console.warn("Warning: Retire.js scan failed.");
            vulnerabilities.retirejs = { error: "Retire.js scan failed, check logs" };
        }

        console.log("Checking GitHub Security Advisories...");
        for (const dep of Object.keys(packageJson.dependencies)) {
            vulnerabilities[dep] = await checkGithubSecurity(dep);
        }

        res.json({ dependencies: packageJson.dependencies, vulnerabilities });
    } catch (error) {
        console.error("Error analyzing dependencies:", error);
        res.status(500).json({ error: "Failed to analyze dependencies" });
    }
};
