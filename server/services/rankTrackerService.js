import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
});

// Search Google for a keyword and extract ranking results for a target domain.
export async function rankTracker(keyword, targetDomain) {
    let browser;
    try {
        // 1. Initialize Browserbase Session & Connect Playwright
        const session = await bb.sessions.create({browserSettings: {blockAds: true}});
        browser = await chromium.connectOverCDP(session.connectUrl)
        const page = browser.contexts()[0].pages()[0];
        page.setDefaultNavigationTimeout(45000);

    } catch (error) {

    }
} 