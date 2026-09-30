import React, {useState, useEffect} from "react";
import {useParams, useNavigate} from "react-router-dom";
import axios from "axios";
import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import SearchableSelect from "../../components/SearchableSelect";

const AdminEdit = () => {
    const {id} = useParams();
    const [event, setEvent] = useState({});
    const [maps, setMaps] = useState([]);
    const [selectedMap, setSelectedMap] = useState(null);
    const [lists, setLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [actionError, setActionError] = useState('');
    const [isEditWindowOpen, setIsEditWindowOpen] = useState(false);
    const [currentField, setCurrentField] = useState("");
    const [currentValue, setCurrentValue] = useState("");
    const navigate = useNavigate();

    const fieldLabels = {
        eventname: "Name",
        eventdate: "Datum",
        eventlocation: "Ort",
        eventaddress: "Adresse",
        listname: "Listenname",
        listlink: "Listenlink",
        sponsorname: "Name"
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [eventRes, mapsRes, apiRes, sponsorRes] = await Promise.all([
                    axios.get(`http://localhost:3001/events/${id}`),
                    axios.get(`http://localhost:3001/files/livemap?eventid=${id}`),
                    axios.get(`http://localhost:3001/files/results/fetch?eventid=${id}`),
                    axios.get(`http://localhost:3001/files/sponsors?eventid=${id}`)
                ]);
                setEvent({
                    ...eventRes.data,
                    listname: apiRes.data[0]?.listname || "",
                    listlink: apiRes.data[0]?.listlink || ""
                });
                setMaps(mapsRes.data);
                setLists(apiRes.data);
                setSponsors(sponsorRes.data);
                setLoading(false);
            } catch (error) {
                setLoadError("Fehler beim Abrufen der Eventdaten");
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleUpdateClick = (field, value) => {
        setCurrentField(field);
        setCurrentValue(field === 'eventdate' ? new Date(value).toISOString().split('T')[0] : value);
        setIsEditWindowOpen(true);
    };

    const handleSave = async () => {
        setActionError('');
        if (!currentValue) {
            setActionError("Das Feld darf nicht leer sein");
            return;
        }
        try {
            const formattedValue = currentField === 'eventdate' ? new Date(currentValue).toISOString().split('T')[0] : currentValue;
            const updateId = currentField.startsWith('map') ? selectedMap.idlivemap : currentField.startsWith('list') ? selectedList.id : id;
            const endpoint = currentField.startsWith('map') || currentField.startsWith('list')
                ? 'http://localhost:3001/files/livemap/update'
                : 'http://localhost:3001/events/updateEvent';
            const client = endpoint.includes('/events/updateEvent')
                || endpoint.includes('/files/livemap/update')
                ? apiClient
                : axios;
            await client.put(endpoint, {id: updateId, field: currentField, value: formattedValue});
            if (currentField.startsWith('map')) setSelectedMap(prev => ({...prev, [currentField]: formattedValue}));
            else if (currentField.startsWith('list')) setSelectedList(prev => ({
                ...prev,
                [currentField]: formattedValue
            }));
            else setEvent(prev => ({...prev, [currentField]: formattedValue}));
            setIsEditWindowOpen(false);
        } catch (error) {
            const errorData = error.response?.data;
            const backendMessage =
                errorData?.message ||
                (typeof errorData?.error === 'string'
                    ? errorData.error
                    : errorData?.error?.message);

            setActionError(
                backendMessage || "Fehler beim Aktualisieren der Daten"
            );
        }
    };

    const handleDelete = async (type, id) => {
        const confirmDelete = window.confirm(`Möchten Sie diesen ${type} wirklich löschen?`);
        if (!confirmDelete) return;

        try {
            const endpoint = type === 'Map' ? 'http://localhost:3001/files/livemap/delete' : 'http://localhost:3001/files/sponsors/delete';
            const client = type === 'Map' ? apiClient : axios;
            await client.delete(endpoint, {data: {id}});
            if (type === 'Map') {
                setMaps(prev => prev.filter(item => item.idlivemap !== id));
                setSelectedMap(null); // Deselect the map
            } else {
                setSponsors(prev => prev.filter(item => item.idSponsors !== id));
            }
        } catch (error) {
            setActionError(`Fehler beim Löschen der ${type}`);
        }
    };

    const handleDeleteEvent = async () => {
        const confirmDelete = window.confirm("Möchten Sie dieses Event wirklich löschen?");
        if (!confirmDelete) return;

        try {
            await apiClient.delete(`http://localhost:3001/events/deleteEvent`, {data: {id}});
            navigate('/'); // Redirect to home after deletion
        } catch (error) {
            setActionError("Fehler beim Löschen des Events");
        }
    };

    const handleSelectChange = (type, selectedOption) => {
        if (!selectedOption) {
            type === 'map' ? setSelectedMap(null) : setSelectedList(null);
            return;
        }
        const selected = type === 'map' ? maps.find(map => map.idlivemap === selectedOption.value) : lists.find(list => list.listname === selectedOption.value);
        type === 'map' ? setSelectedMap(selected) : setSelectedList(selected);
    };

    const truncateText = (text, maxLength = 30) => text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    if (loading) return <div>Laden...</div>;
    if (loadError) return <div>{loadError}</div>;

    return (
        <div className="wrapper">
            <Header links={[
                {name: "Home", path: `/event/${id}/adminHome`},
                {name: "Live-Map", path: `/event/${id}/adminLiveMap`},
                {name: "API-Link", path: `/event/${id}/adminResults`},
                {name: "Sponsors", path: `/event/${id}/adminSponsors`},
                {name: "Edit Event", path: `/event/${id}/adminEdit`},
            ]}/>
            <main className="main">
                <div className="form-container">
                    <h2 className="admin-title">Event bearbeiten</h2>
                    <section>
                        <h3>Event-Informationen</h3>
                        <ul className="entry-list">
                            {Object.keys(fieldLabels).slice(0, 4).map(key => (
                                <li key={key} className="entry-list-item">
                                    {event[key] ? (
                                        isEditWindowOpen && currentField === key ? (
                                            <div className="edit-window">
                                                <input type="text" value={currentValue}
                                                       onChange={e => setCurrentValue(e.target.value)}/>
                                                <button className="edit-window-button" onClick={handleSave}>Speichern
                                                </button>
                                                <button className="edit-window-button"
                                                        onClick={() => setIsEditWindowOpen(false)}>Abbrechen
                                                </button>
                                                {actionError && <p className="error-message">{actionError}</p>}
                                            </div>
                                        ) : (
                                            <>
                                                <span>{fieldLabels[key]}: {truncateText(key === 'eventdate' ? new Date(event[key]).toISOString().split('T')[0] : event[key])}</span>
                                                <button className="edit-window-button"
                                                        onClick={() => handleUpdateClick(key, event[key])}>Aktualisieren
                                                </button>
                                            </>
                                        )
                                    ) : (
                                        <span
                                            style={{color: 'red'}}>{fieldLabels[key].toLowerCase()} nicht verfügbar</span>)}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section>
                        <h3>Sponsor-Informationen</h3>
                        <ul className="entry-list">
                            {sponsors.length > 0 ? (
                                sponsors.map(sponsor => (
                                    <div key={sponsor.idSponsors} className="entry-list-item">
                                        <span>{fieldLabels.sponsorname}: {sponsor.sponsorname}</span>
                                        <button className="edit-window-button"
                                                onClick={() => handleDelete('Sponsor', sponsor.idSponsors)}>Löschen
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <span className="entry-list-item"
                                      style={{color: 'red'}}>Sponsoren nicht verfügbar</span>
                            )}
                        </ul>
                    </section>
                    <section>
                        <h3>Karten Informationen</h3>
                        <SearchableSelect
                            options={maps.map(map => ({value: map.idlivemap, label: map.mapname}))}
                            onChange={option => handleSelectChange('map', option)}
                            placeholder="Karte auswählen"
                            width="400px"
                            menuWidth="400px"
                        />
                        {selectedMap && (
                            <ul className="entry-list">
                                {['mapname', 'maptime'].map(key => (
                                    <li key={key} className="entry-list-item">
                                        {isEditWindowOpen && currentField === key ? (
                                            <div className="edit-window">
                                                <input type="text" value={currentValue}
                                                       onChange={e => setCurrentValue(e.target.value)}/>
                                                <button className="edit-window-button" onClick={handleSave}>Speichern
                                                </button>
                                                <button className="edit-window-button"
                                                        onClick={() => setIsEditWindowOpen(false)}>Abbrechen
                                                </button>
                                                {actionError && <p className="error-message">{actionError}</p>}
                                            </div>
                                        ) : (
                                            <>
                                                <span>{key === 'mapname' ? 'Kartenname' : 'Kartenzeit'}: {truncateText(selectedMap[key])}</span>
                                                <button className="edit-window-button"
                                                        onClick={() => handleUpdateClick(key, selectedMap[key])}>Aktualisieren
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                                <li className="entry-list-item">
                                    <button className="edit-window-button"
                                            onClick={() => handleDelete('Map', selectedMap.idlivemap)}>Karte löschen
                                    </button>
                                </li>
                            </ul>
                        )}
                    </section>
                    <section>
                        <h3>Listen Informationen</h3>
                        <SearchableSelect
                            options={lists.map(list => ({value: list.listname, label: list.listname}))}
                            onChange={option => handleSelectChange('list', option)}
                            placeholder="Liste auswählen"
                            width="400px"
                            menuWidth="400px"
                        />
                        {selectedList && (
                            <ul className="entry-list">
                                {['listname', 'listlink'].map(key => (
                                    <li key={key} className="entry-list-item">
                                        {isEditWindowOpen && currentField === key ? (
                                            <div className="edit-window">
                                                <input type="text" value={currentValue}
                                                       onChange={e => setCurrentValue(e.target.value)}/>
                                                <button className="edit-window-button" onClick={handleSave}>Speichern
                                                </button>
                                                <button className="edit-window-button"
                                                        onClick={() => setIsEditWindowOpen(false)}>Abbrechen
                                                </button>
                                                {actionError && <p className="error-message">{actionError}</p>}
                                            </div>
                                        ) : (
                                            <>
                                                <span>{key === 'listname' ? 'Listenname' : 'Listenlink'}: {truncateText(selectedList[key])}</span>
                                                <button className="edit-window-button"
                                                        onClick={() => handleUpdateClick(key, selectedList[key])}>Aktualisieren
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                    <section>
                        <button style={{marginTop: '20px'}} className="edit-window-button"
                                onClick={handleDeleteEvent}>Event löschen
                        </button>
                    </section>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AdminEdit;