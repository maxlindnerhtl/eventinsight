import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const AdminHome = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
            </main>
            <Footer />
        </div>
    );
};

export default AdminHome;