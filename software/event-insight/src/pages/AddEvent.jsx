import React, {useState} from 'react';
import apiClient from "../utils/apiClient";
import Footer from "../components/Footer";
import Header from "../components/Header";

const AddEvent = () => {
    const [eventname, setEventname] = useState('');
    const [eventdate, setEventdate] = useState('');
    const [eventlocation, setEventlocation] = useState('');
    const [eventaddress, setEventaddress] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await apiClient.post('/events/add', {
                eventname,
                eventdate,
                eventlocation,
                eventaddress,
                adminid: localStorage.getItem('adminid')
            });

            alert('Event erfolgreich hinzugefügt!');
            window.location.href = '/';
        } catch (err) {
            const errorData = err.response?.data;
            const backendMessage =
                errorData?.message ||
                (typeof errorData?.error === 'string'
                    ? errorData.error
                    : errorData?.error?.message);

            alert(
                backendMessage
                    ? `Fehler beim Hinzufügen des Events: ${backendMessage}`
                    : 'Fehler beim Hinzufügen des Events'
            );
        }
    };

    return (
        <div className="wrapper theme-admin">
            <Header links={[]}/>
            <main className="main">
                <div className="page-narrow">
                    <div className="card">
                        <h1 className="page-title">Neues Event hinzufügen</h1>
                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="field">
                                <label htmlFor="event-name" className="field-label">Eventname</label>
                                <input
                                    id="event-name"
                                    type="text"
                                    placeholder="Eventname eingeben..."
                                    className="input-field"
                                    value={eventname}
                                    onChange={(e) => setEventname(e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="event-date" className="field-label">Datum</label>
                                <input
                                    id="event-date"
                                    type="date"
                                    className="input-field"
                                    value={eventdate}
                                    onChange={(e) => setEventdate(e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="event-location" className="field-label">Ort</label>
                                <input
                                    id="event-location"
                                    type="text"
                                    placeholder="Ort eingeben..."
                                    className="input-field"
                                    value={eventlocation}
                                    onChange={(e) => setEventlocation(e.target.value)}
                                />
                            </div>
                            <div className="field">
                                <label htmlFor="event-address" className="field-label">Adresse</label>
                                <input
                                    id="event-address"
                                    type="text"
                                    placeholder="Adresse eingeben..."
                                    className="input-field"
                                    value={eventaddress}
                                    onChange={(e) => setEventaddress(e.target.value)}
                                />
                            </div>
                            <div className="form-actions">
                                <button type="submit" className="btn btn-primary">Event hinzufügen</button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AddEvent;