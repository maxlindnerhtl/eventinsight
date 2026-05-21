import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const AdminLogin = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const toggleForm = () => setIsRegistering(prev => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');

        try {
            const url = isRegistering ? 'http://localhost:3001/admins/createAdmin' : 'http://localhost:3001/admins/login';
            const {data} = await axios.post(url, {username, password});

            if (!isRegistering) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('adminid', data.adminid);
            }

            navigate('/');
        } catch {
            setErrorMessage('Fehler bei der Anmeldung. Bitte überprüfen Sie Ihre Eingaben und versuchen Sie es erneut.');
        }
    };

    return (
        <div className="wrapper">
            <Header links={[]}/>
            <main className="main">
                <div className="form-container">
                    <h2 className={"admin-title"}>{isRegistering ? 'Admin Registrierung' : 'Admin Login'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Benutzername eingeben..."
                                className="input-field"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Passwort eingeben..."
                                className="input-field"
                            />
                        </div>
                        <button className="submit-button">
                            {isRegistering ? 'Registrieren' : 'Login'}
                        </button>
                    </form>
                    {errorMessage && <p className="error-message">{errorMessage}</p>}
                    <button onClick={toggleForm} className="toggle-form-button-admin">
                        {isRegistering ? 'Login' : 'Registrieren'}
                    </button>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminLogin;