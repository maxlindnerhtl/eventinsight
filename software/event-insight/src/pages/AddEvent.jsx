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
        <div className="wrapper">
            <Header links={[]}/>
            <main className="main">
                <div className="form-container">
                    <h2 className="admin-title">Neues Event hinzufügen</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Eventname eingeben..."
                                className="input-field"
                                value={eventname}
                                onChange={(e) => setEventname(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="date"
                                className="input-field"
                                value={eventdate}
                                onChange={(e) => setEventdate(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Ort eingeben..."
                                className="input-field"
                                value={eventlocation}
                                onChange={(e) => setEventlocation(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Adresse eingeben..."
                                className="input-field"
                                value={eventaddress}
                                onChange={(e) => setEventaddress(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="submit-button">Event hinzufügen</button>
                    </form>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default AddEvent;