import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import rankRouter from "./routes/rankRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";
import { startRankTrackingCron } from "./cron/rankTrackingCron.js";

const normalizeEnv = (value) => {
    if (typeof value !== "string") return undefined;
    let normalized = value.trim();
    if (normalized.startsWith('"') && normalized.endsWith('"')) {
        normalized = normalized.slice(1, -1).trim();
    }
    return normalized;
};

const MONGODB_URI = normalizeEnv(process.env.MONGODB_URI);
const JWT_SECRET = normalizeEnv(process.env.JWT_SECRET);
const CLIENT_ORIGIN = normalizeEnv(process.env.CLIENT_ORIGIN) || "https://seo-rank-tracker-lake.vercel.app";

const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
const missingEnv = [];
if (!MONGODB_URI) missingEnv.push("MONGODB_URI");
if (!JWT_SECRET) missingEnv.push("JWT_SECRET");
if (missingEnv.length) {
    console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

process.env.MONGODB_URI = MONGODB_URI;
process.env.JWT_SECRET = JWT_SECRET;
process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;

// connectDB()

const app = express()

const whitelist = [
	process.env.CLIENT_ORIGIN || "https://seo-rank-tracker-lake.vercel.app",
	"http://localhost:5173",
]

const corsOptions = {
	origin: function (origin, callback) {
		// allow requests with no origin (like mobile apps or curl)
		if (!origin) return callback(null, true)
		if (whitelist.indexOf(origin) !== -1) {
			callback(null, true)
		} else {
			callback(new Error("Not allowed by CORS"))
		}
	},
	credentials: true,
}

app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))
app.use(express.json())

app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.originalUrl} Origin=${req.headers.origin || "none"}`);
    next();
});

app.get('/', (req, res) => res.send("Server is running"))
app.use("/api/auth", authRouter)
app.use("/api/rank", rankRouter)
app.use('/api/analysis', analysisRouter)

// Start cron jobs
startRankTrackingCron()

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();