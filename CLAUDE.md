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
- Auth ist ein JWT (Gültigkeit 1 Stunde). Es gibt kein serverseitiges Logout oder Revoke: Ein Token bleibt nach dem Abmelden bis zum Ablauf gültig. `utils/authenticateToken.js` wird pro Route angehängt, nicht global. Immer in der Route-Datei nachsehen, was wirklich geschützt ist.
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
Mit `authenticateToken`, Validierung und `apiClient` im Frontend abgesichert: Admin-Routen, Events, Files/Livemap, Files/Results, Files/Sponsors, Files/IntermediateTimes, Files/Text. Sponsorbilder werden auf Typ, Endung, Größe und Magic Bytes geprüft und unter einem serverseitig erzeugten UUID-Namen gespeichert. Livemap-Uploads ebenso: nur `.gpx`, max. 10 MB, Inhalt muss mit `<?xml` oder `<gpx` beginnen, UUID-Name, Aufräumen bei jedem Fehler. Ältere Einträge behalten ihren ursprünglichen `mappath`. `authenticateToken` antwortet bei fehlendem, ungültigem oder abgelaufenem Token mit 401 (`errorHandler.handleAuthError`), damit greift der 401-Logout im `apiClient`. Secrets liegen in `.env` und wurden rotiert. Löschkaskade in `deleteEvent` korrigiert. `AuthContext.logout` entscheidet das Redirect-Ziel über den aktuellen Pfad (`matchPath` gegen die öffentlichen Routen aus `App.js`): öffentlich nach `/`, sonst nach `/adminLogin`, unabhängig von `user`. `AdminLogin` meldet über `AuthContext.login()` an (schreibt `token`, `username`, `adminid` und setzt `user`), damit ist das Admin-Theme auf `/` direkt nach dem Login aktiv. Event-Texte laufen im Frontend durch `utils/sanitizeHtml.js` (DOMPurify, Allowlist der Quill-Toolbar-Formate inkl. `ql-*`-Klassen): in `UserHome.jsx` vor `dangerouslySetInnerHTML` und in `EditText.jsx` vor dem Laden in den Editor (Quill 1.3.7 parst per `innerHTML` im Live-DOM, `onerror` lief dort nachweislich). Gespeicherte Bilder, Videos und Code-Blöcke werden dadurch nicht mehr angezeigt und gehen beim nächsten Speichern im Editor verloren.

UI-Redesign (Branch `ui-redesign`, nur CSS/Markup): Design-Tokens (`--color-*`, `--space-*`, `--radius-*`) in `src/style/index.css`, `.theme-admin` am Seiten-Wrapper überschreibt nur Variablen, `.theme-user` für öffentliche Seiten. Landing nimmt `theme-admin`, sobald `useAuth().user` gesetzt ist; UserHome/UserLiveMap/UserResults bleiben immer `theme-user`. Das Admin-Badge hängt nur per CSS an `.theme-admin`, Header-Farbe, Badge und Logo-Variante (zwei `<img>`, eins per CSS ausgeblendet) folgen also immer dem Wrapper. `isAdmin` im Header steuert nur noch Username/Abmelden. Inter kommt über `@fontsource/inter` (400/600/700/800 und 800-italic für den Landing-Titel, Import in `src/index.js`). Header (Pill-Nav, Hamburger unter 1024px, Admin-Badge) umgebaut. Footer ist eine Komponente für alle Seiten: schlichte Leiste, links „Event Insight · HTL Klagenfurt · About Us“, rechts die Kontakte als Textzeilen, unter 1024px untereinander. Basis-Klassen: `.btn-*`, `.card`, `.field`, `.alert`, `.chip`, `.badge-live`, `.page`/`.page-narrow` (1280/760px). Admin-Nav-Labels deutsch (Live-Karte, Sponsoren, Event bearbeiten). `SearchableSelect` nutzt die Tokens und hat `maxWidth: 100%` (kein Überlauf bei 390px). Umgestellt: Landing (kompakter Hero 380px mit „Läufe live verfolgen“ und Akzentlinie, oben 1px-Trennlinie zum Header, inline-SVG einer Laufstrecke mit Start/Ziel als Dekor in `--color-hero-deco`, Event-Karten mit 4px-Akzentbalken links, Select-Card 560px ragt mit `margin-top: -72px` über die Hero-Kante, darunter Event-Karten (`auto-fit, minmax(280px, 1fr)`) als `<Link>` auf dieselbe Route wie der Select; die Select-Optionen tragen dafür zusätzlich `eventname` und `formatted_date` aus derselben `GET /events`-Antwort), UserHome (Hero mit Chips und CTAs, Text-Card + Sidebar mit Live-Card und Sponsoren 2×2, Typografie für den sanitisierten Quill-Text in `.event-text` inkl. `ql-size/font/indent/align`). UserLiveMap: Titel + Live-Badge, Karte und Teilnehmer-Card (ab 1024px nebeneinander, je 520px hoch), darunter Höhenprofil (240/320px). Unter 1024px Karte randlos mit 60vh und Teilnehmerliste als Bottom-Sheet (`position: sticky; bottom: 0`, max. 45vh, einziger Schatten). `GPXMap` rendert den `MapContainer` mit `height: 100%`, die Höhe kommt aus `.livemap-map .map-wrapper` (ohne feste Elternhöhe ist die Karte 0px hoch). `MarkerHandler` (Admin) ebenso: `height: 100%`, Höhe aus `.admin-map .map-wrapper` (60vh, ab 1024px 520px). UserResults/ResultTable: je Gruppe eine Card, Tabelle in `.table-scroll` (`overflow: auto`, max. 70vh, damit `th` sticky bleibt), Zebra/Hover/Rang (erste Spalte) über Tokens, `tabular-nums`, unter 1024px erste Spalte sticky. M/W-/AK-Umschalter als 44px-Pills, Sortierpfeile als lucide-Icons statt Emojis. Admin-Formulare: `.page-narrow` + `.card`, `<label class="field-label">` über jedem Feld, `.form-stack`, `.form-actions` (mobil volle Breite), `.btn-block`; Fehler als `.alert-error`. Umgestellt: AdminLogin (`.page-auth`, 440px), AddEvent, AdminHome (Event-Card mit Datum/Ort, Card „Neuen Admin erstellen“; `adminMessage` als neutrale `.alert`, weil derselbe State Erfolg und Fehler meldet). Umgestellt außerdem: AdminResults (Labels, Format-Hinweis `.field-hint` zum API-Link), AdminSponsors (Upload-Card, Sponsorliste als 2/3-spaltiges Kachel-Grid, ganze Kachel ist Label der Checkbox, ausgewählt = Rand in `--color-primary` per `:has()`), AdminLiveMap (Upload-Card 760px via `.card-narrow`, Marker-Editor-Card bis 1280px, Popup-Löschen als roter Outline-Button). EditText (Card bis 1280px; Editor-Wurzel `.textarea` als Grid `auto minmax(0,1fr)` mit 60vh/min. 360px, ab 1024px 520px, damit die umbrechende Toolbar nicht abgeschnitten wird; keine `ql-*`-Regeln überschrieben), AdminEdit (eine Card pro Bereich, Zeilen `.edit-row-label` uppercase + Wert | Outline-Button, ab 640px nebeneinander; Edit-Modus Input + Speichern/Abbrechen; Sponsor-/Karte-Löschen `.btn-danger`; „Event löschen“ in `.card-danger` mit Rand `#fecaca`). Alle Seiten sind umgestellt, die Legacy-Klassen (`.submit-button`, `.edit-window-button`, `.form-container`, `.admin-title`) sind entfernt.

