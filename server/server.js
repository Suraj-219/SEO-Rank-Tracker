import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import rankRouter from "./routes/rankRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";
import { startRankTrackingCron } from "./cron/rankTrackingCron.js";

const requiredEnv = ["MONGODB_URI", "JWT_SECRET"];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length) {
    console.error(`Missing required environment variables: ${missingEnv.join(", ")}`);
    process.exit(1);
}

connectDB()

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

app.get('/', (req, res) => res.send("Server is running"))
app.use("/api/auth", authRouter)
app.use("/api/rank", rankRouter)
app.use('/api/analysis', analysisRouter)

// Start cron jobs
startRankTrackingCron()

const PORT = process.env.PORT || 5000;

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))