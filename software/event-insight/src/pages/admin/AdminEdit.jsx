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
            } catch {
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
            await apiClient.delete(endpoint, {data: {id}});
            if (type === 'Map') {
                setMaps(prev => prev.filter(item => item.idlivemap !== id));
                setSelectedMap(null); // Deselect the map
            } else {
                setSponsors(prev => prev.filter(item => item.idSponsors !== id));
            }
        } catch {
            setActionError(`Fehler beim Löschen der ${type}`);
        }
    };

    const handleDeleteEvent = async () => {
        const confirmDelete = window.confirm("Möchten Sie dieses Event wirklich löschen?");
        if (!confirmDelete) return;

        try {
            await apiClient.delete(`http://localhost:3001/events/deleteEvent`, {data: {id}});
            navigate('/'); // Redirect to home after deletion
        } catch {
            setActionError("Fehler beim Löschen des Events");
        }
    };

    const handleSelectChange = (type, selectedOption) => {
        if (!selectedOption) {
            if (type === 'map') setSelectedMap(null);
            else setSelectedList(null);
            return;
        }
        const selected = type === 'map' ? maps.find(map => map.idlivemap === selectedOption.value) : lists.find(list => list.listname === selectedOption.value);
        if (type === 'map') setSelectedMap(selected);
        else setSelectedList(selected);
    };

    const truncateText = (text, maxLength = 30) => text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

    if (loading) return <div>Laden...</div>;
    if (loadError) return <div>{loadError}</div>;

    return (
        <div className="wrapper theme-admin">
            <Header links={[
                {name: "Home", path: `/event/${id}/adminHome`},
                {name: "Live-Karte", path: `/event/${id}/adminLiveMap`},
                {name: "API-Link", path: `/event/${id}/adminResults`},
                {name: "Sponsoren", path: `/event/${id}/adminSponsors`},
                {name: "Event bearbeiten", path: `/event/${id}/adminEdit`},
            ]}/>
            <main className="main">
                <div className="page-narrow">
                    <h1 className="page-title">Event bearbeiten</h1>
                    <section className="card">
                        <h2 className="section-title">Event-Informationen</h2>
                        <ul className="entry-list">
                            {Object.keys(fieldLabels).slice(0, 4).map(key => (
                                <li key={key} className="entry-list-item">
                                    {event[key] ? (
                                        isEditWindowOpen && currentField === key ? (
                                                <div className="edit-window">
                                                    <input type="text" value={currentValue} className="input-field" aria-label={fieldLabels[key]}
                                                           onChange={e => setCurrentValue(e.target.value)}/>
                                                    <div className="edit-window-actions">
                                                        <button className="btn btn-primary" onClick={handleSave}>Speichern
                                                        </button>
                                                        <button className="btn btn-secondary"
                                                                onClick={() => setIsEditWindowOpen(false)}>Abbrechen
                                                        </button>
                                                    </div>
                                                    {actionError && <p className="error-message">{actionError}</p>}
                                                </div>
                                        ) : (
                                                <>
                                                    <div className="edit-row-text">
                                                        <span className="edit-row-label">{fieldLabels[key]}</span>
                                                        <span className="edit-row-value">{truncateText(key === 'eventdate' ? new Date(event[key]).toISOString().split('T')[0] : event[key])}</span>
                                                    </div>
                                                    <button className="btn btn-secondary"
                                                            onClick={() => handleUpdateClick(key, event[key])}>Aktualisieren
                                                    </button>
                                                </>
                                        )
                                    ) : (
                                        <span className="edit-row-missing">{fieldLabels[key].toLowerCase()} nicht verfügbar</span>)}
                                </li>
                            ))}
                        </ul>
                    </section>
                    <section className="card">
                        <h2 className="section-title">Sponsor-Informationen</h2>
                        <ul className="entry-list">
                            {sponsors.length > 0 ? (
                                sponsors.map(sponsor => (
                                    <li key={sponsor.idSponsors} className="entry-list-item">
                                        <div className="edit-row-text">
                                            <span className="edit-row-label">{fieldLabels.sponsorname}</span>
                                            <span className="edit-row-value">{sponsor.sponsorname}</span>
                                        </div>
                                        <button className="btn btn-danger"
                                                onClick={() => handleDelete('Sponsor', sponsor.idSponsors)}>Löschen
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="entry-list-item edit-row-missing">Sponsoren nicht verfügbar</li>
                            )}
                        </ul>
                    </section>
                    <section className="card">
                        <h2 className="section-title">Karten Informationen</h2>
                        <SearchableSelect
                            options={maps.map(map => ({value: map.idlivemap, label: map.mapname}))}
                            onChange={option => handleSelectChange('map', option)}
                            placeholder="Karte auswählen"
                            width="100%"
                            menuWidth="100%"
                        />
                        {selectedMap && (
                            <ul className="entry-list">
                                {['mapname', 'maptime'].map(key => (
                                    <li key={key} className="entry-list-item">
                                        {isEditWindowOpen && currentField === key ? (
                                            <div className="edit-window">
                                                <input type="text" value={currentValue} className="input-field" aria-label={key === 'mapname' ? 'Kartenname' : 'Kartenzeit'}
                                                       onChange={e => setCurrentValue(e.target.value)}/>
                                                <div className="edit-window-actions">
                                                    <button className="btn btn-primary" onClick={handleSave}>Speichern
                                                    </button>
                                                    <button className="btn btn-secondary"
                                                            onClick={() => setIsEditWindowOpen(false)}>Abbrechen
                                                    </button>
                                                </div>
                                                {actionError && <p className="error-message">{actionError}</p>}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="edit-row-text">
                                                    <span className="edit-row-label">{key === 'mapname' ? 'Kartenname' : 'Kartenzeit'}</span>
                                                    <span className="edit-row-value">{truncateText(selectedMap[key])}</span>
                                                </div>
                                                <button className="btn btn-secondary"
                                                        onClick={() => handleUpdateClick(key, selectedMap[key])}>Aktualisieren
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                                <li className="entry-list-item entry-list-actions">
                                    <button className="btn btn-danger"
                                            onClick={() => handleDelete('Map', selectedMap.idlivemap)}>Karte löschen
                                    </button>
                                </li>
                            </ul>
                        )}
                    </section>
                    <section className="card">
                        <h2 className="section-title">Listen Informationen</h2>
                        <SearchableSelect
                            options={lists.map(list => ({value: list.listname, label: list.listname}))}
                            onChange={option => handleSelectChange('list', option)}
                            placeholder="Liste auswählen"
                            width="100%"
                            menuWidth="100%"
                        />
                        {selectedList && (
                            <ul className="entry-list">
                                {['listname', 'listlink'].map(key => (
                                    <li key={key} className="entry-list-item">
                                        {isEditWindowOpen && currentField === key ? (
                                            <div className="edit-window">
                                                <input type="text" value={currentValue} className="input-field" aria-label={key === 'listname' ? 'Listenname' : 'Listenlink'}
                                                       onChange={e => setCurrentValue(e.target.value)}/>
                                                <div className="edit-window-actions">
                                                    <button className="btn btn-primary" onClick={handleSave}>Speichern
                                                    </button>
                                                    <button className="btn btn-secondary"
                                                            onClick={() => setIsEditWindowOpen(false)}>Abbrechen
                                                    </button>
                                                </div>
                                                {actionError && <p className="error-message">{actionError}</p>}
                                            </div>
                                        ) : (
                                            <>
                                                <div className="edit-row-text">
                                                    <span className="edit-row-label">{key === 'listname' ? 'Listenname' : 'Listenlink'}</span>
                                                    <span className="edit-row-value">{truncateText(selectedList[key])}</span>
                                                </div>
                                                <button className="btn btn-secondary"
                                                        onClick={() => handleUpdateClick(key, selectedList[key])}>Aktualisieren
                                                </button>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                    <section className="card card-danger">
                        <h2 className="section-title">Event löschen</h2>
                        <p className="card-danger-text">Das Event wird dauerhaft gelöscht. Das lässt sich nicht rückgängig machen.</p>
                        <button className="btn btn-danger"
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