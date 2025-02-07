import express from "express";
import { analyzeWebsite } from "../services/SecurityServices.js";
const router = express.Router();

router.post("/", analyzeWebsite);

export default router;