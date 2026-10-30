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
        <div className="wrapper theme-admin">
            <Header links={[
                { name: "Home", path: `/event/${id}/adminHome` },
                { name: "Live-Karte", path: `/event/${id}/adminLiveMap` },
                { name: "API-Link", path: `/event/${id}/adminResults` },
                { name: "Sponsoren", path: `/event/${id}/adminSponsors` },
                { name: "Event bearbeiten", path: `/event/${id}/adminEdit` },
            ]} />
            <main className="main">
                <div className="page-narrow">
                    <section className="card event-summary">
                        <p className="event-summary-meta">
                            {event?.formatted_date}
                            {event?.eventlocation && <span> · {event.eventlocation}</span>}
                        </p>
                        <h1 className="page-title">{event?.eventname}</h1>
                        <div className="form-actions">
                            <button className="btn btn-secondary" onClick={() => navigate(`/event/${id}/editText`)}>
                                Event-Text bearbeiten
                            </button>
                        </div>
                    </section>
                    <section className="card">
                        <h2 className="section-title">Neuen Admin erstellen</h2>
                        <form onSubmit={handleCreateAdmin} className="form-stack">
                            <div className="field">
                                <label htmlFor="admin-username" className="field-label">Benutzername</label>
                                <input
                                    id="admin-username"
                                    type="text"
                                    value={newAdminUsername}
                                    onChange={(e) => setNewAdminUsername(e.target.value)}
                                    required
                                    placeholder="Benutzername eingeben..."
                                    className="input-field"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="admin-password" className="field-label">Passwort</label>
                                <input
                                    id="admin-password"
                                    type="password"
                                    value={newAdminPassword}
                                    onChange={(e) => setNewAdminPassword(e.target.value)}
                                    required
                                    placeholder="Passwort eingeben..."
                                    className="input-field"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="admin-password-confirm" className="field-label">Passwort wiederholen</label>
                                <input
                                    id="admin-password-confirm"
                                    type="password"
                                    value={newAdminPasswordConfirmation}
                                    onChange={(e) => setNewAdminPasswordConfirmation(e.target.value)}
                                    required
                                    placeholder="Passwort wiederholen..."
                                    className="input-field"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">
                                    Admin erstellen
                                </button>
                            </div>
                        </form>
                        {adminMessage && <p className="alert form-message">{adminMessage}</p>}
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AdminHome;