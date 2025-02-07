import express from "express";
import { analyzePerformance } from "../services/PerformanceService.js";
import { analyzeWebsite } from "../services/SecurityServices.js";
const router = express.Router();

router.post("/", analyzeWebsite);
router.post("/performance", analyzePerformance);

export default router;