import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";
import apiClient from "../../utils/apiClient";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {sanitizeHtml} from "../../utils/sanitizeHtml";

const EditText = () => {
    const {id} = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventText, setEventText] = useState("");

    useEffect(() => {
        axios.get(`http://localhost:3001/events/${id}`)
            .then(() => {
                setLoading(false);
            })
            .catch(() => {
                setError("Event konnte nicht geladen werden.");
                setLoading(false);
            });

        axios.get(`http://localhost:3001/files/text/fetch?idtext=${id}`)
            .then((res) => {
                setEventText(sanitizeHtml(res.data.text || ""));
            })
            .catch(() => {
                setError("Event-Text konnte nicht geladen werden.");
            });
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const strippedText = eventText.replace(/<\/?[^>]+(>|$)/g, "").trim();
        if (!strippedText) {
            alert("Text darf nicht nur aus Leerzeichen oder leeren Inhalten bestehen!");
            return;
        }

        try {
            const response = await apiClient.post("/files/text/upload", {
                idtext: id,
                text: eventText,
                eventid: id
            });
            alert(response.data);
        } catch (error) {
            console.error("Error uploading text:", error);
            const errorData = error.response?.data;
            const backendMessage =
                errorData?.message ||
                (typeof errorData?.error === 'string'
                    ? errorData.error
                    : errorData?.error?.message);

            alert(backendMessage || "Text konnte nicht gespeichert werden.");
        }
    };

    if (loading) return <div>Wird geladen…</div>;
    if (error) return <div>{error}</div>;

    const modules = {
        toolbar: [
            [{'header': '1'}, {'header': '2'}, {'font': []}],
            [{size: []}],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
            ['link'],
            ['clean']
        ],
    };

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
                <div className="page">
                    <section className="card">
                        <h1 className="page-title">Event-Text bearbeiten</h1>
                        <form onSubmit={handleSubmit} className="edit-text-container">
                            <ReactQuill
                                value={eventText}
                                onChange={setEventText}
                                placeholder="Event-Text bearbeiten..."
                                className="textarea"
                                modules={modules}
                                required
                            />
                        </form>
                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" onClick={handleSubmit}>Speichern</button>
                        </div>
                    </section>
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default EditText;