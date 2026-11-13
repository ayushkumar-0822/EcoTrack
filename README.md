# EcoTrack — Local Waste Collection Coordination & Municipal Service Portal

EcoTrack is a smart, community-driven waste collection coordination and municipal sanitation command web application. It connects citizens and local authorities across **LPU Campus, Law Gate, Phagwara, Jalandhar, and Green Valley** to coordinate pickup schedules, automate collection reminders, report waste/bin issues in real time, and manage fleet dispatch operations.

---

## 🌟 Key Features

### 1. Citizen Portal
- **Location Selector**: Quick area switching across LPU Main Campus, Law Gate Student Hub, Phagwara GT Road, Jalandhar Cantt & Green Valley.
- **Interactive Collection Calendar**: Color-coded waste stream calendar (Organic/Wet Waste, Dry Recyclables, Hazardous/E-Waste) with date filtering and day-before reminder setup.
- **Issue Reporting Hub**:
  - Missed Household Pickup reporting
  - Overflowing or Damaged Public Bin reporting
  - Illegal Dumping & Debris cleanup reporting
  - Real-time photo evidence attachment & GPS/address locator
- **Live Ticket Tracker**: Search any complaint by ticket ID (e.g. `ECO-2026-LPU-101`) to view a 4-stage visual progress timeline (Logged ➔ Triaged ➔ Dispatched ➔ Resolved).
- **Service Telemetry & KPI Cards**: Citywide cleanliness index, on-time collection rate, and recycled tonnage counters.

### 2. Municipal Authority & Incident Command Portal
- **Role Switcher in Navbar**: Click **`[ Citizen ▾ ]`** in the top navbar to instantly toggle between **Citizen Mode** and **Authority / Officer Mode**.
- **Executive Metrics Row**: Live counters for Total Complaints, Due/Pending Triage, Dispatched Trucks, Resolved & Cleaned, and Municipal SLA Resolution Rate.
- **Complaints Tabular View**:
  - Navigation filter tabs: **All Complaints**, **Due / Pending**, **In Progress / Dispatched**, and **Resolved**.
  - Live instant search box (filter by Ref ID, Title, Category, Location).
  - Zone filter dropdown.
  - Interactive table with Ref IDs, category badges, locations, timestamps, urgency indicators, mini progress bars, and status cells.
- **"See Details" Action Dossier**:
  - View full citizen remarks, attached inspection photos, and timestamps.
  - Assign Municipal Sanitation Trucks (e.g. `Phagwara-MC-08`, `LPU-EcoTruck-01`, `MC-Phagwara-04`).
  - Advance workflow stages or mark complaints as **Cleaned & Resolved** with instant live database sync.
- **Export CSV**: One-click export of municipal complaint audit logs to `.csv`.

---

## 🚀 How to Run the Project

### Option A: Direct Browser Preview (Zero Setup)
1. Double-click or open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Brave, Firefox, Safari).
2. The entire platform runs seamlessly using client-side state and offline storage.

### Option B: Full-Stack Mode with Live Python/SQLite Backend (Recommended)
1. Ensure Python 3 is installed on your computer.
2. In the project folder, double-click **`start_server.bat`**  
   *(or run `python server.py` from the terminal)*.
3. Open your browser and navigate to:  
   **`http://localhost:5000`**
4. All tickets, updates, and dispatches will synchronize in real-time with the local `ecotrack.db` SQLite database.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Semantic HTML5, CSS3 Custom Properties (Design System & Glassmorphism), Vanilla JavaScript (ES6+ Modules, async/await).
- **Icons & Typography**: Font Awesome 6, Manrope & DM Sans typography.
- **Backend**: Python 3 standard library HTTP/REST server with SQLite (`ecotrack.db`).
- **Responsive**: 100% responsive across mobile phones, tablets, laptops, and ultra-wide desktops.
- **Accessibility**: WCAG 2.1 AA compliant (ARIA attributes, keyboard navigation, high contrast).

---

## 📁 Project Structure

```text
EcoTrack/
├── index.html            # Main single-page application structure
├── CSS/
│   └── style.css         # Complete design system, theme variables, responsive layout
├── JS/
│   └── main.js           # Client-side controller, modal manager, calendar, authority portal
├── server.py             # Python HTTP server & REST API (SQLite backend)
├── start_server.bat      # 1-click server launch script for Windows
├── ecotrack.db           # SQLite database storing tickets, notifications & fleet routes
├── uploads/              # Storage directory for citizen photo evidence
├── README.md             # Project documentation & setup instructions
└── AGENTS.md             # Developer guidelines & architectural standards
```
