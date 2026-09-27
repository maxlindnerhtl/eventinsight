# Event Insight

![Event Insight](misc/Dokumentation/Powerpoint/SCRUM_neu.png)

## Über das Projekt

Event Insight ist eine Webanwendung zur Echtzeitverfolgung und Verwaltung von Sportveranstaltungen. Veranstaltende können über ein Administrationsinterface Renndaten einpflegen, Live-Ergebnisse verwalten und GPX-Daten zur Streckendefinition hochladen. Die RaceMap visualisiert die Positionen der Teilnehmenden live basierend auf den von der **RACE RESULT AG** gelieferten Zwischenzeiten und daraus berechneten Geschwindigkeiten.

Ziel des Projekts ist es, bestehende Lösungen für Live-Eventvisualisierung zu ergänzen: Bisherige Systeme decken vor allem kleinere Veranstaltungen ab, es fehlte jedoch eine skalierbare, benutzerfreundliche Lösung für Events mit vielen Teilnehmenden. Event Insight verarbeitet Renndaten aus mehreren Quellen in Echtzeit und stellt sie sowohl Veranstaltenden als auch Zusehenden übersichtlich zur Verfügung — bei besonderem Fokus auf Benutzerfreundlichkeit und kostengünstige Umsetzung.

Das Projekt wurde im Rahmen der Diplomarbeit *"Event Insight"* an der HTL Klagenfurt, Mössingerstraße (Abteilung Elektronik und Technische Informatik, Jahrgang 5AHEL) entwickelt und eingereicht am 04.04.2025.

## Entwicklerteam

| Name | Rolle | Kontakt |
|---|---|---|
| Maximilian Wolf Leopold Lindner | Administratorinterface & Backend | maximilian.lindner@edu.htl-klu.at |
| Lukas Peter Sumann | Enduserinterface & SimpleAPI-Integration | lukas.sumann@edu.htl-klu.at |

Projektbetreuer: Dipl.-Ing. Alexander Rodiga

Dieses Projekt wurde mit [Create React App](https://github.com/facebook/create-react-app) initialisiert.

## Funktionen

### Admin Interface (Maximilian Lindner)

- Erstellung, Bearbeitung und Löschung von Veranstaltungen
- Individuelle Konfiguration der Zusehenden-Ansicht (Ergebnisdarstellung, Streckenübersicht, weitere Infos)
- GPX-Upload zur Streckendefinition sowie Einzeichnen von Start-, Ziel- und Zwischenzeit-Markern
- Verknüpfung von Live-Maps mit RACE RESULT-API-Links
- Verwaltung von Sponsorenbildern
- Login-System mit rollenbasiertem Zugriff, sodass administrierende Personen nur auf ihre eigenen Veranstaltungen zugreifen können
- Veröffentlichung von Zwischenständen und Ergebnissen

### Enduser Interface (Lukas Sumann)

- Live-Visualisierung der Teilnehmenden-Positionen auf einer interaktiven RaceMap (Leaflet)
- Höhenprofil der Strecke als Liniendiagramm (Chart.js), berechnet aus den GPX-Daten
- Tabellenansicht der Ergebnisse mit Sortier-, Filter- (Altersklasse/Geschlecht) und Suchfunktion
- Verknüpfung zwischen Kartenmarkern und der jeweiligen Teilnehmenden-Ergebnisseite
- Echtzeit-Datenanzeige und Geschwindigkeitsberechnung auf Basis der SimpleAPI-Zwischenzeiten

## Systemarchitektur

Event Insight besteht aus zwei Hauptkomponenten:

- **Frontend** (React): getrennte Oberflächen für Administration und Endnutzende, komponentenbasiert aufgebaut für einfache Wartung und Erweiterbarkeit
- **Backend** (Node.js / Express): REST-API-Endpunkte für Datenverwaltung, Benutzerauthentifizierung und Kommunikation mit der Datenbank; verarbeitet und aktualisiert Event-, Teilnehmenden- und Ergebnisdaten in Echtzeit

Die Daten werden zyklisch über die **SimpleAPI** von RACE RESULT AG abgerufen. Sicherheitsprotokolle wie HTTPS sorgen für eine sichere Datenübertragung; über Docker wird sichergestellt, dass die Anwendung auf unterschiedlichen Systemen stabil läuft.

## Technologien

| Technologie | Einsatzzweck |
|---|---|
| **React** | Komponentenbasiertes Frontend-Framework für beide Interfaces |
| **Leaflet** | Interaktive Kartenvisualisierung (RaceMap, GPS-Marker) |
| **Chart.js** | Höhenprofil-Diagramm der Strecke |
| **Node.js / Express.js** | Backend, REST-API |
| **MySQL** | Relationale Datenbank für Events, Teilnehmende, Ergebnisse |
| **RACE RESULT SimpleAPI** | Anbindung an Zeitmessung und Renndaten von RACE RESULT AG |
| **Docker** | Containerisierung für stabile, plattformübergreifende Bereitstellung |
| **Axios** | HTTP-Client für API-Zugriffe |
| **React Router** | Routing im Frontend |
| **JWT / bcrypt.js** | Authentifizierung und Passwort-Hashing im Admin-Login |

## Installation & Inbetriebnahme

### Voraussetzungen

- Node.js und npm
- Docker
- MySQL Workbench (oder vergleichbares Tool zum Import des DB-Dumps)

### 1. Datenbank einrichten

Zunächst wird ein Docker-Container für MySQL gestartet. Die benötigte Datenbankstruktur liegt als MySQL-Dump-Datei im `misc`-Ordner dieses Repositories. Über MySQL Workbench wird eine neue Datenbank namens `eventinsight` erstellt und mit den Daten aus dem Dump gefüllt.

### 2. Repository klonen

```bash
git clone <repository-url>
cd event-insight
```

### 3. Abhängigkeiten installieren

Frontend und Backend haben jeweils eine eigene `package.json` — die Abhängigkeiten müssen daher in **beiden** Verzeichnissen separat installiert werden:

```bash
cd software/backend
npm install

cd ../frontend
npm install
```

### 4. Anwendung starten

Backend und Frontend werden getrennt gestartet:

```bash
npm run startBackend
```

```bash
npm run startWeb
```

## Verzeichnisstruktur

- [`misc`](misc) → Bilder, Datenblätter, Diagramme, Dokumente (inkl. MySQL-Dump)
- [`software`](software) → Frontend- und Backend-Code des Projekts

## Dokumentation

Eine vollständige Beschreibung von Anforderungen, Architektur, Implementierung und Projektmanagement ist der zugehörigen Diplomarbeit *"Event Insight"* zu entnehmen.