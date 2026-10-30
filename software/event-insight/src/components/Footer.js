import React, {useState} from "react";
import {Link, useLocation} from "react-router-dom";


const Footer = () => {
    const location = useLocation();
    const isAdminLoginPage = location.pathname === "/adminLogin";
    const [isAdmin] = useState(!!localStorage.getItem("token"));

    const contacts = [
        {
            name: "Lukas Sumann",
            instagram: "https://www.instagram.com/lukas.sumann/",
            email: "lukas.sumann@edu.htl-klu.at"
        },
        {
            name: "Maximilian Lindner",
            instagram: "https://www.instagram.com/tallclod/",
            email: "maximilian.lindner@edu.htl-klu.at"
        }
    ];

    return (
        <footer className={`footer ${isAdmin || isAdminLoginPage ? "footer-admin" : ""}`}>
            <div className="footer-content">
                <p className="footer-brand">
                    Event Insight · HTL Klagenfurt ·{" "}
                    <Link to="https://projects.htl-klu.at/Projekt_2425/pr5ahel24058/Homepage/index.html" target="_blank"
                          rel="noopener noreferrer">About Us</Link>
                </p>
                <ul className="footer-contacts">
                    {contacts.map(({name, instagram, email}) => (
                        <li className="footer-contact" key={name}>
                            <span className="footer-contact-name">{name}</span>
                            {" · "}
                            <a href={instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                            {" · "}
                            <a href={`mailto:${email}`}>{email}</a>
                        </li>
                    ))}
                </ul>
            </div>
        </footer>
    );
}

export default Footer;