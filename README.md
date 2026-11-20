# EcoTrack — Campus & Local Waste Management Portal

EcoTrack is a modern, student-driven web portal designed for tracking hostel waste pickup schedules, submitting campus cleanliness complaints, tracking ticket resolution in real-time, and managing municipal/campus sanitation fleet operations.

Developed as a 1st-Year Computer Science project by **Ayush Kumar** and team (LPU).

---

## 🌟 Key Features

### 1. Citizen & Student Portal
- **Area & Hostel Selector**: Switch between LPU Boys Hostels, LPU Girls Hostels, Uni-Mall, Law Gate, and Phagwara GT Road.
- **Dynamic Collection Calendar**: Color-coded waste schedule (Organic/Mess waste, Dry Recyclables, E-Waste) dynamically generated from current date.
- **Issue Reporting Hub**:
  - Missed Hostel Pickup report
  - Damaged or Full Bin report
  - Campus Litter / Dumping report
  - Photo preview attachment & live ticket ID generation (`ECO-2026-AREA-XXX`).
- **Live Ticket Tracker**: Search any complaint ticket to view a 4-stage visual progress timeline (Report Logged ➔ Campus Dispatch ➔ Truck Sent ➔ Bins Cleared).
- **Active Fleet Routes**: Live status cards for campus cleaning trucks (TRK-101 to TRK-104).

### 2. Authority & Municipal Command Portal
- **Protected Access**: Tap **Admin Dashboard** in navbar and enter credentials:
  - **User ID**: `admin`
  - **Password**: `admin123`
- **Operations Dashboard**: Real-time KPI metrics, complaints count, and status tabs (All, Due/Pending, In Progress, Resolved).
- **Analytics Charts**: Custom HTML5 Canvas donut chart (Complaints by Category) and 7-day trend chart.
- **Complaint Management**: View citizen details, assign cleaning units, advance workflow steps, and export complaints audit log to CSV.

---

## 🛠️ Technology Stack

- **Frontend**: Semantic HTML5, CSS3 Custom Properties (Flexbox & CSS Grid, Mobile Responsive), Vanilla JavaScript (ES6+).
- **Icons & Typography**: Font Awesome 6 (CDN), Google Fonts (Manrope, DM Sans).
- **Database & Storage**:
  - **Primary**: Supabase Cloud PostgreSQL REST API (real-time shared database across devices).
  - **Fallback**: Browser `LocalStorage` API (offline-resilient client-side storage).
- **Hosting & Deployment**: Vercel Static Web Hosting.

---

## 🚀 How to Run the Project

1. **Live Deployment**: Visit the live website on Vercel:  
   `https://eco-track-pied-psi.vercel.app`
2. **Local Preview**: Simply double-click `index.html` or open it using VS Code Live Server in any modern browser.

---

## 📁 Project Structure

```text
EcoTrack/
├── index.html            # Main single-page application structure
├── CSS/
│   └── style.css         # 12-section modular stylesheet & responsive design
├── JS/
│   └── main.js           # Calendar engine, issue forms, ticket tracker & Supabase integration
├── schema_postgres.sql   # Supabase PostgreSQL tables schema & RLS policies
├── vercel.json           # Vercel deployment configuration
├── favicon.ico / .png    # Browser tab icons
└── README.md             # Project documentation & presentation guide
```
