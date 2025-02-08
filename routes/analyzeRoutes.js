import express from "express";
import { analyzePerformance } from "../services/PerformanceService.js";
import { analyzeWebsite } from "../services/SecurityServices.js";
import { analyzeDependencies } from "../services/applicationD.js";
const router = express.Router();

router.post("/", analyzeWebsite);
router.post("/performance", analyzePerformance);
router.post("/analyze-dependencies", analyzeDependencies);

export default router;