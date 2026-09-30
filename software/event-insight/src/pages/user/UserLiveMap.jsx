import React, {useState, useEffect, useCallback, useMemo} from "react";
import {useParams} from "react-router-dom";
import apiClient from "../../utils/apiClient";
import { fetchGPXFile } from "../../utils/fetchGPXFile";
import { parseGPXToFullProfile } from "../../utils/gpxParser";
import {calculateSpeedAndProgress, timeStringToSeconds} from "../../utils/participantUtils";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import GPXMap from "../../components/GPXMap";
import useApiData from "../../components/useApiData";
import ParticipantCheckboxes from "../../components/ParticipantCheckboxes";
import SearchableSelect from "../../components/SearchableSelect";
import ElevationChart from "../../components/ElevationChart";

const UserLiveMap = () => {
    const {id} = useParams();
    const [gpxData, setGpxData] = useState([]);
    const [selectedGpx, setSelectedGpx] = useState(null);
    const [selectedApi, setSelectedApi] = useState(null);
    const [intermediateMarkers, setIntermediateMarkers] = useState([]);
    const [error, setError] = useState(null);
    const [totalDistance, setTotalDistance] = useState(0);
    const [gpxTrackPoints, setGpxTrackPoints] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [filteredParticipants, setFilteredParticipants] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState(() => {
        const saved = localStorage.getItem('selectedParticipants');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });
    const [searchTerm, setSearchTerm] = useState("");
    const participantsData = useApiData(selectedApi?.value || "", 5000);
    const [hoverProgress, setHoverProgress] = useState(null);
    const handleHoverProgress = (progress) => {
        if (progress !== hoverProgress) {
            setHoverProgress(progress);
        }
    };


    useEffect(() => {
        if (participantsData?.length > 0) {
            const savedParticipants = localStorage.getItem('selectedParticipants');
            if (savedParticipants) {
                try {
                    const parsed = JSON.parse(savedParticipants);
                    const validParticipants = parsed.filter(startnr =>
                        participantsData.some(p => p.startnr == startnr)
                    );
                    setSelectedParticipants(new Set(validParticipants));
                } catch (err) {
                    console.error("Error loading participants:", err);
                }
            }
        }
    }, [participantsData]);

    useEffect(() => {
        try {
            localStorage.setItem('selectedParticipants',
                JSON.stringify(Array.from(selectedParticipants))
            );
        } catch (err) {
            console.error("Failed to save:", err);
        }
    }, [selectedParticipants]);

    useEffect(() => {
        const loadSavedState = () => {
            const savedMap = localStorage.getItem('selectedGpx');

            if (savedMap && gpxData.length > 0) {
                try {
                    const parsedMap = JSON.parse(savedMap);
                    const validMap = gpxData.find(map =>
                        map.idlivemap === parsedMap.idlivemap &&
                        map.value === parsedMap.value
                    );
                    if (validMap) {
                        setSelectedGpx(validMap);
                        setStartTime(validMap.maptime);
                        console.log('Saved map loaded:', validMap);
                    } else {
                        console.warn('Saved map not found in available data');
                        localStorage.removeItem('selectedGpx');
                    }
                } catch (err) {
                    console.error("Error parsing saved map:", err);
                }
            }
        };

        loadSavedState();
    }, [gpxData]);

    const calculateProgressFromMarker = (marker) => {
        if (!gpxTrackPoints.length || !totalDistance) return 0;
        const markerLat = parseFloat(marker.latitude);
        const markerLon = parseFloat(marker.longitude);
        let minDist = Infinity;
        let closestPoint = null;
        gpxTrackPoints.forEach((point) => {
            const dLat = markerLat - point.lat;
            const dLon = markerLon - point.lon;
            const distance = Math.sqrt(dLat * dLat + dLon * dLon);
            if (distance < minDist) {
                minDist = distance;
                closestPoint = point;
            }
        });
        return closestPoint ? (closestPoint.cumDistance / totalDistance) * 100 : 0;
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await apiClient.get('/files/livemap', { params: { eventid: id } });
                setGpxData(
                    data.map((item) => ({
                        value: item.listlink || `http://localhost:3001/${item.mappath.replace(/\\/g, "/")}`,
                        label: item.listname || item.mapname,
                        apiLink: item.listlink,
                        intermediateTimes: [],
                        idlivemap: item.idlivemap,
                        maptime: item.maptime
                    }))
                );
            } catch (err) {
                console.error("Error fetching database files:", err);
                setError("Error fetching database files.");
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        if (selectedGpx?.idlivemap) {
            apiClient
                .get('/files/results/fetchFromMap', { params: { mapId: selectedGpx.idlivemap } })
                .then(({data}) => setSelectedApi({value: data.listlink, label: selectedGpx.label}))
                .catch((err) => {
                    console.error("Error fetching API link:", err);
                    setError("Error loading API link.");
                });

            apiClient
                .get('/files/intermediateTimes/getByMap', { params: { idlivemap: selectedGpx.idlivemap } })
                .then(({data}) => {
                    const markers = data.map((marker) => ({
                        progress: calculateProgressFromMarker(marker),
                    }));
                    setIntermediateMarkers(markers);
                })
                .catch((err) => {
                    console.error("Error fetching intermediate markers:", err);
                });
        }
    }, [selectedGpx, gpxTrackPoints, totalDistance]);

    const handleSelectionChange = (selectedOption) => {
        const newGpx = gpxData.find((data) => data.value === selectedOption?.value);
        if (newGpx) {
            const mapToSave = {
                idlivemap: newGpx.idlivemap,
                value: newGpx.value,
                label: newGpx.label,
                apiLink: newGpx.apiLink,
                maptime: newGpx.maptime
            };
            setSelectedGpx(mapToSave);
            setStartTime(newGpx.maptime);
            localStorage.setItem('selectedGpx', JSON.stringify(mapToSave));
        } else {
            setSelectedGpx(null);
            setStartTime("00:00:00");
            localStorage.removeItem('selectedGpx');
        }
    };

    const handleParticipantToggle = (startnr) => {
        const numericId = Number(startnr);
        setSelectedParticipants(prev => {
            const newSet = new Set(prev);
            newSet.has(numericId) ? newSet.delete(numericId) : newSet.add(numericId);
            return newSet;
        });
    };

    useEffect(() => {
        const fetchGPXData = async () => {
            try {
                const gpxText = await fetchGPXFile(selectedGpx.value);
                const fullProfile = parseGPXToFullProfile(gpxText, { include3D: true });

                // Convert to track points format expected by the rest of the component
                const gpxTrackPoints = fullProfile.map(point => ({
                    lat: point.lat,
                    lon: point.lon,
                    cumDistance: point.distance,
                    ele: point.elevation,
                }));

                const totalDist = fullProfile.length > 0 ? fullProfile[fullProfile.length - 1].distance : 0;
                setTotalDistance(totalDist);
                setGpxTrackPoints(gpxTrackPoints);
            } catch (err) {
                console.error("Error loading GPX data:", err);
                setError("Error calculating route length.");
            }
        };

        if (selectedGpx?.value) fetchGPXData();
    }, [selectedGpx]);

    const updateFilteredParticipants = useCallback(() => {
        const now = new Date();
        const elapsedTime =
            timeStringToSeconds(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`) -
            timeStringToSeconds(startTime);

        const enrichedData = participantsData
            .filter((participant) => {
                if (!searchTerm) return true;
                const displayName = participant.Vorname
                    ? `${participant.Vorname} ${participant.Name}`
                    : participant.Name;
                return displayName.toLowerCase().includes(searchTerm.toLowerCase());
            })
            .map((participant) => {
                const {progress, finished, speed} = calculateSpeedAndProgress(
                    participant,
                    totalDistance,
                    elapsedTime,
                    intermediateMarkers
                );
                const expectedGoalTimeInSeconds = totalDistance / speed + timeStringToSeconds(startTime);
                const hours = Math.floor(expectedGoalTimeInSeconds / 3600);
                const minutes = Math.floor((expectedGoalTimeInSeconds % 3600) / 60);
                const seconds = Math.floor(expectedGoalTimeInSeconds % 60);
                const expectedGoalTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
                    2,
                    "0"
                )}:${String(seconds).padStart(2, "0")}`;
                return {
                    ...participant,
                    progress,
                    finished,
                    expectedGoalTime,
                    speed,
                    startnr: participant.STN || participant["Startnr."],
                    listlink: selectedApi?.value,
                };
            });
        setFilteredParticipants(enrichedData);
    }, [participantsData, totalDistance, startTime, searchTerm, intermediateMarkers, selectedGpx, selectedApi]);

    useEffect(() => {
        const interval = setInterval(updateFilteredParticipants, 1000);
        return () => clearInterval(interval);
    }, [updateFilteredParticipants]);

    const visibleParticipants = useMemo(() => {
        return filteredParticipants.filter((p) => selectedParticipants.has(p.startnr));
    }, [filteredParticipants, selectedParticipants]);

    return (
        <div className="wrapper">
            <Header
                links={[
                    {name: "Home", path: `/event/${id}`},
                    {name: "Live-Map", path: `/event/${id}/userLiveMap`},
                    {name: "Results", path: `/event/${id}/userResults`},
                ]}
            />
            <main className="main">
                {error && <p className="error-message">{error}</p>}

                <SearchableSelect
                    value={selectedGpx ? {value: selectedGpx.value, label: selectedGpx.label} : null}
                    options={gpxData.map(({value, label}) => ({value, label}))}
                    onChange={handleSelectionChange}
                    placeholder="Select Live-Map..."
                    minInputLength={2}
                />

                <br/>
                <br/>

                <div className="map-grid-container">
                    <div className="map-grid-map">
                        {selectedGpx && selectedApi && (
                            <GPXMap
                                gpxPath={selectedGpx.value}
                                intermediateTimes={intermediateMarkers}
                                participantsData={visibleParticipants}
                            />
                        )}
                    </div>

                    <div className="map-grid-participants">
                        <input
                            type="text"
                            placeholder="Search participants..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-field"
                        />
                        {selectedGpx && selectedApi && (
                            <ParticipantCheckboxes
                                participantsData={filteredParticipants}
                                selectedParticipants={selectedParticipants}
                                onParticipantToggle={handleParticipantToggle}
                            />
                        )}
                    </div>
                    {selectedGpx && (
                        <ElevationChart
                            gpxPath={selectedGpx.value}
                            participants={visibleParticipants}
                            onHover={handleHoverProgress}
                        />
                    )}
                </div>
            </main>
            <Footer/>
        </div>
    );
};

export default UserLiveMap;