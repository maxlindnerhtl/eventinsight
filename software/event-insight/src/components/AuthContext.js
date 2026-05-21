import React, {createContext, useState, useContext, useEffect} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const validateToken = async (token) => {
        try {
            const {data: {username}} = await axios.get('http://localhost:3001/admins/me', {
                headers: {Authorization: `Bearer ${token}`},
            });
            const adminid = localStorage.getItem('adminid');
            setUser({username, adminid});
            localStorage.setItem('username', username);
        } catch {
            localStorage.clear();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) validateToken(token);
        else setLoading(false);
    }, []);

    const login = (userData, token) => {
        const {username, adminid} = userData;
        localStorage.setItem('token', token);
        localStorage.setItem('username', username);
        localStorage.setItem('adminid', adminid);
        setUser({username, adminid});
    };

    const logout = () => {
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{user, login, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);