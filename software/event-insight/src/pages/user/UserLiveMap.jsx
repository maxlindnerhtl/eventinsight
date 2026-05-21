import React, {useState, useEffect, useCallback, useMemo} from "react";
import {useParams} from "react-router-dom";
import axios from "axios";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import GPXMap from "../../components/GPXMap";
import useAPIData from "../../components/useAPIData";
import ParticipantCheckboxes from "../../components/ParticipantCheckboxes";
import SearchableSelect from "../../components/SearchableSelect";
import ElevationChart from "../../components/ElevationChart";

const timeStringToSeconds = (timeString) => {
    const parts = timeString.split(":").map((part) => parseFloat(part.replace(",", ".")));
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
};

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
    const participantsData = useAPIData(selectedApi?.value || "", 5000);
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
            const savedParticipants = localStorage.getItem('selectedParticipants');

            if (savedMap && gpxData.length > 0) {
                try {
                    const parsedMap = JSON.parse(savedMap);
                    const validMap = gpxData.find(map =>
                        map.idlivemap === parsedMap.idlivemap &&
                        map.value === parsedMap.value
                    );
                    if (validMap) {
                        setSelectedGpx(validMap);
                        setStartTime(validMap.maptime); // Set the start time from the saved map
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

    useEffect(() => {
        if (participantsData && participantsData.length > 0) {
            const savedParticipants = localStorage.getItem('selectedParticipants');
            if (savedParticipants) {
                setSelectedParticipants(new Set(JSON.parse(savedParticipants)));
            }
        }
    }, [participantsData]);

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

    const calculateSpeedAndProgress = (participant, totalDistance, elapsedTime) => {
        if (!totalDistance) return {progress: 0, finished: false, speed: 0};
        let usedTimeSeconds;
        let baseProgress;
        if (participant.Zeit) {
            usedTimeSeconds = timeStringToSeconds(participant.Zeit);
            baseProgress = 100;
        } else if (intermediateMarkers.length > 0) {
            let checkpointIndex = -1;
            for (let i = intermediateMarkers.length; i >= 1; i--) {
                if (participant[i]) {
                    checkpointIndex = i - 1;
                    usedTimeSeconds = timeStringToSeconds(participant[i]);
                    baseProgress = intermediateMarkers[checkpointIndex].progress;
                    break;
                }
            }
            if (checkpointIndex === -1) {
                return {progress: 0, finished: false, speed: 0};
            }
        } else {
            return {progress: 0, finished: false, speed: 0};
        }
        const baseDistance = (baseProgress / 100) * totalDistance;
        const speed = usedTimeSeconds > 0 ? baseDistance / usedTimeSeconds : 0;

        const extraTime = Math.max(0, elapsedTime - usedTimeSeconds);
        const currentDistance = baseDistance + speed * (extraTime);
        const progress = Math.min(100, (currentDistance / totalDistance) * 100);
        return {progress, finished: progress >= 100, speed: speed};
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const {data} = await axios.get(`http://localhost:3001/files/livemap?eventid=${id}`);
                setGpxData(
                    data.map((item) => ({
                        value: item.listlink || `http://localhost:3001/${item.mappath.replace(/\\/g, "/")}`,
                        label: item.listname || item.mapname,
                        apiLink: item.listlink,
                        intermediateTimes: [],
                        idlivemap: item.idlivemap,
                        maptime: item.maptime // Add maptime to the data
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
            axios
                .get(`http://localhost:3001/files/results/fetchFromMap?mapId=${selectedGpx.idlivemap}`)
                .then(({data}) => setSelectedApi({value: data.listlink, label: selectedGpx.label}))
                .catch((err) => {
                    console.error("Error fetching API link:", err);
                    setError("Error loading API link.");
                });

            axios
                .get(`http://localhost:3001/files/intermediateTimes/getByMap?idlivemap=${selectedGpx.idlivemap}`)
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
                maptime: newGpx.maptime // Save maptime
            };
            setSelectedGpx(mapToSave);
            setStartTime(newGpx.maptime); // Set the start time
            localStorage.setItem('selectedGpx', JSON.stringify(mapToSave));
        } else {
            setSelectedGpx(null);
            setStartTime("00:00:00"); // Reset to default start time
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

    const handleSearch = setSearchTerm;

    useEffect(() => {
        const fetchGPXData = async () => {
            try {
                const response = await fetch(selectedGpx.value);
                const gpxText = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(gpxText, "text/xml");
                const trackPoints = xmlDoc.getElementsByTagName("trkpt");

                let cumulativeDistance = 0;
                const R = 6371000;
                const toRad = (deg) => (deg * Math.PI) / 180;
                const points = [];

                for (let i = 0; i < trackPoints.length; i++) {
                    const lat = parseFloat(trackPoints[i].getAttribute("lat"));
                    const lon = parseFloat(trackPoints[i].getAttribute("lon"));
                    if (i > 0) {
                        const prevLat = parseFloat(trackPoints[i - 1].getAttribute("lat"));
                        const prevLon = parseFloat(trackPoints[i - 1].getAttribute("lon"));
                        const dLat = toRad(lat - prevLat);
                        const dLon = toRad(lon - prevLon);
                        const a =
                            Math.sin(dLat / 2) ** 2 +
                            Math.cos(toRad(prevLat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                        let dHoriz = R * c;

                        const eleTagCurrent = trackPoints[i].getElementsByTagName("ele");
                        const eleTagPrev = trackPoints[i - 1].getElementsByTagName("ele");
                        if (eleTagCurrent.length > 0 && eleTagPrev.length > 0) {
                            const eleCurrent = parseFloat(eleTagCurrent[0].textContent);
                            const elePrev = parseFloat(eleTagPrev[0].textContent);
                            const deltaEle = eleCurrent - elePrev;
                            dHoriz = Math.sqrt(dHoriz * dHoriz + deltaEle * deltaEle);
                        }
                        cumulativeDistance += dHoriz;
                    }
                    const eleTag = trackPoints[i].getElementsByTagName("ele");
                    const ele = eleTag.length > 0 ? parseFloat(eleTag[0].textContent) : 0;
                    points.push({
                        lat,
                        lon,
                        cumDistance: cumulativeDistance,
                        ele // Höhe mit dazu
                    });                }
                setTotalDistance(cumulativeDistance);
                setGpxTrackPoints(points);
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
                    elapsedTime
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