import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import ResultTable from "../../components/ResultTable";
import useApiData from "../../components/useApiData";
import Footer from "../../components/Footer";
import SearchableSelect from "../../components/SearchableSelect";

const UserResults = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchParams, setSearchParams] = useSearchParams();

    const links = [
        { name: "Home", path: `/event/${id}` },
        { name: "Live-Map", path: `/event/${id}/userLiveMap` },
        { name: "Results", path: `/event/${id}/userResults` },
    ];

    const initialAPILink = searchParams.get('list') || '';
    const initialSearch = searchParams.get('search') || '';

    const [apiOptions, setApiOptions] = useState([]);
    const [APILink, setAPILink] = useState(initialAPILink);
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [showResults, setShowResults] = useState(initialAPILink !== '');
    const data = useApiData(APILink);

    useEffect(() => {
        const savedList = localStorage.getItem("selectedList");
        if (!initialAPILink && savedList) {
            setAPILink(savedList);
            setShowResults(true);
        } else if (initialAPILink) {
            setShowResults(true);
        }
    }, [initialAPILink]);

    useEffect(() => {
        const previousId = localStorage.getItem("previousEventId");
        if (previousId !== id) {
            localStorage.removeItem("selectedList");
            setAPILink(''); // Reset the APILink state
            setShowResults(false); // Hide results until a new list is selected
        }
        localStorage.setItem("previousEventId", id);
    }, [id]);

    useEffect(() => {
        if (APILink) {
            const params = new URLSearchParams();
            params.set('list', APILink);
            localStorage.setItem("selectedList", APILink);
            if (searchTerm) params.set('search', searchTerm);
            setSearchParams(params);
        }
    }, [APILink, searchTerm, setSearchParams]);

    useEffect(() => {
        const fetchEventAndResults = async () => {
            try {
                const resultResponse = await axios.get(`http://localhost:3001/files/results/fetch?eventid=${id}`);
                const options = resultResponse.data.map((result) => ({
                    value: result.listlink,
                    label: result.listname,
                }));
                setApiOptions(options);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to fetch data.");
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndResults();
        const intervalId = setInterval(fetchEventAndResults, 5000);
        return () => clearInterval(intervalId);
    }, [id]);

    const handleSelectChange = (selectedOption) => {
        const newValue = selectedOption?.value || '';
        setAPILink(newValue);
        setShowResults(true);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="wrapper theme-user">
            <Header links={links} />
            <main className="main">
                <div className="page">
                    <h1 className="page-title">Ergebnisse</h1>
                    <div className="results-select">
                        <SearchableSelect
                            options={apiOptions}
                            onChange={handleSelectChange}
                            placeholder="Liste auswählen..."
                            value={apiOptions.find(option => option.value === APILink)}
                            width="100%"
                            menuWidth="100%"
                        />
                    </div>
                    {showResults && data.length > 0 && (
                        <ResultTable
                            data={data}
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                        />
                    )}
                    {showResults && data.length === 0 && <p className="results-empty">No results available for the selected list.</p>}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default UserResults;