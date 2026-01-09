
import { User } from '../models/user.model.js';
import httpStatus from 'http-status';
import bcrypt, { hash } from 'bcrypt';
import crypto from 'crypto';
import { Meeting } from "../models/meeting.model.js";

const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "Username and password are required" });
    }
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User Not Found" })
        }


        let isPasswordCorrect = await bcrypt.compare(password, user.password)

        if (isPasswordCorrect) {
            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();

            // FIXED FOR CORS + HTTPONLY COOKIE AUTH: Different settings for dev/prod
            const isProduction = process.env.NODE_ENV === 'production';
            const cookieOptions = {
                httpOnly: true,
                secure: isProduction, // true in production (HTTPS), false in dev (HTTP)
                sameSite: isProduction ? 'none' : 'lax', // 'none' for cross-origin prod, 'lax' for localhost
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            };

            console.log('Login - Setting cookie with options:', cookieOptions);
            console.log('Login - Token:', token);
            console.log('Login - NODE_ENV:', process.env.NODE_ENV);

            res.cookie('token', token, cookieOptions);

            return res.status(httpStatus.OK).json({ message: "Login successful" })
        } else {
            return res.status(httpStatus.UNAUTHORIZED).json({ message: "Invalid Username or password" })
        }

    } catch (err) {
        console.error(err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
}

const register = async (req, res) => {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(httpStatus.FOUND).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            username,
            password: hashedPassword
        });
        await newUser.save();
        return res.status(httpStatus.CREATED).json({ message: "User registered successfully" });
    } catch (err) {
        console.error(err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
}

const getUserHistory = async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "No authentication token found" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }
        const meetings = await Meeting.find({ user_id: user.username })
        res.json(meetings)
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

const addToHistory = async (req, res) => {
    const token = req.cookies.token;
    const { meeting_code } = req.body;

    if (!token) {
        return res.status(httpStatus.UNAUTHORIZED).json({ message: "No authentication token found" });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({ message: "User not found" });
        }

        const newMeeting = new Meeting({
            user_id: user.username,
            meetingCode: meeting_code
        })


        await newMeeting.save();

        res.status(httpStatus.CREATED).json({ message: "Added code to history" })
    } catch (e) {
        res.json({ message: `Something went wrong ${e}` })
    }
}

const logout = async (req, res) => {
    try {
        // FIXED FOR CORS + HTTPONLY COOKIE AUTH: Must match login cookie options
        const isProduction = process.env.NODE_ENV === 'production';
        res.clearCookie('token', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        return res.status(httpStatus.OK).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Internal server error" });
    }
}

const checkAuth = async (req, res) => {
    const token = req.cookies.token;

    // DEBUG: Log what we receive
    console.log('Check Auth - Cookies received:', req.cookies);
    console.log('Check Auth - Token:', token);

    if (!token) {
        console.log('Check Auth - No token found in cookies');
        return res.status(httpStatus.UNAUTHORIZED).json({ authenticated: false, message: 'No token found' });
    }

    try {
        const user = await User.findOne({ token: token });
        if (!user) {
            console.log('Check Auth - User not found for token');
            return res.status(httpStatus.UNAUTHORIZED).json({ authenticated: false, message: 'Invalid token' });
        }
        console.log('Check Auth - Success for user:', user.username);
        return res.status(httpStatus.OK).json({ authenticated: true });
    } catch (err) {
        console.error('Check Auth - Error:', err);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ authenticated: false, message: 'Server error' });
    }
}

export { login, register, getUserHistory, addToHistory, logout, checkAuth };