import React, {useState, useEffect} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import Footer from "../components/Footer";
import SearchableSelect from "../components/SearchableSelect";
import Header from "../components/Header";

const LandingPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const isLoggedIn = !!localStorage.getItem("token");
    const adminId = localStorage.getItem("adminid");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = {Authorization: `Bearer ${token}`};

                if (isLoggedIn && adminId) {
                    const {data: allEvents} = await axios.get("http://localhost:3001/events", {headers});

                    const accessibleEvents = (
                        await Promise.all(
                            allEvents.map(async (event) => {
                                const {data} = await axios.post(
                                    "http://localhost:3001/admins/checkEventAccess",
                                    {adminid: adminId, eventid: event.idevents},
                                    {headers}
                                );
                                return data.access
                                    ? {value: event.idevents, label: `${event.eventname} (${event.formatted_date})`}
                                    : null;
                            })
                        )
                    ).filter(Boolean);

                    setEvents(accessibleEvents);
                } else {
                    const {data} = await axios.get("http://localhost:3001/events");
                    setEvents(
                        data.map((event) => ({
                            value: event.idevents,
                            label: `${event.eventname} (${event.formatted_date})`,
                        }))
                    );
                }
            } catch {
                setError("Fehler beim Abrufen der Events.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [isLoggedIn, adminId]);

    if (loading) return <div>Loading events...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="wrapper">
            <Header links={[]}/>
            <main className="main">
                {events.length > 0 ? (
                    <SearchableSelect
                        options={events}
                        onChange={(selectedOption) => {
                            if (selectedOption) {
                                navigate(
                                    isLoggedIn
                                        ? `/event/${selectedOption.value}/adminHome`
                                        : `/event/${selectedOption.value}`
                                );
                            }
                        }}
                        placeholder="Event auswählen..."
                        minInputLength={1}
                        width="600px"
                        menuWidth="600px"
                    />
                ) : (
                    <p>Keine Events verfügbar.</p>
                )}
                {isLoggedIn && adminId && (
                    <button
                        className="submit-button"
                        onClick={() => navigate('/addEvent')}
                    >
                        Neues Event anlegen
                    </button>
                )}
            </main>
            <Footer/>
        </div>
    );
};

export default LandingPage;