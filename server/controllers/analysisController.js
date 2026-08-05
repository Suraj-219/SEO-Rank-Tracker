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

        // helper to safely update the analysis by id (avoids errors if document was deleted)
        const safeUpdateAnalysis = async (id, update) => {
            try {
                const updated = await Analysis.findByIdAndUpdate(id, update, { new: true }).exec();
                if (!updated) {
                    console.warn(`safeUpdateAnalysis: analysis ${id} not found, skipping update.`);
                }
                return updated;
            } catch (uErr) {
                console.error("safeUpdateAnalysis error:", uErr?.message || uErr);
                return null;
            }
        };

        // Send immediate response with analysis ID
        res.json({ success: true, message: "Analysis started", analysisId: analysis._id})

        // Run scraping and analysis in background
        try{
            // Step 1: Scrape the URL with BrowserBAse
            const scrapeResult = await scraperUrl(validUrl.href)

            if(!scrapeResult?.success){
                await safeUpdateAnalysis(analysis._id, { status: "failed" });
                return;
            }

            // Step 2: Analyze with Gemini AI (retry transient errors)
            let aiResult = null;
            const maxAttempts = 3;
            let attempt = 0;
            let delay = 2000;

            while (attempt < maxAttempts) {
                attempt++;
                aiResult = await analyzeSeoData(scrapeResult.data);
                if (aiResult.success) break;
                // If not retryable, break immediately
                if (!aiResult.retryable) break;

                console.warn(`Gemini transient error (attempt ${attempt}/${maxAttempts}):`, aiResult.error);
                // Ensure status remains processing
                await safeUpdateAnalysis(analysis._id, { status: "processing" });
                // backoff
                await new Promise((r) => setTimeout(r, delay));
                delay *= 2;
            }

            if (!aiResult || !aiResult.success) {
                await safeUpdateAnalysis(analysis._id, { status: "failed" });
                return;
            }

            // Step 3: Save results via id-based update to avoid saving a stale/missing document
            const updatePayload = {
                overallScore: aiResult.data.overallScore || 0,
                categories: aiResult.data.categories || {},
                metaData: scrapeResult.data.metaData || {},
                headings: scrapeResult.data.headings || {},
                links: scrapeResult.data.links || {},
                images: scrapeResult.data.images || {},
                keywords: aiResult.data.keywords || [],
                issues: aiResult.data.issues || [],
                loadTime: scrapeResult.data.loadTime || 0,
                pageSize: scrapeResult.data.pageSize || 0,
                wordCount: scrapeResult.data.wordCount || 0,
                status: "completed",
            };

            await safeUpdateAnalysis(analysis._id, updatePayload);

        } catch(bgError){
            console.error("Background analysis error:", bgError?.message || bgError);
            try{
                await safeUpdateAnalysis(analysis._id, { status: "failed" });
            } catch (saveError) {
                console.error("Failed to save failed status:", saveError?.message || saveError);
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
    try{
        const analysis = await Analysis.findOne({_id: req.params.id, userId: req.userId})

        if(!analysis) return res.status(400).json({ success: false, message: "Analysis not found" });
        res.json({ success: true, analysis });

    } catch (error){
        console.error("Get analysis error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// Get all analyses for user
export const getAnalyses = async(req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Use Mongoose query sorting and pagination (avoid passing object to Array.sort)
        const query = Analysis.find({ userId: req.userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).select("-issues -keywords");
        const analyses = await query.exec();

        const total = await Analysis.countDocuments({ userId: req.userId });

        // Return `Pagination` to match client expectations
        res.json({ success: true, analyses, Pagination: { page, limit, total, pages: Math.ceil(total / limit) } });

    } catch (error){
        console.error("Get analyses error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
}

// Delete analysis
export const deleteAnalysis = async(req, res) => {
    try{
        await Analysis.findOneAndDelete({_id: req.params.id, userId: req.userId})

        res.json({ success: true, message: "Analysis deleted" });

    } catch (error){
        console.error("Delete analysis error:", error.message);
        res.status(500).json({ success: false, message: "Server error" });
        
    }
}