import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import axios from "axios";
import SearchableSelect from "../../components/SearchableSelect";

const AdminResults = () => {
    const {id} = useParams();
    const [listName, setListName] = useState("");
    const [listlink, setListlink] = useState("");
    const [selectedLiveMap, setSelectedLiveMap] = useState(null);
    const [liveMaps, setLiveMaps] = useState([]);

    const links = [
        { name: "Home", path: `/event/${id}/adminHome` },
        { name: "Live-Map", path: `/event/${id}/adminLiveMap` },
        { name: "API-Link", path: `/event/${id}/adminResults` },
        { name: "Sponsors", path: `/event/${id}/adminSponsors` },
        { name: "Edit Event", path: `/event/${id}/adminEdit` },
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
            const response = await fetch("http://localhost:3001/files/results/upload", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({listname: listName, listlink, eventid: id, idlivemap: selectedLiveMap}),
            });
            const data = await response.text();
            alert(data);
        } catch (error) {
            console.error("Fehler beim Hochladen:", error);
            alert("Fehler beim Hochladen der Daten.");
        }
    };

    return (
        <div className="wrapper">
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