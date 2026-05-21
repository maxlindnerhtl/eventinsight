import React, {useState} from 'react';
import Footer from "../components/Footer";
import Header from "../components/Header";

const AddEvent = () => {
    const [eventname, setEventname] = useState('');
    const [eventdate, setEventdate] = useState('');
    const [eventlocation, setEventlocation] = useState('');
    const [eventaddress, setEventaddress] = useState('');
    const adminId = localStorage.getItem('adminid');

    const handleSubmit = async (e) => {
        e.preventDefault();

            const response = await fetch('http://localhost:3001/events/add', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({eventname, eventdate, eventlocation, eventaddress, adminid: adminId}),
            });

            if (response.ok) {
                alert('Event erfolgreich hinzugefügt!');
                window.location.href = '/';
            } else {
                const errorData = await response.json();
                alert(`Fehler beim Hinzufügen des Events`);
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