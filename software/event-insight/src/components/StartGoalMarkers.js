import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";


const StartGoalIcon = new L.Icon({
    iconUrl: "/MapIcons/StartGoalMarkerIcon/marker-icon.png",
    iconRetinaUrl: "/MapIcons/StartGoalMarkerIcon/marker-icon-2x.png",
    shadowUrl: "/MapIcons/StartGoalMarkerIcon/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});


const roundToTwoDecimals = (num) => Math.round(num * 100) / 100;

const StartGoalMarkers = ({ route, intermediates }) => {
    if (!route || route.length === 0) return null;

    const startPoint = route[0];
    const goalPoint = route[route.length - 1];

    const startLat = roundToTwoDecimals(startPoint[0]);
    const startLon = roundToTwoDecimals(startPoint[1]);
    const goalLat = roundToTwoDecimals(goalPoint[0]);
    const goalLon = roundToTwoDecimals(goalPoint[1]);

    const isCircular = startLat === goalLat && startLon === goalLon;

    return (
        <>
            {isCircular ? (
                <Marker position={startPoint} icon={StartGoalIcon}>
                    <Popup className="popup-content" offset={[0, -30]}>
                        <div className="popup-label">Start/Ziel</div>
                    </Popup>
                </Marker>
            ) : (
                <>
                    <Marker position={startPoint} icon={StartGoalIcon}>
                        <Popup className="popup-content" offset={[0, -30]}>
                            <div className="popup-label">Startpunkt</div>
                        </Popup>
                    </Marker>
                    <Marker position={goalPoint} icon={StartGoalIcon}>
                        <Popup className="popup-content" offset={[0, -30]}>
                            <div className="popup-label">Zielpunkt</div>
                        </Popup>
                    </Marker>
                </>
            )}
            {intermediates.map((intermediate, index) => (
                <Marker key={index} position={intermediate.position} icon={StartGoalIcon}>
                    <Popup className="popup-content" offset={[0, -20]}>
                        <div className="popup-label">{intermediate.name}</div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default StartGoalMarkers;
