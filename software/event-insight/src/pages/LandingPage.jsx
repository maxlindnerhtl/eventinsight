import React, {useState, useEffect} from "react";
import {Link, useNavigate} from "react-router-dom";
import {ArrowRight} from "lucide-react";
import axios from "axios";
import Footer from "../components/Footer";
import SearchableSelect from "../components/SearchableSelect";
import Header from "../components/Header";
import {useAuth} from "../components/AuthContext";

const LandingPage = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const {user} = useAuth();
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
                                    ? {
                                        value: event.idevents,
                                        label: `${event.eventname} (${event.formatted_date})`,
                                        eventname: event.eventname,
                                        formatted_date: event.formatted_date,
                                    }
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
                            eventname: event.eventname,
                            formatted_date: event.formatted_date,
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
        <div className={`wrapper ${user ? "theme-admin" : "theme-user"}`}>
            <Header links={[]}/>
            <main className="main main-flush">
                <section className="landing-hero">
                    {/* Decorative course line with start and finish; colors come from CSS */}
                    <svg className="landing-hero-course" viewBox="0 0 1200 380" preserveAspectRatio="xMidYMid slice"
                         aria-hidden="true" focusable="false">
                        <path className="course-line" d="M90 320 C220 120 360 360 520 230 S780 40 920 170 S1060 300 1110 90"/>
                        <circle className="course-start" cx="90" cy="320" r="14"/>
                        <circle className="course-finish" cx="1110" cy="90" r="16"/>
                        <circle className="course-finish-dot" cx="1110" cy="90" r="6"/>
                    </svg>
                    <div className="landing-hero-inner">
                        <h1 className="landing-title">Läufe live verfolgen</h1>
                        <span className="landing-accent" aria-hidden="true"/>
                        <p className="landing-lead">Live-Karte, Höhenprofil und Ergebnisse zu jeder Veranstaltung.</p>
                    </div>
                </section>
                <div className="landing-body">
                    <div className="card landing-select-card">
                        {events.length > 0 ? (
                            <div className="field">
                                <span className="field-label">Event auswählen</span>
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
                                    width="100%"
                                    menuWidth="100%"
                                />
                            </div>
                        ) : (
                            <p className="landing-empty">Keine Events verfügbar.</p>
                        )}
                    </div>
                    {isLoggedIn && adminId && (
                        <div className="landing-admin-action">
                            <button
                                className="btn btn-on-dark"
                                onClick={() => navigate('/addEvent')}
                            >
                                Neues Event anlegen
                            </button>
                        </div>
                    )}
                    {events.length > 0 && (
                        <section className="landing-events">
                            <h2 className="section-title">Alle Events</h2>
                            <ul className="event-card-list">
                                {events.map((event) => (
                                    <li key={event.value}>
                                        <Link
                                            to={isLoggedIn ? `/event/${event.value}/adminHome` : `/event/${event.value}`}
                                            className="card event-card"
                                        >
                                            <span className="event-card-text">
                                                <span className="event-card-name">{event.eventname}</span>
                                                <span className="event-card-date">{event.formatted_date}</span>
                                            </span>
                                            <ArrowRight className="event-card-arrow" size={20} aria-hidden="true"/>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default LandingPage;