import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axios from "axios";
import apiClient from "../../utils/apiClient";
import SearchableSelect from "../../components/SearchableSelect";

const AdminResults = () => {
    const {id} = useParams();
    const [listName, setListName] = useState("");
    const [listlink, setListlink] = useState("");
    const [selectedLiveMap, setSelectedLiveMap] = useState(null);
    const [liveMaps, setLiveMaps] = useState([]);

    const links = [
        { name: "Home", path: `/event/${id}/adminHome` },
        { name: "Live-Karte", path: `/event/${id}/adminLiveMap` },
        { name: "API-Link", path: `/event/${id}/adminResults` },
        { name: "Sponsoren", path: `/event/${id}/adminSponsors` },
        { name: "Event bearbeiten", path: `/event/${id}/adminEdit` },
    ];

    useEffect(() => {
        const fetchLiveMaps = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/files/livemap?eventid=${id}`);
                setLiveMaps(response.data);
                if (response.data.length > 0) setSelectedLiveMap(response.data[0].idlivemap);
            } catch (err) {
                console.error("Error fetching live maps:", err);
                alert("Fehler beim Laden der LiveMaps.");
            }
        };
        fetchLiveMaps();
    }, [id]);

    const apiLinkPattern = /^https:\/\/api\.raceresult\.com\/\d+\/[A-Za-z0-9]+$/;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!listName || !listlink || !selectedLiveMap) {
            alert("Bitte alle Felder ausfüllen.");
            return;
        }
        if (!apiLinkPattern.test(listlink)) {
            alert("Ungültiger API-Link. Der Link muss das Format 'https://api.raceresult.com/...' haben.");
            return;
        }
        try {
            const response = await apiClient.post(
                "http://localhost:3001/files/results/upload",
                {
                    listname: listName,
                    listlink,
                    eventid: id,
                    idlivemap: selectedLiveMap
                }
            );
            alert(response.data);
        } catch (error) {
            console.error("Fehler beim Hochladen:", error);
            const errorData = error.response?.data;
            const backendMessage =
                errorData?.message ||
                (typeof errorData?.error === 'string'
                    ? errorData.error
                    : errorData?.error?.message);

            alert(backendMessage || "Fehler beim Hochladen der Daten.");
        }
    };

    return (
        <div className="wrapper theme-admin">
            <Header links={links}/>
            <main className="main">
                <div className="page-narrow">
                    <div className="card">
                        <h1 className="page-title">API-Link hochladen</h1>
                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="field">
                                <label htmlFor="list-name" className="field-label">Name der Liste</label>
                                <input
                                    id="list-name"
                                    type="text"
                                    value={listName}
                                    onChange={(e) => setListName(e.target.value)}
                                    placeholder="Name der Liste"
                                    className="input-field"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="list-link" className="field-label">API-Link</label>
                                <input
                                    id="list-link"
                                    type="url"
                                    value={listlink}
                                    onChange={(e) => setListlink(e.target.value)}
                                    placeholder="API-Link"
                                    className="input-field"
                                />
                                <span className="field-hint">Format: https://api.raceresult.com/…</span>
                            </div>
                            <div className="field">
                                <span className="field-label">Live-Map</span>
                                <SearchableSelect
                                    options={liveMaps.map(map => ({
                                        value: map.idlivemap,
                                        label: map.mapname
                                    }))}
                                    onChange={(selectedOption) => setSelectedLiveMap(selectedOption?.value)}
                                    placeholder="Live-Map auswählen..."
                                    width="100%"
                                    menuWidth="100%"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Hochladen</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminResults;