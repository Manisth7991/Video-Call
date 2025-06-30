import { useNavigate } from "react-router-dom";
import { useState, useContext ,createContext } from "react";
import axios from "axios";
import httpStatus from "http-status";
import server from "../environment";


export const AuthContext = createContext();

const client = axios.create({
    baseURL: `${server}/api/v1/users`,
});

export const AuthProvider = ({children}) =>{

    const authContext = useContext(AuthContext);

    const [userData, setUserData] = useState(AuthContext);
    const router = useNavigate();


    const handleRegister = async (name ,username, password) => {
        try {
            const request = await client.post("/register", {
                name,
                username,
                password
            });
            if(request.status === httpStatus.CREATED){
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

            if(request.status === httpStatus.OK){
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }


    const data = {
        userData,
        setUserData,
        handleRegister,
        handleLogin,
        getHistoryOfUser,
        addToUserHistory
    }
    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    );
}