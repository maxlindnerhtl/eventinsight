import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import apiClient from "../../utils/apiClient";

const getBackendMessage = (error) => {
    const errorData = error.response?.data;
    return errorData?.message ||
        (typeof errorData?.error === 'string'
            ? errorData.error
            : errorData?.error?.message);
};

const AdminSponsors = () => {
    const {id} = useParams();
    const links = [
        { name: "Home", path: `/event/${id}/adminHome` },
        { name: "Live-Karte", path: `/event/${id}/adminLiveMap` },
        { name: "API-Link", path: `/event/${id}/adminResults` },
        { name: "Sponsoren", path: `/event/${id}/adminSponsors` },
        { name: "Event bearbeiten", path: `/event/${id}/adminEdit` },
    ];

    const [file, setFile] = useState(null);
    const [sponsorName, setSponsorName] = useState("");
    const [sponsorList, setSponsorList] = useState([]);

    const fetchSponsors = async () => {
        try {
            const response = await fetch(`http://localhost:3001/files/sponsors?eventid=${id}`);
            const data = await response.json();
            setSponsorList(data);
        } catch {
            alert("Fehler beim Laden der Sponsorenliste.");
        }
    };

    useEffect(() => {
        fetchSponsors();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !sponsorName.trim()) {
            alert("Bitte alle Felder ausfüllen.");
            return;
        }

        const formData = new FormData();
        formData.append("sponsorFile", file);
        formData.append("sponsorname", sponsorName);
        formData.append("eventid", id);

        try {
            const response = await apiClient.post("/files/sponsors/upload", formData);
            alert(response.data);
            setFile(null);
            setSponsorName("");
            fetchSponsors();
        } catch (error) {
            alert(getBackendMessage(error) || "Fehler beim Hochladen der Datei.");
        }
    };

    const handleSponsorToggle = (sponsorId) => {
        setSponsorList((prevList) =>
            prevList.map((sponsor) =>
                sponsor.idSponsors === sponsorId
                    ? {...sponsor, is_displayed: sponsor.is_displayed === 1 ? 0 : 1}
                    : sponsor
            )
        );
    };

    const handleSaveDisplayedSponsors = async () => {
        try {
            const displayedSponsors = sponsorList
                .filter((sponsor) => sponsor.is_displayed === 1)
                .map((sponsor) => sponsor.idSponsors);

            const response = await apiClient.post("/files/sponsors/updateDisplay", {eventid: id, displayedSponsors});
            alert(response.data);
        } catch (error) {
            alert(getBackendMessage(error) || "Fehler beim Speichern der Sponsoranzeige.");
        }
    };

    return (
        <div className="wrapper theme-admin">
            <Header links={links}/>
            <main className="main">
                <div className="page-narrow">
                    <section className="card">
                        <h1 className="page-title">Sponsorbild hochladen</h1>
                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="field">
                                <label htmlFor="sponsor-name" className="field-label">Name des Sponsors</label>
                                <input
                                    id="sponsor-name"
                                    type="text"
                                    value={sponsorName}
                                    onChange={(e) => setSponsorName(e.target.value)}
                                    placeholder="Name des Sponsors"
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="sponsor-file" className="field-label">Bilddatei</label>
                                <input
                                    id="sponsor-file"
                                    type="file"
                                    name="sponsorFile"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="input-field"
                                    accept="image/*"
                                    required
                                />
                            </div>
                            <div className="form-actions">
                                <button className="btn btn-primary">Hochladen</button>
                            </div>
                        </form>
                    </section>
                    <section className="card">
                        <h2 className="section-title">Sponsorenliste</h2>
                        <ul className="sponsor-list">
                            {sponsorList.map((sponsor) => (
                                <li key={sponsor.idSponsors} className="sponsor-item">
                                    <label className="sponsor-item-label">
                                        <input
                                            type="checkbox"
                                            className="sponsor-item-check"
                                            checked={sponsor.is_displayed === 1}
                                            onChange={() => handleSponsorToggle(sponsor.idSponsors)}
                                        />
                                        <img
                                            src={`http://localhost:3001/${sponsor.sponsorpath}`}
                                            alt={sponsor.sponsorname}
                                            className="sponsor-thumbnail"
                                        />
                                        <span className="sponsor-item-name">{sponsor.sponsorname}</span>
                                    </label>
                                </li>
                            ))}
                        </ul>
                        <div className="form-actions">
                            <button onClick={handleSaveDisplayedSponsors} className="btn btn-primary">
                                Änderungen speichern
                            </button>
                        </div>
                    </section>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminSponsors;