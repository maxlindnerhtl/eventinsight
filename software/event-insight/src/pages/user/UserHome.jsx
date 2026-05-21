import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

const UserHome = () => {
    const {id} = useParams();
    const [event, setEvent] = useState(null);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventText, setEventText] = useState("");

    const links = [
        {name: "Home", path: `/event/${id}`},
        {name: "Live-Map", path: `/event/${id}/userLiveMap`},
        {name: "Results", path: `/event/${id}/userResults`},
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
        }, "Failed to fetch sponsor data.");

        fetchData(`http://localhost:3001/events/${id}`, setEvent, "Failed to fetch event data.");

        fetchData(`http://localhost:3001/files/text/fetch?idtext=${id}`, (data) => {
            setEventText(data.text || "");
        }, "Failed to fetch event text.");
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="wrapper">
            <Header links={links}/>
            <main className="main">
                <div className="sponsor-event-container">
                    <div className="sponsor-images left">
                        {sponsors.slice(0, Math.ceil(sponsors.length / 2)).map(sponsor => (
                            <img
                                key={sponsor.idSponsors}
                                src={`http://localhost:3001/${sponsor.sponsorpath}`}
                                alt={sponsor.sponsorname}
                                className="sponsor-image"
                            />
                        ))}
                    </div>
                    <div className="event-info">
                        <h1 className="event-title">{event?.eventname}</h1>
                        <p className="event-date">{event?.formatted_date}</p>
                    </div>
                    <div className="sponsor-images right">
                        {sponsors.slice(Math.ceil(sponsors.length / 2)).map(sponsor => (
                            <img
                                key={sponsor.idSponsors}
                                src={`http://localhost:3001/${sponsor.sponsorpath}`}
                                alt={sponsor.sponsorname}
                                className="sponsor-image"
                            />
                        ))}
                    </div>
                </div>
                {eventText && (
                    <div className="text-container" dangerouslySetInnerHTML={{__html: eventText}}/>
                )}
            </main>
            <Footer/>
        </div>
    );
};

export default UserHome;