import express from 'express';
import { createServer } from 'node:http';
import { Server } from "socket.io";
import cors from 'cors';
import mongoose from 'mongoose';
import { connectToSocket } from './controllers/socketManager.js';
import userRoutes from './routes/users.routes.js';

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
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://7991manisth:oQzETXF87PRcyuBU@cluster0.ply0qyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

        const connectionDB = await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        server.listen(app.get("port"), () => {
            console.log(`Server is running on port ${app.get("port")}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

start();