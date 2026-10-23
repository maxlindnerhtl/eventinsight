# Event Insight

Echtzeit-Tracking und Verwaltung von Sportveranstaltungen (Diplomarbeit HTL Klagenfurt, abgegeben 04.04.2025). Veranstaltende verwalten Events, GPX-Strecken und Sponsoren im Admin-Interface. Zusehende sehen Live-Karte, Höhenprofil und Ergebnisse im öffentlichen Interface. Live-Positionen werden aus Zeitmessdaten der RACE RESULT SimpleAPI berechnet.

Zuständigkeit: Maximilian Lindner (Admin-Interface, Backend), Lukas Sumann (Enduser-Interface, SimpleAPI-Anbindung). Das Repo ist öffentlich auf GitHub.

## Struktur
- `software/backend`: Express-API (Node.js), MySQL über `mysql2`, Callback-Stil, keine ORM
- `software/event-insight`: React-Frontend (Create React App)
- `misc`: Doku, Bilder, MySQL-Dump des Schemas (`misc/Datenbank`)

## Befehle
Backend (`software/backend`):
- `npm install`
- `npm run startBackend` (startet `src/server.js` auf `$PORT`, Standard 3001)
- `npm run seedAdmin` (einmalig, liest `SEED_ADMIN_USERNAME` und `SEED_ADMIN_PASSWORD`)

Frontend (`software/event-insight`):
- `npm install`
- `npm run startWeb` (Dev-Server)
- `npm run build`
- `npm run lint` (oxlint, Config `.oxlintrc.json` im Repo-Root)

