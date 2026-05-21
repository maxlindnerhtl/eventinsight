import { useEffect, useState } from "react";
import axios from "axios";  // Ändere fetch zu axios für Konsistenz

const useAPIData = (url, interval = 5000) => {  // Füge Intervall-Parameter hinzu
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!url) return;

        const fetchData = async () => {
            try {
                const response = await axios.get(url);
                setData(response.data);
            } catch (error) {
                console.error("Fehler beim Abrufen der Daten:", error);
            }
        };

        // Sofortigen Abruf durchführen
        fetchData();

        // Automatische Updates einrichten
        const intervalId = setInterval(fetchData, interval);

        // Cleanup
        return () => clearInterval(intervalId);
    }, [url, interval]);  // Füge interval zu den Abhängigkeiten hinzu

    return data;
};

export default useAPIData;