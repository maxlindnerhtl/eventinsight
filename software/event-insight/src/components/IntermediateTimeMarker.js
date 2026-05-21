import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const intermediateIcon = new L.Icon.Default();

const calculateDistance = (progress, route) => {
    if (!route || route.length === 0) return 0;

    const index = Math.floor((progress / 100) * (route.length - 1));
    const point1 = route[0];
    const point2 = route[index];

    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(point2[0] - point1[0]);
    const dLon = toRad(point2[1] - point1[1]);

    const lat1 = toRad(point1[0]);
    const lat2 = toRad(point2[0]);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

const IntermediateTimeMarker = ({ position, name, progress, route }) => {
    const distance = calculateDistance(progress, route);

    return (
        <Marker position={position} icon={intermediateIcon}>
            <Popup>
                <div>
                    <strong>{name}</strong>
                </div>
            </Popup>

            <div
                style={{
                    position: "absolute",
                    top: "-25px",
                    left: "-10px",
                    fontWeight: "bold",
                    color: "black",
                    backgroundColor: "white",
                    padding: "3px 5px",
                    borderRadius: "5px",
                    border: "1px solid black",
                    fontSize: "12px",
                    textAlign: "center",
                    zIndex: 9990,
                }}
            >
                {distance.toFixed(2)} km
            </div>
        </Marker>
    );
};

export default IntermediateTimeMarker;
