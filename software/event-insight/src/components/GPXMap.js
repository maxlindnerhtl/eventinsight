import React, {useEffect, useState} from "react";
import {MapContainer, TileLayer, Polyline, useMap} from "react-leaflet";
import StartGoalMarkers from "./StartGoalMarkers";
import IntermediateTimeMarker from "./IntermediateTimeMarker";
import ParticipantMarker from "./ParticipantMarker";
import {FaCrosshairs} from "react-icons/fa";
import {fetchGPXFile} from "../utils/fetchGPXFile";
import {parseGPXToTrackCoordinates} from "../utils/gpxParser";

function calculateBoundsAndCenter(route) {
    if (route.length === 0) return {center: null, zoom: 14};

    let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;

    route.forEach(([lat, lon]) => {
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
    });

    const center = [(minLat + maxLat) / 2, (minLon + maxLon) / 2];
    const latDiff = maxLat - minLat;
    const lonDiff = maxLon - minLon;
    const maxDiff = Math.max(latDiff, lonDiff);
    const worldSize = 40075016.686;
    const scale = (maxDiff * worldSize) / 360;
    const targetResolution = scale / 800;
    const zoom = Math.log2(156543.03392 / targetResolution);

    return {center, zoom: Math.max(5, zoom)};
}

const RecenterButton = ({center, zoom}) => {
    const map = useMap();

    const handleClick = () => {
        map.flyTo(center, zoom, {duration: 2});
    };

    return (
        <div style={{position: "absolute", top: "20px", right: "20px", zIndex: 1000}}>
            <button
                onClick={handleClick}
                style={{
                    backgroundColor: "#2196f3",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "56px",
                    height: "56px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "24px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    transition: "background-color 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#1976d2")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#2196f3")}
            >
                <FaCrosshairs/>
            </button>
        </div>
    );
};

const SetViewOnLoad = ({center, zoom}) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, {duration: 2});
    }, [center, zoom, map]);
    return null;
};

const GPXMap = ({gpxPath, intermediateTimes, participantsData}) => {
    const [route, setRoute] = useState([]);
    const [center, setCenter] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [zoom, setZoom] = useState(14);

    useEffect(() => {
        async function loadAndParseGPXData() {
            setIsLoading(true);
            try {
                const gpxText = await fetchGPXFile(gpxPath);
                const trackData = parseGPXToTrackCoordinates(gpxText);
                if (trackData.length > 0) {
                    setRoute(trackData);
                    const {center, zoom} = calculateBoundsAndCenter(trackData);
                    setCenter(center);
                    setZoom(zoom);
                }
            } catch (error) {
                console.error("Fehler beim Laden oder Parsen der GPX-Datei:", error);
            }
            setIsLoading(false);
        }

        loadAndParseGPXData();
    }, [gpxPath]);

    const getPositionFromProgress = (progress) => {
        if (!route.length) return null;
        const indexFloat = (progress / 100) * (route.length - 1);
        const lowerIndex = Math.floor(indexFloat);
        const fraction = indexFloat - lowerIndex;

        const start = route[lowerIndex];
        const end = route[lowerIndex + 1] || start;

        const interpolatedPosition = [
            start[0] + (end[0] - start[0]) * fraction,
            start[1] + (end[1] - start[1]) * fraction,
        ];

        return interpolatedPosition;
    };

    const sortedIntermediateTimes = intermediateTimes.sort((a, b) => a.progress - b.progress);

    if (isLoading || !center) return <div>Lade Daten...</div>;

    return (
        <div className="map-wrapper">
            <MapContainer
                center={center}
                zoom={zoom}
                style={{height: "80vh", width: "100%"}}
                maxBounds={[[-90, -180], [90, 180]]}
                maxBoundsViscosity={1.0}
                whenCreated={(map) => {
                    map.createPane("start-goal-pane").style.zIndex = 650;
                    map.createPane("intermediate-pane").style.zIndex = 600;
                }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    noWrap={true}
                    bounds={[[-90, -180], [90, 180]]}
                />

                <SetViewOnLoad center={center} zoom={zoom}/>


                {route.length > 1 && (
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: "black",
                            weight: 8,
                            opacity: 1,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                )}
                {route.length > 1 && (
                    <Polyline
                        positions={route}
                        pathOptions={{
                            color: "white",
                            weight: 4,
                            opacity: 1,
                            lineCap: "round",
                            lineJoin: "round",
                        }}
                    />
                )}

                <StartGoalMarkers route={route} intermediates={[]} pane="start-goal-pane"/>

                {route.length > 1 &&
                    sortedIntermediateTimes.map(({progress}, index) => {
                        const position = getPositionFromProgress(progress);
                        if (position) {
                            return (
                                <IntermediateTimeMarker
                                    key={index}
                                    position={position}
                                    name={`Zwischenzeit ${index + 1}`}
                                    pane="intermediate-pane"
                                />
                            );
                        }
                        return null;
                    })}

                {participantsData.map((participant) => {
                    const position = getPositionFromProgress(participant.progress);
                    if (!position) return null;

                    return (
                        <ParticipantMarker
                            key={participant.startnr}
                            participant={{
                                ...participant,
                                position: position,
                                speed: participant.speed,
                                expectedGoalTime: participant.expectedGoalTime,
                                listlink: participant.listlink,
                            }}
                        />
                    );
                })}
                <RecenterButton center={center} zoom={zoom}/>
            </MapContainer>
        </div>
    );
};

export default GPXMap;