import Analysis from "../models/Analysis.js";

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

    } catch (error) {

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