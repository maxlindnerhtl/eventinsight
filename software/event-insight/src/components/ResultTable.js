import React, { useState } from "react";

const ResultTable = ({ data, searchTerm, onSearchChange }) => {
    const [sortConfig, setSortConfig] = useState({key: null, direction: "asc"});
    const [groupMode, setGroupMode] = useState("MW");
    const [expandedGroups, setExpandedGroups] = useState({});

    if (!data || data.length === 0) {
        return <p className="loading-message">Daten werden geladen...</p>;
    }

    const columns = Object.keys(data[0]);
    const zwColumns = columns.filter(col => col.match(/^\d+$/)).sort((a, b) => a - b);
    const otherColumns = columns.filter(col => !col.match(/^\d+$/));

    const timeStringToSeconds = (timeString) => {
        if (!timeString) return Infinity;
        const parts = timeString.split(":").map(part => parseFloat(part.replace(",", ".")));
        let hours = 0, minutes = 0, seconds = 0;

        if (parts.length === 3) {
            [hours, minutes, seconds] = parts;
        } else if (parts.length === 2) {
            [minutes, seconds] = parts;
        } else {
            [seconds] = parts;
        }
        return hours * 3600 + minutes * 60 + seconds;
    };

    const filterColumns = (columns) => {
        return columns.filter(
            (col) =>
                !(
                    (groupMode === "MW" && col === "Geschlecht") ||
                    (groupMode === "AK" && (col === "AK" || col === "Geschlecht"))
                )
        );
    };

    const orderedColumns = filterColumns([
        ...otherColumns.slice(0, otherColumns.indexOf("Zeit")),
        ...zwColumns.map((num) => `ZW${num}`),
        "Zeit",
    ]);

    const getGroupByFields = () => {
        return groupMode === "MW" ? ["Geschlecht"] : ["AK", "Geschlecht"];
    };

    const transformData = (data) => {
        return data.map(item => {
            const newItem = { ...item };
            zwColumns.forEach(num => {
                newItem[`ZW${num}`] = item[num];
                delete newItem[num];
            });
            delete newItem['Platz'];
            delete newItem['Pl.'];
            return newItem;
        });
    };

    const calculatePlacement = (data) => {
        return data.sort((a, b) => {
            // Wenn einer der Teilnehmer eine Zielzeit hat und der andere nicht, wird der mit Zielzeit besser platziert
            const timeA = timeStringToSeconds(a.Zeit || "");
            const timeB = timeStringToSeconds(b.Zeit || "");

            if (timeA !== Infinity && timeB === Infinity) return -1; // a hat eine Zeit, b nicht
            if (timeA === Infinity && timeB !== Infinity) return 1;  // b hat eine Zeit, a nicht

            // Wenn beide eine Zielzeit haben, vergleiche diese
            if (timeA !== Infinity && timeB !== Infinity) {
                if (timeA < timeB) return -1; // Der Teilnehmer mit der niedrigeren Zeit wird besser platziert
                if (timeA > timeB) return 1;
            }

            // Zähle die Anzahl der Zwischenzeiten, die jeder Teilnehmer hat
            const zwCountA = Object.keys(a).filter(key => /^ZW\d+$/.test(key) && a[key] !== "").length;
            const zwCountB = Object.keys(b).filter(key => /^ZW\d+$/.test(key) && b[key] !== "").length;

            // Wenn einer mehr Zwischenzeiten hat, ist er besser
            if (zwCountA > zwCountB) return -1;
            if (zwCountA < zwCountB) return 1;

            // Falls die Anzahl der Zwischenzeiten gleich ist, prüfe die aktuelle ZW (die höchste)
            for (let i = Math.max(...Object.keys(a).filter(k => /^ZW\d+$/.test(k)).map(k => parseInt(k.replace('ZW', '')))); i >= 1; i--) {
                const zWKey = `ZW${i}`;
                if (a[zWKey] !== "" && b[zWKey] !== "") {
                    const timeA = timeStringToSeconds(a[zWKey]);
                    const timeB = timeStringToSeconds(b[zWKey]);

                    // Der Teilnehmer mit der kleineren Zeit bei der aktuellen ZW wird höher platziert
                    if (timeA < timeB) return -1;
                    if (timeA > timeB) return 1;
                }
            }

            return 0; // Wenn alle Zwischenzeiten gleich sind (unwahrscheinlich), gleich platzieren
        });
    };

    const groupBy = (data, fields) => {
        const groups = {};
        data.forEach((item) => {
            const key = fields.map((field) => {
                if (field === "Geschlecht") {
                    if (groupMode === "MW") {
                        if (item[field] === "m") return "Männlich";
                        if (item[field] === "w" || item[field] === "f") return "Weiblich";
                    }
                    return item[field];
                }
                return item[field] || "";
            }).join(" ");

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        // Sortiere Gruppen nach den besten Zwischenzeiten
        Object.values(groups).forEach(group => {
            group = calculatePlacement(group); // Sortiere die Teilnehmer innerhalb der Gruppen
            group.forEach((item, index) => {
                item.Platz = index + 1; // Berechne die Platzierung
            });
        });

        return groups;
    };

    const handleSort = (key) => {
        setSortConfig((prevConfig) => {
            // Wenn auf die gleiche Spalte geklickt wird, toggle die Richtung
            if (prevConfig.key === key) {
                // Wenn bereits absteigend sortiert ist, entferne die Sortierung
                if (prevConfig.direction === "desc") {
                    return { key: null, direction: null };  // zurück zur Platzierung (Standard)
                }
                // Sonst, sortiere absteigend
                return { key, direction: "desc" };
            }
            // Wenn eine neue Spalte angeklickt wird, setze die Sortierung auf aufsteigend
            return { key, direction: "asc" };
        });
    };

    const filterData = (group) => {
        if (!searchTerm) return group;

        return group.filter(item => {
            const searchTerms = searchTerm.toLowerCase().split(' ');

            // 1. Kombinierte Suche nach Vorname und Nachname
            const fullName = `${item.Vorname || ''} ${item.Nachname || ''}`.toLowerCase();
            const nameMatch = searchTerms.every(term => fullName.includes(term));

            // 2. Einzelne Suche nach Startnummer, Nation, Verein und Jahrgang
            const startnummerMatch = item["Startnr."] && item["Startnr."].toString().toLowerCase().includes(searchTerms.join(''));
            const natMatch = item["Nat."] && item["Nat."].toLowerCase().includes(searchTerms.join(''));
            const vereinMatch = item["Verein"] && item["Verein"].toLowerCase().includes(searchTerms.join(''));
            const jahrgangMatch = item["JG"] && item["JG"].toString().toLowerCase().includes(searchTerms.join(''));

            // Gib die Teilnehmer zurück, wenn sie in einem der Felder übereinstimmen
            return nameMatch || startnummerMatch || natMatch || vereinMatch || jahrgangMatch;
        });
    };

    const transformedData = transformData(data);
    const fullGroupedData = groupBy(transformedData, getGroupByFields());

    let groupedData = fullGroupedData;
    if (searchTerm) {
        groupedData = {};
        Object.entries(fullGroupedData).forEach(([groupName, group]) => {
            const filteredGroup = filterData(group);
            if (filteredGroup.length > 0) {
                groupedData[groupName] = filteredGroup;
            }
        });
    }

    // Hilfsfunktion zum Umschalten des erweiterten Zustands pro Gruppe
    const toggleGroupExpansion = (groupName) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const renderTable = (title, groupData) => {
        let sortedData = [...groupData];
        if (sortConfig.key) {
            sortedData.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                // Zeitbasierte Spalten
                if (sortConfig.key === 'Zeit' || sortConfig.key.startsWith('ZW')) {
                    const timeA = timeStringToSeconds(aValue);
                    const timeB = timeStringToSeconds(bValue);
                    return sortConfig.direction === 'asc' ? timeA - timeB : timeB - timeA;
                }

                // Standardvergleich
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        // Wenn die Gruppe mehr als 30 Teilnehmer hat und noch nicht erweitert ist,
        // zeige nur die ersten 30 Einträge
        const isExpanded = expandedGroups[title];
        const displayData = (sortedData.length > 30 && !isExpanded)
            ? sortedData.slice(0, 30)
            : sortedData;

        return (
            <div key={title} className="group-container">
                <h2 className="group-title">{title}</h2>
                <table className="result-table">
                    <thead className="table-head">
                    <tr>
                        {orderedColumns.map((column, index) => (
                            <th
                                key={index}
                                onClick={() => handleSort(column)}
                                className="table-header-cell"
                            >
                                {(column === "Platz") || (column === "Pl")
                                    ? (groupMode === "MW" ? "MW Pl" : "AK Pl")
                                    : column}
                                {sortConfig.key === column && (
                                    <span className="sort-indicator">
                    {sortConfig.direction === "asc"
                        ? "🔼"
                        : sortConfig.direction === "desc"
                            ? "🔽"
                            : ""}
                  </span>
                                )}
                            </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody className="table-body">
                    {displayData.map((item, rowIndex) => (
                        <tr key={rowIndex} className="table-row">
                            {orderedColumns.map((column, colIndex) => (
                                <td
                                    key={colIndex}
                                    className={`table-cell ${column === "Pl." ? "placement-cell" : ""}`}
                                >
                                    {item[column]}
                                </td>
                            ))}
                        </tr>
                    ))}
                    {/* Zusätzliche Zeile als 31. Zeile mit "..." und Knopf */}
                    {sortedData.length > 30 && (
                        <tr>
                            <td colSpan={orderedColumns.length} style={{ textAlign: "center" }}>
                                {!isExpanded ? (
                                    <>
                                        <span style={{ marginRight: "16px", fontSize: "1rem", color: "#333" }}></span>
                                        <button
                                            style={{
                                                backgroundColor: "#0070f3",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "6px",
                                                padding: "10px 20px",
                                                fontSize: "1rem",
                                                cursor: "pointer"
                                            }}
                                            onClick={() => toggleGroupExpansion(title)}
                                        >
                                            Alle Anzeigen
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        style={{
                                            backgroundColor: "#0070f3",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "6px",
                                            padding: "10px 20px",
                                            fontSize: "1rem",
                                            cursor: "pointer"
                                        }}
                                        onClick={() => toggleGroupExpansion(title)}
                                    >
                                        Verkleinern
                                    </button>
                                )}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        );
    };


    return (
        <div className="table-container">
            <div className="switch-container">
                <button
                    className={`switch-button ${groupMode === "MW" ? "active" : ""}`}
                    onClick={() => setGroupMode("MW")}
                >
                    M/W
                </button>
                <button
                    className={`switch-button ${groupMode === "AK" ? "active" : ""}`}
                    onClick={() => setGroupMode("AK")}
                >
                    AK
                </button>
            </div>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Nach Teilnehmer suchen..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="input-field"
                />
            </div>
            {Object.entries(groupedData).map(([groupName, groupData]) =>
                renderTable(groupName, groupData)
            )}
        </div>
    );
};

export default ResultTable;
