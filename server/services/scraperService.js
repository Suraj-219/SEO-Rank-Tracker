import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({
    apiKey: process.env.BROWSERBASE_API_KEY,
});


export async function scraperUrl(url) {
    let browser;
    try {
        const session = await bb.sessions.create({ browserSettings: { blockAds: true } });
        browser = await chromium.connectOverCDP(session.connectUrl)
        const defaultContext = browser.contexts()[0];
        const page = defaultContext.pages()[0];
        page.setDefaultNavigationTimeout(30000);

        const startTime = Date.now()
        let response;
        try {
            response = await page.goto(url, { waitUntil: "domcontentloaded" })
        } catch (navError) {
            await browser.close().catch(() => { });
            browser = null;
            return { success: false, error: navError.message }
        }

        const loadTime = Date.now() - startTime;
        await page.waitForEvent(2000);

        // Extract all SEO-relevant data from the rendered page
        const scrapedData = await page.evaluate(() => {
            const getMeta = (name) => {
                const el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
                return el ? el.getAttribute("content") || "" : "";
            }

            const title = document.title || "";
            const description = getMeta("description");
            const canonical = document.querySelector('link[rel="canonical"]')?.href || "";
            const robots = getMeta("robots");
            const ogTitle = getMeta("og:title");
            const ogDescription = getMeta("og:description");
            const ogImage = getMeta("og:image");
            const twitterCard = getMeta("twitter:card")
            const viewport = getMeta("viewport");
            const charsetMeta = document.querySelector('meta[charset]');
            const charset = charsetMeta ? charsetMeta.getAttribute("charset") || "" : "";

            const h1Elements = document.querySelectorAll("h1");
            const h1Texts = Array.from(h1Elements).map((el)=>el.textContent?.trim() || "");
            const headings = {
                h1: document.querySelectorAll("h1").length,
                h2: document.querySelectorAll("h2").length,
                h3: document.querySelectorAll("h3").length,
                h4: document.querySelectorAll("h4").length,
                h5: document.querySelectorAll("h5").length,
                h6: document.querySelectorAll("h6").length,
                h1Texts,
            };
        })

    } catch (error) {

    }
}