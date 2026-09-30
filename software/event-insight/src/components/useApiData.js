import { useEffect, useState } from "react";
import axios from "axios";  // Intentionally NOT using apiClient here (see comment below)

// useApiData is intentionally NOT using apiClient:
// This hook polls PUBLIC/EXTERNAL endpoints selected by end-users on non-authenticated pages
// (UserLiveMap, UserResults — both are accessible without login).
// When an external API returns 401, it doesn't mean the user's session is invalid;
// it means that particular data feed is unavailable or expired.
// If we used apiClient, a single 401 from any polled feed would trigger apiClient's
// 401 interceptor, dispatch auth:logout, and hard-redirect an anonymous end-user
// to /adminLogin — confusing UX and incorrect behavior.
// Raw axios allows graceful error handling: log the error and let the component
// handle it (usually just display no data for that feed).
const useApiData = (url, interval = 5000) => {  // Füge Intervall-Parameter hinzu
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

export default useApiData;