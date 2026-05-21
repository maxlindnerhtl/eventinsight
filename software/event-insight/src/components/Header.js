import React, {useState, useEffect} from "react";
import {Link, useLocation, useNavigate} from "react-router-dom";
import user_logo from "../assets/images/Event_Insight_Logo.png";
import admin_logo from "../assets/images/Event_Insight_Logo_3.png";

const Header = ({links}) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const isLandingPage = location.pathname === "/";
    const isAdminLoginPage = location.pathname === "/adminLogin";
    const isLoggedIn = Boolean(localStorage.getItem("token"));
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchUsername = async () => {
            if (token) {
                try {
                    const response = await fetch("http://localhost:3001/admins/me", {
                        headers: {Authorization: `Bearer ${token}`},
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setUsername(data.username);
                        setIsAdmin(true);
                    } else {
                        setIsAdmin(false);
                        console.error("Failed to fetch username");
                    }
                } catch (err) {
                    console.error("Failed to fetch username:", err);
                }
            }
        };
        fetchUsername();
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("adminid");
        window.location.href = "/";
    };

    return (
        <header className={`header ${isAdmin || isAdminLoginPage ? "header-admin" : ""}`}>
            <div className="logo-container">
                <Link to="/" className="LogoLink">
                    <img src={isAdmin || isAdminLoginPage ? admin_logo : user_logo} alt="Event Insight Logo" className="logo"/>
                    <h1 className="header-title">Event Insight</h1>
                </Link>
            </div>
            <nav className="links">
                <ul>
                    {links.map((link, index) => (
                        <li key={index} className={`link-item ${location.pathname === link.path ? "active-link" : ""}`}>
                            <Link to={link.path}>{link.name}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
            {(isLandingPage || isAdmin) && (
                <div className="login-container">
                    {username && <span className="username-display">{username}</span>}
                    <button onClick={isLoggedIn ? handleLogout : () => navigate("/adminLogin")}
                            className="login-button">
                        {isLoggedIn ? "Abmelden" : "Anmelden"}
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;