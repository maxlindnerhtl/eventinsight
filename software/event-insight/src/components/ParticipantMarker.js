import React, {useEffect, useRef} from 'react';
import {Marker, Popup} from 'react-leaflet';
import L from 'leaflet';
import "leaflet/dist/leaflet.css";
import {useParams} from "react-router-dom";

const getColorFromParticipant = (startnr) => {
    const hue = (startnr * 137) % 360;
    return `hsl(${hue}, 100%, 50%)`;
};

const ParticipantMarker = ({participant}) => {
    const {Vorname, Nachname, JG, Verein, position, startnr, speed, expectedGoalTime, listlink, progress} = participant;
    const markerRef = useRef(null);
    const currentPositionRef = useRef(position);
    const color = getColorFromParticipant(startnr);
    const {id} = useParams();

    // Erstelle den Ergebnis-Link mit Liste und Suchbegriff
    const resultPath = `/event/${id}/userResults?list=${encodeURIComponent(listlink)}&search=${encodeURIComponent(`${Vorname} ${Nachname}`)}`;

    // Animationseffekt mit korrekten Abhängigkeiten
    useEffect(() => {
        const [targetLat, targetLng] = position;
        const [currentLat, currentLng] = currentPositionRef.current;

        if (targetLat !== currentLat || targetLng !== currentLng) {
            const duration = 5000;
            const startTime = performance.now();

            const animate = (time) => {
                const elapsed = time - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const newLat = currentLat + (targetLat - currentLat) * progress;
                const newLng = currentLng + (targetLng - currentLng) * progress;

                // Direktes Update des Markers
                if (markerRef.current) {
                    markerRef.current.setLatLng([newLat, newLng]);
                }

                // Ref aktualisieren
                currentPositionRef.current = [newLat, newLng];

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        }
    }, [position, currentPositionRef]); // position and currentPositionRef as dependencies

    // Marker-Icon
    const customIcon = new L.DivIcon({
        className: 'animated-marker',
        html: `
            <div style="
                width: 21px;
                height: 21px;
                background: ${color};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            ">
            </div>
        `,
        iconSize: [21, 21],
        iconAnchor: [10, 10],
        popupAnchor: [0, -10]
    });

    return (
        <Marker
            position={position} // Initialposition
            icon={customIcon}
            ref={markerRef}
            eventHandlers={{
                click: () => {
                    if (markerRef.current) {
                        markerRef.current.openPopup();
                    }
                }
            }}
        >
            <Popup>
                <div className="popup-style">
                    <h3>{Vorname} {Nachname}</h3>
                    <p><b>Jahrgang:</b> {JG}</p>
                    <p><b>Verein:</b> {Verein}</p>
                    {speed > 0 && (
                        <p><b>⌀</b> {(speed * 3.6).toFixed(2)} km/h</p>
                    )}
                    {(expectedGoalTime != null) && (progress !== 100) && (expectedGoalTime !== "Infinity:NaN:NaN") && (
                        <p><b>Erwartete Zielzeit: </b> {expectedGoalTime}</p>
                    )}
                    <p><a href={resultPath}>Zu den Ergebnissen</a></p>
                </div>
            </Popup>
        </Marker>
    );
};

export default ParticipantMarker;