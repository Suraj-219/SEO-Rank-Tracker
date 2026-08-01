import express from "express";
import auth from "../middleware/auth";
import { analyzeUrl, deleteAnalysis, getAnalyses, getAnalysis } from "../controllers/analysisController";


const analysisRouter = express.Router();

analysisRouter.post('/analyze', auth, analyzeUrl);
analysisRouter.get('/list', auth, getAnalyses);
analysisRouter.get('/:id', auth, getAnalysis);
analysisRouter.delete('/:id', auth, deleteAnalysis);

export default analysisRouter;