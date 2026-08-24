import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/db.js";

import authRouter from "./routes/authRoutes.js";
import rankRouter from "./routes/rankRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";

import { startRankTrackingCron } from "./cron/rankTrackingCron.js";


// --------------------------------------------------
// Normalize Environment Variables
// --------------------------------------------------

const normalizeEnv = (value) => {
    if (typeof value !== "string") return undefined;

    let normalized = value.trim();

    if (
        normalized.startsWith('"') &&
        normalized.endsWith('"')
    ) {
        normalized = normalized.slice(1, -1).trim();
    }

    if (
        normalized.startsWith("'") &&
        normalized.endsWith("'")
    ) {
        normalized = normalized.slice(1, -1).trim();
    }

    return normalized;
};


// --------------------------------------------------
// Environment Variables
// --------------------------------------------------

const MONGODB_URI = normalizeEnv(
    process.env.MONGODB_URI
);

const JWT_SECRET = normalizeEnv(
    process.env.JWT_SECRET
);

const CLIENT_ORIGIN =
    normalizeEnv(process.env.CLIENT_ORIGIN) ||
    "https://seo-rank-tracker-lake.vercel.app";


// --------------------------------------------------
// Required Environment Variables
// --------------------------------------------------

const missingEnv = [];

if (!MONGODB_URI) {
    missingEnv.push("MONGODB_URI");
}

if (!JWT_SECRET) {
    missingEnv.push("JWT_SECRET");
}

if (missingEnv.length > 0) {
    console.error(
        `Missing required environment variables: ${missingEnv.join(", ")}`
    );

    process.exit(1);
}


// --------------------------------------------------
// Store Normalized Environment Variables
// --------------------------------------------------

process.env.MONGODB_URI = MONGODB_URI;
process.env.JWT_SECRET = JWT_SECRET;
process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;


// --------------------------------------------------
// Express App
// --------------------------------------------------

const app = express();


// --------------------------------------------------
// Allowed Origins
// --------------------------------------------------

const allowedOrigins = [
    "https://seo-rank-tracker-lake.vercel.app",
    "http://localhost:5173",
    CLIENT_ORIGIN,
];


// Remove duplicates
const whitelist = [
    ...new Set(allowedOrigins),
];


// --------------------------------------------------
// CORS
// --------------------------------------------------

const corsOptions = {
    origin: function (origin, callback) {

        // Allow Postman, curl, server-to-server requests
        if (!origin) {
            return callback(null, true);
        }

        // Allow trusted frontend
        if (whitelist.includes(origin)) {
            return callback(null, true);
        }

        console.error(
            `CORS blocked origin: ${origin}`
        );

        return callback(
            new Error("Not allowed by CORS")
        );
    },

    credentials: true,

    methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],

    allowedHeaders: [
        "Content-Type",
        "Authorization",
    ],
};


// Apply CORS
app.use(cors(corsOptions));


// --------------------------------------------------
// Body Parser
// --------------------------------------------------

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);


// --------------------------------------------------
// Request Logger
// --------------------------------------------------

app.use((req, res, next) => {

    console.log(
        `Incoming request: ${req.method} ${req.originalUrl} Origin=${req.headers.origin || "none"}`
    );

    next();
});


// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.status(200).send("Server is running");
});


// --------------------------------------------------
// API Routes
// --------------------------------------------------

app.use(
    "/api/auth",
    authRouter
);

app.use(
    "/api/rank",
    rankRouter
);

app.use(
    "/api/analysis",
    analysisRouter
);


// --------------------------------------------------
// 404 Handler
// --------------------------------------------------

app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "API route not found",
        path: req.originalUrl,
    });

});


// --------------------------------------------------
// Global Error Handler
// --------------------------------------------------

app.use((err, req, res, next) => {

    console.error(
        "================================="
    );

    console.error(
        "SERVER ERROR:"
    );

    console.error(err);

    console.error(
        "================================="
    );


    // CORS error
    if (
        err.message === "Not allowed by CORS"
    ) {

        return res.status(403).json({
            success: false,
            message: "CORS policy blocked this request",
        });

    }


    return res.status(500).json({
        success: false,
        message:
            err.message ||
            "Internal server error",
    });

});


// --------------------------------------------------
// Server Port
// --------------------------------------------------

const PORT =
    process.env.PORT || 5000;


// --------------------------------------------------
// Start Server
// --------------------------------------------------

const startServer = async () => {

    try {

        // Connect MongoDB first
        await connectDB();

        console.log(
            "MongoDB connected successfully"
        );


        // Start cron after DB connection
        startRankTrackingCron();

        console.log(
            "Rank tracking cron started"
        );


        // Start Express
        app.listen(PORT, () => {

            console.log(
                `Server running on port ${PORT}`
            );

        });

    } catch (error) {

        console.error(
            "Failed to start server:"
        );

        console.error(error);

        process.exit(1);
    }
};


startServer();