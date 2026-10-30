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
                <div className="form-container">
                    <h2 className="admin-title">API-Link hochladen</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <input
                                type="text"
                                value={listName}
                                onChange={(e) => setListName(e.target.value)}
                                placeholder="Name der Liste"
                                className="input-field"
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="url"
                                value={listlink}
                                onChange={(e) => setListlink(e.target.value)}
                                placeholder="API-Link"
                                className="input-field"
                            />
                        </div>
                        <div className="input-group">
                            <SearchableSelect
                                options={liveMaps.map(map => ({
                                    value: map.idlivemap,
                                    label: map.mapname
                                }))}
                                onChange={(selectedOption) => setSelectedLiveMap(selectedOption?.value)}
                                placeholder="Live-Map auswählen..."
                                width={400}
                                menuWidth={400}
                            />
                        </div>
                        <button type="submit" className="submit-button">Hochladen</button>
                    </form>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminResults;