import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error("MONGODB_URI is not defined");
        }

        console.log("Connecting to MongoDB...");

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 30000,
            connectTimeoutMS: 30000,
            socketTimeoutMS: 45000,
        });

        console.log("MongoDB connected successfully");
        console.log(
            `MongoDB database: ${mongoose.connection.name}`
        );

    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error);

        throw error;
    }
};

export default connectDB;