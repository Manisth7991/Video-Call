import express from 'express';
import { createServer } from 'node:http';
import { Server } from "socket.io";
import cors from 'cors';
import mongoose from 'mongoose';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/users.routes.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000));
app.use(cors());
app.use(express.json({ limit: '40kb' }));
app.use(express.urlencoded({ extended: true, limit: '40kb' }));


app.use("/api/v1/users", userRoutes);


const start = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://7991manisth:oQzETXF87PRcyuBU@cluster0.ply0qyq.mongodb.net/videochat?retryWrites=true&w=majority&appName=Cluster0';

        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const connectionDB = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');

        server.listen(app.get("port"), () => {
            console.log(`🚀 Server is running on port ${app.get("port")}`);
        });
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.error('Check: 1) MongoDB cluster is active 2) Network Access allows 0.0.0.0/0 3) Credentials are correct');
        process.exit(1);
    }
}

start();