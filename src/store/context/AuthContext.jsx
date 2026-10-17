import { createContext, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import apiRequest from "../../utils/apiRequestUrl";

export const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'umi_student_auth_token';

export const AuthContextProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    });

    const updateUser = (data) => {
        setToken(data.token);
        <Navigate to="/" replace />
    };

    const logout = () => {
        // Revoke the token server-side. Fire-and-forget: local sign-out must not wait on the network.
        const currentToken = localStorage.getItem(TOKEN_STORAGE_KEY) || localStorage.getItem('token');
        if (currentToken) {
            apiRequest
                .post('/student/logout', null, { headers: { Authorization: `Bearer ${currentToken}` } })
                .catch(() => {});
        }
        setToken(null);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        <Navigate to="/login" replace />
    };

    useEffect(() => {
        if (!token) {
            <Navigate to="/login" replace />
        } else {
            localStorage.setItem(TOKEN_STORAGE_KEY, token);
        }
    }, [token]);

    return (
        <AuthContext.Provider value={{ token, updateUser, logout }}>
            {children}
        </AuthContext.Provider>
    );
}; 