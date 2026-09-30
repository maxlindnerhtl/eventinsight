import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const AdminHome = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newAdminUsername, setNewAdminUsername] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminPasswordConfirmation, setNewAdminPasswordConfirmation] = useState('');
    const [adminMessage, setAdminMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`http://localhost:3001/events/${id}`)
            .then((res) => {
                setEvent(res.data);
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch event data");
                setLoading(false);
            });
    }, [id]);

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setAdminMessage('');

        if (newAdminPassword !== newAdminPasswordConfirmation) {
            setAdminMessage('Die Passwörter stimmen nicht überein.');
            return;
        }

        try {
            await axios.post(
                'http://localhost:3001/admins/createAdmin',
                {
                    username: newAdminUsername,
                    password: newAdminPassword
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            setAdminMessage('Admin erfolgreich erstellt.');
            setNewAdminUsername('');
            setNewAdminPassword('');
            setNewAdminPasswordConfirmation('');
        } catch (err) {
            const errorData = err.response?.data;
            const backendMessage =
                errorData?.message ||
                (typeof errorData?.error === 'string'
                    ? errorData.error
                    : errorData?.error?.message);

            setAdminMessage(
                backendMessage || 'Admin konnte nicht erstellt werden.'
            );
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="wrapper">
            <Header links={[
                { name: "Home", path: `/event/${id}/adminHome` },
                { name: "Live-Map", path: `/event/${id}/adminLiveMap` },
                { name: "API-Link", path: `/event/${id}/adminResults` },
                { name: "Sponsors", path: `/event/${id}/adminSponsors` },
                { name: "Edit Event", path: `/event/${id}/adminEdit` },
            ]} />
            <main className="main">
                <div className="event-info-admin">
                    <h1 className="event-title-admin">{event?.eventname}</h1>
                    <p className="event-date">{event?.formatted_date}</p>
                </div>
                <button className="submit-button" onClick={() => navigate(`/event/${id}/editText`)}>
                    Event-Text bearbeiten
                </button>
                <div className="form-container">
                    <h2 className="admin-title">Neuen Admin erstellen</h2>
                    <form onSubmit={handleCreateAdmin}>
                        <div className="input-group">
                            <input
                                type="text"
                                value={newAdminUsername}
                                onChange={(e) => setNewAdminUsername(e.target.value)}
                                required
                                placeholder="Benutzername eingeben..."
                                className="input-field"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                required
                                placeholder="Passwort eingeben..."
                                className="input-field"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                value={newAdminPasswordConfirmation}
                                onChange={(e) => setNewAdminPasswordConfirmation(e.target.value)}
                                required
                                placeholder="Passwort wiederholen..."
                                className="input-field"
                            />
                        </div>
                        <button type="submit" className="submit-button">
                            Admin erstellen
                        </button>
                    </form>
                    {adminMessage && <p className="error-message">{adminMessage}</p>}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminHome;