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
        {name: "Live-Map", path: `/event/${id}/adminLiveMap`},
        {name: "API-Link", path: `/event/${id}/adminResults`},
        {name: "Sponsors", path: `/event/${id}/adminSponsors`},
        {name: "Edit Event", path: `/event/${id}/adminEdit`},
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
            alert("Fehler beim Hochladen der Live-Map");
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

                await axios.post("http://localhost:3001/files/intermediateTimes/add", markerData);
            }
            alert("Zwischenzeiten erfolgreich gespeichert!");
        } catch (error) {
            console.error("Fehler beim Speichern der Zwischenzeiten:", error);
            alert("Fehler beim Speichern der Zwischenzeiten");
        }
    };

    return (
        <div className="wrapper">
            <Header links={links}/>
            <main className="main">
                <div className="form-container" style={{marginBottom: "50px"}}>
                    <h2 className="admin-title">Live-Map hochladen</h2>
                    <form onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                placeholder="Name der Karte"
                                value={mapName}
                                onChange={handleMapNameChange}
                                className="input-field"
                            />
                        </div>
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <label className="input-label" style={{marginRight: '10px'}}>Startzeit:</label>
                            <input
                                type="time"
                                value={time}
                                onChange={handleTimeChange}
                                className="input-field"
                                step="60"
                            />
                        </div>
                        <div>
                            <input
                                type="file"
                                name="LiveMap"
                                onChange={handleFileChange}
                                className="input-field"
                            />
                        </div>
                        <button type="submit" className="submit-button">Hochladen</button>
                    </form>
                </div>
                <div className="form-container" style={{width: "90vw", maxWidth: "1200px", margin: "auto"}}>
                    <h2 className="admin-title">Zwischenzeiten einzeichnen</h2>
                    <SearchableSelect
                        options={gpxData.map(({value, label}) => ({value, label, key: value}))}
                        onChange={handleSelectionChange}
                        placeholder="Live-Map auswählen..."
                        minInputLength={2}
                        width="100%"
                        menuWidth="100%"
                    />
                    <br/>
                    {selectedGpx && selectedGpx.value && (
                        <>
                            <MarkerHandler
                                gpxPath={selectedGpx.value}
                                selectedGpxId={selectedGpx.id}
                                participantsData={[]}
                                isAdmin={true}
                                setIntermediateMarkers={setIntermediateMarkers}
                            />
                            <button onClick={saveIntermediateTimes} className="submit-button"
                                    style={{marginTop: "20px"}}>
                                Zwischenzeiten speichern
                            </button>
                        </>
                    )}
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminLiveMap;