import React, {useState, useEffect} from "react";
import {Link, useParams} from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import {sanitizeHtml} from "../../utils/sanitizeHtml";

const UserHome = () => {
    const {id} = useParams();
    const [event, setEvent] = useState(null);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventText, setEventText] = useState("");

    const links = [
        {name: "Home", path: `/event/${id}`},
        {name: "Live-Karte", path: `/event/${id}/userLiveMap`},
        {name: "Ergebnisse", path: `/event/${id}/userResults`},
    ];

    useEffect(() => {
        const fetchData = async (url, setData, errorMsg) => {
            try {
                const {data} = await axios.get(url);
                setData(data);
            } catch (err) {
                console.error(errorMsg, err);
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        fetchData(`http://localhost:3001/files/sponsors?eventid=${id}`, (data) => {
            const displayedSponsors = data.filter(sponsor => sponsor.is_displayed === 1);
            setSponsors(displayedSponsors.length === 1 ? [displayedSponsors[0], displayedSponsors[0]] : displayedSponsors);
        }, "Sponsoren konnten nicht geladen werden.");

        fetchData(`http://localhost:3001/events/${id}`, setEvent, "Event konnte nicht geladen werden.");

        fetchData(`http://localhost:3001/files/text/fetch?idtext=${id}`, (data) => {
            setEventText(data.text || "");
        }, "Event-Text konnte nicht geladen werden.");
    }, [id]);

    if (loading) return <div>Wird geladen…</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="wrapper theme-user">
            <Header links={links}/>
            <main className="main main-flush">
                <section className="event-hero">
                    <div className="event-hero-inner">
                        <div className="event-hero-chips">
                            {event?.formatted_date && <span className="chip">{event.formatted_date}</span>}
                            {event?.eventlocation && <span className="chip">{event.eventlocation}</span>}
                            <span className="chip chip-solid">Live</span>
                        </div>
                        <h1 className="event-hero-title">{event?.eventname}</h1>
                        <div className="event-hero-actions">
                            <Link to={`/event/${id}/userLiveMap`} className="btn btn-on-dark">Zur Live-Karte</Link>
                            <Link to={`/event/${id}/userResults`} className="btn btn-on-dark-outline">Ergebnisse</Link>
                        </div>
                    </div>
                </section>
                <div className="event-layout">
                    {eventText && (
                        <article className="card event-text" dangerouslySetInnerHTML={{__html: sanitizeHtml(eventText)}}/>
                    )}
                    <aside className="event-sidebar">
                        <section className="card live-card">
                            <span className="badge-live">Live</span>
                            <h2 className="section-title">Live-Karte</h2>
                            <p className="live-card-text">Strecke, Positionen der Teilnehmenden und Höhenprofil in Echtzeit.</p>
                            <Link to={`/event/${id}/userLiveMap`} className="btn btn-primary">Karte öffnen</Link>
                        </section>
                        {sponsors.length > 0 && (
                            <section className="card">
                                <h2 className="section-title">Sponsoren</h2>
                                <div className="sponsor-grid">
                                    {sponsors.map((sponsor, index) => (
                                        <img
                                            key={`${sponsor.idSponsors}-${index}`}
                                            src={`http://localhost:3001/${sponsor.sponsorpath}`}
                                            alt={sponsor.sponsorname}
                                            className="sponsor-grid-image"
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </aside>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default UserHome;