Es gibt keine Tests und kein Backend-Lint-Script. Das Backend braucht `software/backend/.env` mit `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `PORT` (Vorlage: `.env.example`). Es bricht beim Start ab, wenn `DB_PASSWORD` oder `JWT_SECRET` fehlt. Das Schema wird per Hand aus dem Dump importiert, es gibt keine Migrationen.

## Architektur Backend
- Einstieg ist `src/server.js`. `bin/www` ist ein ungenutzter Überrest.
- `db.js` exportiert eine einzelne Connection. Alle Queries sind parametrisiert.
- `routes/routes.js` bindet `authRoutes`, `admins`, `events` und `files` ein (`files` enthält Livemaps, Sponsoren, Ergebnislinks, Zwischenzeiten und Texte).
- Auth ist ein JWT (Gültigkeit 1 Stunde). `utils/authenticateToken.js` wird pro Route angehängt, nicht global. Immer in der Route-Datei nachsehen, was wirklich geschützt ist.
- Authentifizierung ist nicht Autorisierung: Die Tabelle `AdminEventAccess` legt fest, welcher Admin welches Event bearbeiten darf. Dieser Check ist aktuell nicht durchgesetzt (siehe Offen).
- Uploads (`multer`) liegen in `src/uploads/{livemaps,sponsors}` und werden unter `/uploads` ausgeliefert. Der Ordner ist nicht im Git.
- Fehler laufen über `utils/errorHandler.js`.

## Architektur Frontend
- `App.js` trennt öffentliche Routen (Landing, `/event/:id`-Seiten, Admin-Login) von Admin-Routen in `PrivateRoute` (prüft den Token in localStorage).
- `utils/apiClient.js`: zentrale Axios-Instanz. Der Request-Interceptor hängt den Bearer-Token an, der Response-Interceptor sendet bei 401 das globale Event `auth:logout`. `AuthContext` hört darauf.
- `AuthContext` ist plain React Context mit `{username, adminid}`, `login()`, `logout()` und Token-Validierung beim Start. Sonst gibt es nur lokalen State.
- GPX-Pipeline: `utils/fetchGPXFile.js` lädt, `utils/gpxParser.js` parst (Koordinaten, Höhenprofil, Haversine), `utils/mapUtils.js` berechnet Karten-Bounds, `utils/participantUtils.js` berechnet Geschwindigkeit und Fortschritt aus Zwischenzeiten. Die Karte läuft mit Leaflet (`GPXMap`, `MarkerHandler`, `ParticipantMarker`, `StartGoalMarkers`, `IntermediateTimeMarker`).

## Arbeitsregeln
- Ein Modul pro Schritt. - Arbeite autonom Schritt für Schritt, ohne Rückfragen. Nach jedem Schritt: Build/Lint/Backend-Start prüfen, dann committen. Stoppe nur bei DB-Schema, Dependencies oder wenn eine Entscheidung nicht aus dieser Datei hervorgeht.
- Keine Verhaltensänderung bei Refactorings (gleicher Input, gleicher Output). Ausnahmen vorher benennen.
- Nach jedem freigegebenen und getesteten Schritt sofort committen, kleine Commits. Nie `git push`.
- Eine Änderung erst als erledigt melden, wenn `git diff` sie zeigt. "Build succeeded" ist kein Funktionstest.
- Stößt du beim genauen Hinschauen auf einen unabhängigen Bug: nicht mitfixen, melden und als eigenen kleinen Schritt vorschlagen.
- Keine Dependencies tauschen oder updaten, kein DB-Schema ändern, die SimpleAPI-Logik nur auf ausdrücklichen Auftrag anfassen.
- Kein `--fix` und keine Formatierungsläufe über das ganze Repo. Nur pro Ordner, danach `git diff` zeigen.
- Backend-Datenfelder nie umbenennen (`Zeit`, `Startnr.`, `JG`, `Vorname`, `Nachname`, `listlink`, `idlivemap`, `eventid`, `is_displayed`, `formatted_date` ...). Das ist die Datenform von API und DB, keine Stilfrage.
- `.env` nicht lesen und nicht in Ausgaben kopieren. Keine Secrets committen.

## Bewusste Entscheidungen, nicht ändern
- `apiClient` nur für Aufrufe an geschützte Routen des eigenen Backends. Raw axios oder fetch bleibt bei öffentlichen Routen, beim Login, bei `validateToken` (Startup-Check, ein 401 darf dort kein globales Logout auslösen), bei `useApiData` (pollt öffentliche und externe Feeds) und bei `fetchGPXFile`.
- `fetchGPXFile` sendet keinen Auth-Header, damit kein Token an externe URLs geht.
- `AdminHome` ruft `createAdmin` mit manuellem Bearer-Header auf, bewusst ohne Umbau der restlichen Seite.
- `AuthContext`: Der `[user]`-Dependency-Array im `auth:logout`-Effect ist Absicht (Stale-Closure-Fix). oxlint will dort `logout`, das nicht übernehmen.
- Öffentliche Lese-Routen bleiben ohne Auth (Enduser-Seiten brauchen sie anonym): `GET /events`, `GET /events/:id`, `GET /files/livemap`, `GET /files/livemap/details/:eventid`, `GET /files/results/fetch`, `GET /files/results/fetchFromMap`, `GET /files/sponsors`, `GET /files/intermediateTimes/getByMap`, `GET /files/text/fetch`.
- `POST /admins/login`, `GET /admins/me` und `GET /auth/validateToken` bleiben ohne `authenticateToken`.
- Neue Admins legt nur ein eingeloggter Admin an (AdminHome). Der erste Admin kommt per `seedAdmin`.
- Generische Update-Routen (`SET ${field} = ?`) nur mit fester Feld-Allowlist, nie mit ungeprüftem Spaltennamen.
- Backend-Validierung spiegelt die Frontend-Prüfungen (RaceResult-URL-Muster, `HH:MM:SS`, `YYYY-MM-DD`, Längen laut Schema).
- In `AdminEdit.jsx` gilt: `loadError` ersetzt die ganze Seite, `actionError` wird nur inline angezeigt. Nicht wieder zusammenlegen.

## Stand
Mit `authenticateToken`, Validierung und `apiClient` im Frontend abgesichert: Admin-Routen, Events, Files/Livemap, Files/Results, Files/Sponsors, Files/IntermediateTimes, Files/Text. Sponsorbilder werden auf Typ, Endung, Größe und Magic Bytes geprüft und unter einem serverseitig erzeugten UUID-Namen gespeichert. Secrets liegen in `.env` und wurden rotiert. Löschkaskade in `deleteEvent` korrigiert.

## Offen
- `authenticateToken` antwortet bei fehlendem, ungültigem oder abgelaufenem Token mit 400 statt 401. Der 401-Logout im `apiClient` greift dadurch nie.
- XSS: `UserHome.jsx` rendert den Event-Text per `dangerouslySetInnerHTML` ohne Sanitizing (braucht DOMPurify, also eine neue Dependency)
- `saveIntermediateTimes` (AdminLiveMap) sendet bei jedem Speichern alle Marker, auch bereits gespeicherte (Duplikate). `handleDeleteMarker` (MarkerHandler) entfernt den Marker lokal auch bei fehlgeschlagenem DELETE.
- `AdminSponsors.fetchSponsors`: Eine Fehlerantwort wird als Liste behandelt (`.map`-Crash)
- Ownership: `AdminEventAccess`-Check für alle Event-, Map- und Datei-Mutationen, `adminid` aus dem JWT statt aus dem Body, `idlivemap` muss zu `eventid` gehören, `sponsors/updateDisplay` setzt `is_displayed = 1` per ID ohne `eventid`-Filter
- Löschkaskaden nicht transaktional
- oxlint-Restbefunde einzeln prüfen: `exhaustive-deps` in ParticipantCheckboxes, SearchableSelect, UserLiveMap, AdminSponsors
- Frontend: Verschachtelungs-Kandidaten (AdminEdit, UserLiveMap, ResultTable, GPXMap), danach Ordner-für-Ordner-Durchgang
- Feste `http://localhost:3001`-URLs auf `apiClient`-Pfade bzw. `REACT_APP_API_URL` umstellen

## Fertig heißt
- `npx oxlint .` ohne neue Fehler
- `npm run build` im Frontend läuft durch
- `node --check` auf geänderte Backend-Dateien, Backend startet ohne Crash
- `git diff` geprüft, dann committet

## Sprache
Antworte auf Deutsch. Code, Code-Kommentare und Commit-Messages auf Englisch. Neue nutzersichtbare Backend-Strings auf Deutsch, Frontend-Texte in der Sprache der jeweiligen Seite.