import React, {useState, useEffect} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const EditText = () => {
    const {id} = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventText, setEventText] = useState("");

    useEffect(() => {
        axios.get(`http://localhost:3001/events/${id}`)
            .then((res) => {
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch event data");
                setLoading(false);
            });

        axios.get(`http://localhost:3001/files/text/fetch?idtext=${id}`)
            .then((res) => {
                setEventText(res.data.text || "");
            })
            .catch(() => {
                setError("Failed to fetch text data");
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
            const response = await axios.post("http://localhost:3001/files/text/upload", {
                idtext: id,
                text: eventText,
                eventid: id
            });
            alert(response.data);
        } catch (error) {
            console.error("Error uploading text:", error);
            alert("Error uploading text");
        }
    };

    if (loading) return <div>Loading...</div>;
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
        <div className="wrapper">
            <Header links={[
                {name: "Home", path: `/event/${id}/adminHome`},
                {name: "Live-Map", path: `/event/${id}/adminLiveMap`},
                {name: "API-Link", path: `/event/${id}/adminResults`},
                {name: "Sponsors", path: `/event/${id}/adminSponsors`},
                {name: "Edit Event", path: `/event/${id}/adminEdit`},

            ]}/>
            <main className="main">
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
                <button type="submit" className="submit-button" onClick={handleSubmit}>Speichern</button>
            </main>
            <Footer/>
        </div>
    );
};

export default EditText;