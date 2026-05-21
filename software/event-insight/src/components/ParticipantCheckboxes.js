import React, { useState, useMemo, useEffect, memo } from "react";

const ParticipantCheckboxItem = memo(({ startnr, displayName, Zeit, isDisabled, isChecked, onToggle }) => {
    const getColorFromParticipant = (startnr) => {
        const hue = (startnr * 137) % 360;
        return `hsl(${hue}, 100%, 50%)`;
    };
    const color = getColorFromParticipant(startnr);

    return (
        <div key={startnr} className="checkbox-item">
            <label
                className="checkbox-label"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => onToggle(startnr)}
                        className="checkbox-input"
                        disabled={isDisabled}
                    />
                    {`${startnr} - ${displayName}${Zeit ? " - finished" : ""}`}
                </div>

                {isChecked && (
                    <div
                        className="participant-icon"
                        style={{
                            backgroundColor: color,
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            marginLeft: '10px',
                        }}
                    />
                )}
            </label>
        </div>
    );
});

const ParticipantCheckboxes = ({
                                   participantsData,
                                   selectedParticipants,
                                   onParticipantToggle,
                                   maxSelectable = 5
                               }) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredData = useMemo(() => {
        const data = participantsData.filter(({ Vorname, Nachname }) => {
            const displayName = Vorname ? `${Vorname} ${Nachname}` : Nachname;
            return displayName && displayName.toLowerCase().includes(searchTerm.toLowerCase());
        });

        const selectedParticipantsList = data.filter(participant => selectedParticipants.has(participant.startnr));
        const unselectedParticipantsList = data.filter(participant => !selectedParticipants.has(participant.startnr));

        selectedParticipantsList.sort((a, b) => a.startnr - b.startnr);
        unselectedParticipantsList.sort((a, b) => a.startnr - b.startnr);

        return [...selectedParticipantsList, ...unselectedParticipantsList];
    }, [participantsData, searchTerm]);

    const isDisabled = (startnr) => false;

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.ctrlKey && event.key === 'a') {
                event.preventDefault();
                const allSelected = filteredData.every(participant => selectedParticipants.has(participant.startnr));
                if (allSelected) {
                    filteredData.forEach(participant => onParticipantToggle(participant.startnr));
                } else {
                    filteredData.forEach(participant => {
                        if (!selectedParticipants.has(participant.startnr)) {
                            onParticipantToggle(participant.startnr);
                        }
                    });
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [filteredData, selectedParticipants, onParticipantToggle]);

    return (
        <div className="checkbox-container">
            <div className="sticky-search">
                <h4 className="checkbox-title">Läufer auswählen:</h4>
                <input
                    type="text"
                    placeholder="Läufer suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field"
                />
            </div>

            {filteredData.length === 0 ? (
                <p>No participants found</p>
            ) : (
                filteredData.map(({ Vorname, Nachname, startnr, Zeit }) => {
                    const displayName = Vorname ? `${Vorname} ${Nachname}` : Nachname;
                    return (
                        <ParticipantCheckboxItem
                            key={startnr}
                            startnr={startnr}
                            displayName={displayName}
                            Zeit={Zeit}
                            isDisabled={isDisabled(startnr)}
                            isChecked={selectedParticipants.has(startnr)}
                            onToggle={onParticipantToggle}
                        />
                    );
                })
            )}
        </div>
    );
};

export default React.memo(ParticipantCheckboxes);