## Offen
- `UserLiveMap.jsx` ruft öffentliche Routen (`GET /files/livemap` u. a.) über `apiClient` statt raw axios auf, entgegen der Regel unter „Bewusste Entscheidungen“. Aktuell folgenlos, weil diese Routen kein 401 liefern.
- `Header.js`: Der Abmelden-Button nutzt nicht `AuthContext.logout()`, sondern einen eigenen Handler, der nur `token` und `adminid` aus localStorage löscht (`username` u. a. bleiben) und immer nach `/` leitet. Außerdem ruft der Header `/admins/me` selbst per `fetch` auf, zusätzlich zu `validateToken` im `AuthContext` (doppelter Aufruf).
- `GET /auth/validateToken` antwortet bei Auth-Fehlern noch mit 400 (vom Frontend aktuell nicht genutzt).
- Backend speichert Event-Texte (`/files/text`) ungefiltert. Die Anzeige ist im Frontend abgesichert, zusätzliches Sanitizing im Backend bräuchte eine neue Dependency (z. B. `sanitize-html`), nur nach Freigabe.
- `package.json` listet `quill@^2.0.3` direkt, im Code wird es nicht importiert. react-quill 2.0.0 nutzt seine eigene verschachtelte Kopie `quill@1.3.7`.
- `saveIntermediateTimes` (AdminLiveMap) sendet bei jedem Speichern alle Marker, auch bereits gespeicherte (Duplikate). `handleDeleteMarker` (MarkerHandler) entfernt den Marker lokal auch bei fehlgeschlagenem DELETE.
- `UserHome`: Ist genau ein Sponsor sichtbar, verdoppelt die Fetch-Logik ihn (`[s, s]`, Überbleibsel des alten Links/Rechts-Layouts). Im 2×2-Grid erscheint er dadurch zweimal.
- `UserLiveMap`: Zwei Teilnehmer-Suchfelder (Seite und `ParticipantCheckboxes`) filtern nacheinander dieselbe Liste.
- `ElevationChart`: Farben (`#000000`, `#0c67c9` ...) stehen fest in den Chart.js-Optionen, nicht an den Design-Tokens.
- `ResultTable`: Sortieren nur per Mausklick auf `th` (nicht per Tastatur erreichbar). `placement-cell` greift nur bei Spalte `Pl.`, die vorher aus den Daten gelöscht wird; der Rang wird deshalb über die erste Spalte hervorgehoben.
- `AdminResults`: Der State wählt beim Laden die erste Live-Map vor, der Select zeigt aber den Platzhalter (kein `value`). Wer nichts auswählt, lädt still auf die erste Karte hoch.
- Landing-Event-Karten zeigen keinen Ort: `GET /events` liefert nur `idevents`, `eventname`, `formatted_date`. Für den Ort müsste die Query `eventlocation` mitliefern (Backend-Änderung).
- `AdminSponsors.fetchSponsors`: Eine Fehlerantwort wird als Liste behandelt (`.map`-Crash)
- Ownership: `AdminEventAccess`-Check für alle Event-, Map- und Datei-Mutationen, `adminid` aus dem JWT statt aus dem Body, `idlivemap` muss zu `eventid` gehören, `sponsors/updateDisplay` setzt `is_displayed = 1` per ID ohne `eventid`-Filter
- Löschkaskaden nicht transaktional
- `/uploads` liefert `.gpx` als XML aus. Direkt im Browser geöffnet, könnte eingebettetes XHTML-Script laufen. Ein `Content-Security-Policy`- oder `Content-Disposition: attachment`-Header für `/uploads` fehlt.
- Beim Löschen von Livemaps und Sponsoren bleiben die Dateien in `src/uploads` liegen (verwaiste Dateien).
- `AdminLiveMap.handleSubmit` zeigt bei Upload-Fehlern nur eine allgemeine Meldung, nicht die Backend-Meldung.
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