import React, {createContext, useState, useContext, useEffect} from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // validateToken is intentionally NOT using apiClient:
    // This is a startup existence-check (runs once on app init in useEffect line 25-29).
    // If the token is invalid, we want a silent clear without triggering apiClient's 401 interceptor,
    // which would dispatch auth:logout and hard-redirect even during startup initialization.
    // That would cause an unwanted page reload before the app has even finished mounting.
    // Only auth failures during normal app operation (after startup) should trigger the
    // apiClient -> auth:logout -> redirect flow.
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
        const isAdmin = !!user;
        localStorage.clear();
        setUser(null);
        
        const redirectTo = isAdmin ? '/adminLogin' : '/';
        window.location.href = redirectTo;
    };

    // Listen for 401 errors from apiClient and trigger logout
    useEffect(() => {
        const handleLogout = () => logout();
        window.addEventListener('auth:logout', handleLogout);
        return () => window.removeEventListener('auth:logout', handleLogout);
    }, [user]);

    return (
        <AuthContext.Provider value={{user, login, logout, loading}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);