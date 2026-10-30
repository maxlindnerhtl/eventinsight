import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";
import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MarkerHandler from "../../components/MarkerHandler";
import SearchableSelect from "../../components/SearchableSelect";

const AdminLiveMap = () => {
    const {id} = useParams();
    const [gpxData, setGpxData] = useState([]);
    const [selectedGpx, setSelectedGpx] = useState(null);
    const [file, setFile] = useState(null);
    const [mapName, setMapName] = useState("");
    const [time, setTime] = useState("");
    const [intermediateMarkers, setIntermediateMarkers] = useState([]);

    const links = [
        {name: "Home", path: `/event/${id}/adminHome`},
        {name: "Live-Karte", path: `/event/${id}/adminLiveMap`},
        {name: "API-Link", path: `/event/${id}/adminResults`},
        {name: "Sponsoren", path: `/event/${id}/adminSponsors`},
        {name: "Event bearbeiten", path: `/event/${id}/adminEdit`},
    ];

    useEffect(() => {
        const fetchDatabaseFiles = async () => {
            try {
                const response = await axios.get(`http://localhost:3001/files/livemap?eventid=${id}`);
                setGpxData(response.data.map(file => ({
                    value: `http://localhost:3001/${file.mappath}`,
                    label: file.mapname,
                    id: file.idlivemap,
                })));
            } catch (err) {
                console.error("Error fetching database files:", err);
            }
        };
        fetchDatabaseFiles();
    }, [id]);

    const handleSelectionChange = async (selectedOption) => {
        if (!selectedOption) {
            setSelectedGpx(null);
            setIntermediateMarkers([]);
            return;
        }

        const newGpx = gpxData.find(data => data.value === selectedOption?.value);
        if (newGpx) {
            setSelectedGpx({
                id: newGpx.id,
                value: newGpx.value,
                label: newGpx.label
            });

            try {
                const response = await axios.get(`http://localhost:3001/files/intermediateTimes/getByMap?idlivemap=${newGpx.id}`);
                setIntermediateMarkers(response.data.map(marker => ({
                    latitude: parseFloat(marker.latitude),
                    longitude: parseFloat(marker.longitude),
                    position: [parseFloat(marker.latitude), parseFloat(marker.longitude)]
                })));
            } catch (err) {
                console.error("Error loading intermediate times:", err);
            }
        }
    };

    const handleFileChange = (e) => setFile(e.target.files[0]);
    const handleMapNameChange = (e) => setMapName(e.target.value);
    const handleTimeChange = (e) => setTime(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !mapName.trim() || !time) {
            alert("Bitte wähle eine Datei, gib einen Kartennamen und eine Zeit ein.");
            return;
        }

        const formData = new FormData();
        formData.append("LiveMap", file);
        formData.append("mapname", mapName);
        formData.append("eventid", id);
        formData.append("maptime", time);

        try {
            const response = await apiClient.post(
                "http://localhost:3001/files/livemap/upload",
                formData
            );
            alert(response.data);
        } catch (error) {
            console.error("Fehler:", error);
            alert("Fehler beim Hochladen der Live-Karte");
        }
    };

    const saveIntermediateTimes = async () => {
        if (!selectedGpx?.id || intermediateMarkers.length === 0) {
            console.error("Kein gültiger Marker zum Speichern!");
            alert("Kein gültiger Marker zum Speichern!");
            return;
        }

        try {
            for (let marker of intermediateMarkers) {
                const markerData = {
                    idlivemap: selectedGpx.id,
                    latitude: marker.latitude,
                    longitude: marker.longitude
                };

                console.log("Payload being sent:", JSON.stringify(markerData, null, 2));

                await apiClient.post("/files/intermediateTimes/add", markerData);
            }
            alert("Zwischenzeiten erfolgreich gespeichert!");
        } catch (error) {
            console.error("Fehler beim Speichern der Zwischenzeiten:", error);
            const errorData = error.response?.data;
            const backendMessage =
                errorData?.message ||
                (typeof errorData?.error === 'string'
                    ? errorData.error
                    : errorData?.error?.message);

            alert(backendMessage || "Fehler beim Speichern der Zwischenzeiten");
        }
    };

    return (
        <div className="wrapper theme-admin">
            <Header links={links}/>
            <main className="main">
                <div className="page">
                    <section className="card card-narrow">
                        <h1 className="page-title">Live-Karte hochladen</h1>
                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="field">
                                <label htmlFor="map-name" className="field-label">Name der Karte</label>
                                <input
                                    id="map-name"
                                    type="text"
                                    placeholder="Name der Karte"
                                    value={mapName}
                                    onChange={handleMapNameChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="map-time" className="field-label">Startzeit</label>
                                <input
                                    id="map-time"
                                    type="time"
                                    value={time}
                                    onChange={handleTimeChange}
                                    className="input-field"
                                    step="60"
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="map-file" className="field-label">GPX-Datei</label>
                                <input
                                    id="map-file"
                                    type="file"
                                    name="LiveMap"
                                    onChange={handleFileChange}
                                    className="input-field"
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Hochladen</button>
                            </div>
                        </form>
                    </section>
                    <section className="card">
                        <h2 className="section-title">Zwischenzeiten einzeichnen</h2>
                        <div className="admin-map-select">
                            <SearchableSelect
                                options={gpxData.map(({value, label}) => ({value, label, key: value}))}
                                onChange={handleSelectionChange}
                                placeholder="Karte auswählen…"
                                minInputLength={2}
                                width="100%"
                                menuWidth="100%"
                            />
                        </div>
                        {selectedGpx && selectedGpx.value && (
                            <>
                                <div className="admin-map">
                                    <MarkerHandler
                                        gpxPath={selectedGpx.value}
                                        selectedGpxId={selectedGpx.id}
                                        participantsData={[]}
                                        isAdmin={true}
                                        setIntermediateMarkers={setIntermediateMarkers}
                                    />
                                </div>
                                <div className="form-actions">
                                    <button onClick={saveIntermediateTimes} className="btn btn-primary">
                                        Zwischenzeiten speichern
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminLiveMap;