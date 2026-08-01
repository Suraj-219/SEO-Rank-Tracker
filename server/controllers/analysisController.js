import Analysis from "../models/Analysis.js";
import { analyzeSeoData } from "../services/geminiService.js";
import { scraperUrl } from "../services/scraperService.js";

// Analyze URL
export const analyzeUrl = async(req, res) => {
    try{
        const {url} = req.body;

        if(!url) return res.status(400).json({ success: false, message: "URL is required" });

        // Validate URL format
        let validUrl;
        try{
            validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    
        } catch(error) {
            return res.status(400).json({ success: false, message: "Invalid URL format" });
        }

        // Create analysis record with pending status
        const analysis = await Analysis.create({userId: req.userId, url: validUrl.href, status: "processing"});

        // Send immediate response with analysis ID
        res.json({ success: true, message: "Analysis started", analysisId: analysis._id})

        // Run scraping and analysis in background
        try{
            // Step 1: Scrape the URL with BrowserBAse
            const scrapeResult = await scraperUrl(validUrl.href)

            if(!scrapeResult.success){
                analysis.status = "failed";
                await analysis.save();
                return;
            }

            // Step 2: Analyze with Gemini AI
            const aiResult = await analyzeSeoData(scrapeResult.data)

            if(!aiResult.success){
                analysis.status = "failed";
                await analysis.save()
                return;
            }

            // Step 3: Save results
            analysis.overallScore = aiResult.data.overallScore || 0;
            analysis.categories = aiResult.data.categories || {};
            analysis.metaData = scrapeResult.data.metaData || {};
            analysis.headings = scrapeResult.data.headings || {};
            analysis.links = scrapeResult.data.links || {};
            analysis.images = scrapeResult.data.images || {};
            analysis.keywords = aiResult.data.keywords || [];
            analysis.issues = aiResult.data.issues || [];
            analysis.loadTime = scrapeResult.data.loadTime || 0;
            analysis.pageSize = scrapeResult.data.pageSize || 0;
            analysis.wordCount = scrapeResult.data.wordCount || 0;
            analysis.status = "completed";

            await analysis.save();

        } catch(bgError){
            console.error("Background analysis error:", bgError.message);
            try{
                analysis.status = "failed";
                await analysis.save()
            } catch (saveError) {
                console.error("Failed to save failed status:", saveError.message);
            }
        }

    } catch (error) {
        console.error("Analyze URL error:", error.message);
        if(!res.headersSent) {
            res.status(500).json({success: false, message: "Server error"})
        }
    }

}

// Get analysis by ID
export const getAnalysis = async(req, res) => {

}

// Get all analyses for user
export const getAnalyses = async(req, res) => {

}

// Delete analysis
export const deleteAnalysis = async(req, res) => {

}