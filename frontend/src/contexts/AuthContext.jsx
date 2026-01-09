import { useNavigate } from "react-router-dom";
import { useState, useContext, createContext } from "react";
import axios from "axios";
import httpStatus from "http-status";
import server from "../environment";


export const AuthContext = createContext();

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
    withCredentials: true // Enable sending cookies with requests
});

export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(AuthContext);
    const router = useNavigate();


    const handleRegister = async (name, username, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                password
            });
            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            const request = await client.post("/login", {
                username,
                password
            });

            console.log(username, password)
            console.log(request.data)

            if (request.status === httpStatus.OK) {
                // Cookie is automatically set by server with HttpOnly flag
                router("/home");
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            // Token is automatically sent via cookies
            let request = await client.get("/get_all_activity");
            return request.data
        } catch
        (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            // Token is automatically sent via cookies
            let request = await client.post("/add_to_activity", {
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }

    const handleLogout = async () => {
        try {
            await client.post("/logout");
            // Cookie is cleared by server
        } catch (error) {
            console.error("Logout error:", error);
            throw error;
        }
    }


    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        handleLogout,
        getHistoryOfUser,
        addToUserHistory
    }
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
}