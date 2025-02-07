import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRoutes from "./routes/analyzeRoutes.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
app.use(express.json());

// Routes
app.use("/api/analyze", analyzeRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
