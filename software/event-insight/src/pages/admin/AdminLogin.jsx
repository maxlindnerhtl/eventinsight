import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {useAuth} from "../../components/AuthContext";

const AdminLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const {login} = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const {data} = await axios.post(
                'http://localhost:3001/admins/login',
                {username, password}
            );

            // Writes token, username and adminid to localStorage and sets the context user
            login({username: data.username, adminid: data.adminid}, data.token);

            navigate('/');
        } catch {
            setErrorMessage('Fehler bei der Anmeldung. Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.');
        }
    };

    return (
        <div className="wrapper theme-admin">
            <Header links={[]}/>
            <main className="main">
                <div className="page-narrow page-auth">
                    <div className="card">
                        <h1 className="page-title">Admin Login</h1>
                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="field">
                                <label htmlFor="login-username" className="field-label">Benutzername</label>
                                <input
                                    id="login-username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="Benutzername eingeben..."
                                    className="input-field"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="login-password" className="field-label">Passwort</label>
                                <input
                                    id="login-password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Passwort eingeben..."
                                    className="input-field"
                                />
                            </div>
                            <button className="btn btn-primary btn-block">
                                Login
                            </button>
                        </form>
                        {errorMessage && <p className="alert alert-error form-message">{errorMessage}</p>}
                    </div>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminLogin;