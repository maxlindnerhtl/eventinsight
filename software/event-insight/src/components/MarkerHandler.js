import React, {useEffect, useState} from "react";
import {MapContainer, TileLayer, Polyline, Marker, Popup} from "react-leaflet";
import StartGoalMarkers from "./StartGoalMarkers";
import ParticipantMarker from "./ParticipantMarker";
import axios from "axios";
import L from "leaflet";
import {fetchGPXFile} from "../utils/fetchGPXFile";
import {parseGPXToTrackCoordinates} from "../utils/gpxParser";

const MarkerHandler = ({gpxPath, selectedGpxId, participantsData, isAdmin, setIntermediateMarkers}) => {
    const [route, setRoute] = useState([]);
    const [center, setCenter] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [intermediateMarkers, setMarkers] = useState([]);
    const [isPlacingMarker, setIsPlacingMarker] = useState(false);

    useEffect(() => {
        const loadAndParseGPXDataMarkerHandler = async () => {
            setIsLoading(true);
            try {
                const gpxText = await fetchGPXFile(gpxPath);
                const trackData = parseGPXToTrackCoordinates(gpxText);
                if (trackData.length > 0) {
                    setRoute(trackData);
                    setCenter(trackData[0]);
                }
            } catch (error) {
                console.error("Error loading or parsing GPX file:", error);
            }
            setIsLoading(false);
        };
        loadAndParseGPXDataMarkerHandler();
    }, [gpxPath]);

    useEffect(() => {
        const fetchMarkersMarkerHandler = async () => {
            if (!selectedGpxId) return;
            try {
                const response = await axios.get(`http://localhost:3001/files/intermediateTimes/getByMap?idlivemap=${selectedGpxId}`);
                const markers = response.data.map((marker, index) => ({
                    id: marker.idintermediatetimes,
                    latitude: parseFloat(marker.latitude),
                    longitude: parseFloat(marker.longitude),
                    position: [parseFloat(marker.latitude), parseFloat(marker.longitude)],
                    name: `${index + 1}. Zwischenzeit`
                }));

                setMarkers(markers);
                setIntermediateMarkers(markers);
            } catch (error) {
                console.error("Error fetching intermediate markers:", error);
            }
        };
        fetchMarkersMarkerHandler();
    }, [selectedGpxId, setIntermediateMarkers]);

    const getPositionFromProgressMarkerHandler = (progress) => {
        if (!route.length) return null;
        if (route.length === 1) return route[0];
        const indexFloat = (progress / 100) * (route.length - 1);
        const lowerIndex = Math.floor(indexFloat);
        const fraction = indexFloat - lowerIndex;
        const start = route[lowerIndex];
        const end = route[lowerIndex + 1] || start;
        return [
            start[0] + (end[0] - start[0]) * fraction,
            start[1] + (end[1] - start[1]) * fraction,
        ];
    };

    const handleMapClickMarkerHandler = (e) => {
        if (!isAdmin || isPlacingMarker) return;
        setIsPlacingMarker(true);
        const {lat, lng} = e.latlng;
        const newMarker = {
            latitude: lat,
            longitude: lng,
            position: [lat, lng],
            name: `${intermediateMarkers.length + 1}. Zwischenzeit`
        };
        const updatedMarkers = [...intermediateMarkers, newMarker];
        setMarkers(updatedMarkers);
        setIntermediateMarkers(updatedMarkers);
        setTimeout(() => setIsPlacingMarker(false), 1000);
    };

    const handleDeleteMarkerMarkerHandler = async (markerId, index) => {
        if (!isAdmin) return;

        if (markerId) {
            try {
                await axios.delete(`http://localhost:3001/files/intermediateTimes/delete?id=${markerId}`);
            } catch (error) {
                console.error("Error deleting marker from database:", error);
            }
        }

        const updatedMarkers = [...intermediateMarkers];
        updatedMarkers.splice(index, 1);
        setMarkers(updatedMarkers);
        setIntermediateMarkers(updatedMarkers);
    };

    if (isLoading || !center) return <div>Loading data...</div>;

    return (
        <div className="map-wrapper">
            <MapContainer
                center={center}
                zoom={14}
                style={{height: "80vh", width: "100%"}}
                whenCreated={(map) => {
                    map.createPane("start-goal-pane").style.zIndex = 650;
                    map.createPane("intermediate-pane").style.zIndex = 600;
                }}
            >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

                {route.length > 1 && (
                    <>
                        <Polyline
                            positions={route}
                            pathOptions={{color: "black", weight: 8, opacity: 1, lineCap: "round", lineJoin: "round"}}
                            eventHandlers={{click: handleMapClickMarkerHandler}}
                        />
                        <Polyline
                            positions={route}
                            pathOptions={{color: "white", weight: 4, opacity: 1, lineCap: "round", lineJoin: "round"}}
                            eventHandlers={{click: handleMapClickMarkerHandler}}
                        />
                    </>
                )}

                <StartGoalMarkers route={route} intermediates={[]} pane="start-goal-pane"/>

                {intermediateMarkers.map((marker, index) => (
                    <Marker key={index} position={marker.position} icon={new L.Icon.Default()}>
                        <Popup>
                            <div>
                                <strong>{marker.name}</strong>
                                <br/>
                                <button onClick={() => handleDeleteMarkerMarkerHandler(marker.id, index)} style={{
                                    marginTop: "5px",
                                    padding: "5px 10px",
                                    background: "red",
                                    color: "white",
                                    border: "none",
                                    cursor: "pointer"
                                }}>
                                    Marker löschen
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                {participantsData && participantsData.map((participant) => {
                    const position = getPositionFromProgressMarkerHandler(participant.progress);
                    if (!position) return null;
                    return <ParticipantMarker key={participant.startnr} participant={{...participant, position}}/>;
                })}
            </MapContainer>
        </div>
    );
};

export default MarkerHandler;