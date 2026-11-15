#!/usr/bin/env python3
"""
EcoTrack Live Backend Server & REST API
Zero external dependencies — Built using Python standard library (http.server + sqlite3).
Serves static frontend assets, REST API, file uploads, and SQLite persistent storage.
"""

import os
import sys
import json
import sqlite3
import mimetypes
import datetime
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

PORT = int(os.environ.get("PORT", 5000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "ecotrack.db")
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

# -------------------------------------------------------------
# Database Setup & Initialization
# -------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Tickets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                location TEXT NOT NULL,
                urgency TEXT DEFAULT 'Standard',
                description TEXT,
                photo_url TEXT,
                status TEXT NOT NULL,
                current_step INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                resolved_at TEXT
            )
        """)

        # Ticket steps table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ticket_steps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                step_num INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                time_str TEXT,
                is_done INTEGER DEFAULT 0,
                FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
            )
        """)

        # Reminders table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT,
                phone TEXT,
                evening INTEGER DEFAULT 1,
                morning INTEGER DEFAULT 1,
                weather INTEGER DEFAULT 1,
                zone TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        """)

        # Notifications table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                zone TEXT,
                time_str TEXT NOT NULL,
                is_unread INTEGER DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Fleet routes table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS fleet_routes (
                id TEXT PRIMARY KEY,
                sector TEXT NOT NULL,
                waste_stream TEXT NOT NULL,
                driver TEXT NOT NULL,
                progress INTEGER NOT NULL,
                status TEXT NOT NULL
            )
        """)

        conn.commit()

        # Seed initial data if tickets are empty
        cursor.execute("SELECT COUNT(*) FROM tickets")
        if cursor.fetchone()[0] == 0:
            seed_initial_data(cursor)
            conn.commit()

def seed_initial_data(cursor):
    # Initial Demo Ticket 1
    t1 = ("ECO-2026-MP-101", "Missed Pickup", "Missed Organic Household Bins", "142 Elm Street, Maple Quarter", "High", "Bins were curbside since 6:30 AM", "", "Resolved", 4, "Nov 11, 2026 • 08:15 AM", "Nov 11, 2026 • 11:42 AM")
    cursor.execute("INSERT INTO tickets VALUES (?,?,?,?,?,?,?,?,?,?,?)", t1)
    steps_t1 = [
        ("ECO-2026-MP-101", 1, "Report Logged", "Citizen submitted curbside missed pickup ticket", "08:15 AM", 1),
        ("ECO-2026-MP-101", 2, "Pending Inspection", "Sanitation supervisor verified route miss", "08:40 AM", 1),
        ("ECO-2026-MP-101", 3, "Recovery Truck Sent", "TRK-101 rerouted for recovery pickup", "09:55 AM", 1),
        ("ECO-2026-MP-101", 4, "Pickup Completed", "Bins emptied. Resident confirmed resolution", "11:42 AM", 1)
    ]
    cursor.executemany("INSERT INTO ticket_steps (ticket_id, step_num, name, description, time_str, is_done) VALUES (?,?,?,?,?,?)", steps_t1)

    # Initial Demo Ticket 2
    t2 = ("ECO-2026-BN-204", "Bin Issue", "Damaged Wheels & Split Lid", "88 North Ridge Blvd, Bin #BN-892", "Standard", "Lid broken during storm, wheel axle detached", "", "In Progress", 3, "Today at 07:30 AM", "Est. Today 03:30 PM")
    cursor.execute("INSERT INTO tickets VALUES (?,?,?,?,?,?,?,?,?,?,?)", t2)
    steps_t2 = [
        ("ECO-2026-BN-204", 1, "Report Logged", "Photo and bin serial received", "07:30 AM", 1),
        ("ECO-2026-BN-204", 2, "Replacement Order", "240L Heavy-duty replacement bin allocated from depot", "08:10 AM", 1),
        ("ECO-2026-BN-204", 3, "En Route for Delivery", "Depot Maintenance Truck #02 dispatched", "10:15 AM", 1),
        ("ECO-2026-BN-204", 4, "Installation & Exchange", "Old bin retrieved & new bin placed curbside", "Pending", 0)
    ]
    cursor.executemany("INSERT INTO ticket_steps (ticket_id, step_num, name, description, time_str, is_done) VALUES (?,?,?,?,?,?)", steps_t2)

    # Initial Demo Ticket 3
    t3 = ("ECO-2026-ID-308", "Illegal Dumping", "Construction Debris & Dry Dumping", "Empty lot behind Green Valley Central Park", "High", "Approx 3 tons drywall, bricks and timber dumped overnight", "", "Dispatched", 2, "Today at 09:00 AM", "Inspection within 2 hours")
    cursor.execute("INSERT INTO tickets VALUES (?,?,?,?,?,?,?,?,?,?,?)", t3)
    steps_t3 = [
        ("ECO-2026-ID-308", 1, "Report Logged", "Citizen reported ~3 tons dry debris", "09:00 AM", 1),
        ("ECO-2026-ID-308", 2, "Officer Dispatched", "Sanitation Inspector assigned for assessment", "09:25 AM", 1),
        ("ECO-2026-ID-308", 3, "Clearing Crew", "Heavy waste machinery en route", "Pending", 0),
        ("ECO-2026-ID-308", 4, "Site Cleared", "Sanitized and certified clean", "Pending", 0)
    ]
    cursor.executemany("INSERT INTO ticket_steps (ticket_id, step_num, name, description, time_str, is_done) VALUES (?,?,?,?,?,?)", steps_t3)

    # Initial Notifications
    notifs = [
        ("Route #4 Completed", "Organic waste pickup on Maple St finished early.", "green", "Zone A", "22 mins ago", 1),
        ("Upcoming Pickup", "Dry Recyclables collection tomorrow morning at 08:00 AM.", "orange", "Reminder", "1 hr ago", 1),
        ("Weather Advisory", "Normal collection schedules unaffected by light rain.", "blue", "All Zones", "Yesterday", 0)
    ]
    cursor.executemany("INSERT INTO notifications (title, message, type, zone, time_str, is_unread) VALUES (?,?,?,?,?,?)", notifs)

    # Initial Fleet Routes
    fleet = [
        ("Truck-04", "Green Valley (Sector 1–4)", "Organic Wet", "R. Patel & Team", 92, "On Route"),
        ("Truck-09", "Green Valley (Sector 5–8)", "Recyclables", "M. Jenkins", 78, "On Route"),
        ("Truck-12", "North Ridge (Main Blvd)", "Organic Wet", "S. Kumar & Team", 100, "Completed"),
        ("Truck-02", "Downtown Commercial", "Cardboard & Dry", "A. Gomez", 64, "On Route")
    ]
    cursor.executemany("INSERT INTO fleet_routes VALUES (?,?,?,?,?,?)", fleet)


# -------------------------------------------------------------
# HTTP Request Handler
# -------------------------------------------------------------
class EcoTrackHandler(BaseHTTPRequestHandler):

    def send_json(self, data, status=200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # REST API Routes
        if path == "/api/status":
            return self.send_json({"status": "healthy", "service": "EcoTrack Live Server", "time": datetime.datetime.now().isoformat()})

        elif path == "/api/tickets":
            query = parse_qs(parsed.query).get("q", [""])[0].strip()
            with get_db() as conn:
                cursor = conn.cursor()
                if query:
                    q_like = f"%{query}%"
                    cursor.execute("SELECT * FROM tickets WHERE location LIKE ? OR title LIKE ? OR id LIKE ? OR category LIKE ? ORDER BY rowid DESC", (q_like, q_like, q_like, q_like))
                else:
                    cursor.execute("SELECT * FROM tickets ORDER BY rowid DESC")
                tickets = [dict(row) for row in cursor.fetchall()]
                # Attach steps to each ticket
                for t in tickets:
                    cursor.execute("SELECT step_num, name, description, time_str, is_done FROM ticket_steps WHERE ticket_id = ? ORDER BY step_num", (t["id"],))
                    t["steps"] = [dict(s) for s in cursor.fetchall()]
                return self.send_json(tickets)

        elif path.startswith("/api/tickets/"):
            ticket_id = path.replace("/api/tickets/", "").strip().upper()
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,))
                row = cursor.fetchone()
                if not row:
                    return self.send_json({"error": "Ticket not found"}, status=404)
                ticket = dict(row)
                cursor.execute("SELECT step_num, name, description, time_str, is_done FROM ticket_steps WHERE ticket_id = ? ORDER BY step_num", (ticket_id,))
                ticket["steps"] = [dict(s) for s in cursor.fetchall()]
                return self.send_json(ticket)

        elif path == "/api/dashboard":
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM tickets")
                total_tickets = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM tickets WHERE status = 'Resolved'")
                resolved_tickets = cursor.fetchone()[0]
                resolution_rate = round((resolved_tickets / max(1, total_tickets)) * 100, 1)

                cursor.execute("SELECT * FROM fleet_routes")
                fleet = [dict(r) for r in cursor.fetchall()]

                return self.send_json({
                    "total_tickets": total_tickets,
                    "resolved_tickets": resolved_tickets,
                    "resolution_rate": f"{resolution_rate}%",
                    "route_completion": "84%",
                    "active_trucks": "14 / 16",
                    "cleanliness_score": "98 / 100",
                    "fleet": fleet
                })

        elif path == "/api/notifications":
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM notifications ORDER BY id DESC LIMIT 10")
                notifs = [dict(r) for r in cursor.fetchall()]
                return self.send_json(notifs)

        # Static File Serving
        self.serve_static(path)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(length)

        if path == "/api/tickets":
            try:
                data = json.loads(post_body.decode("utf-8"))
            except Exception as e:
                return self.send_json({"error": "Invalid JSON"}, status=400)

            category = data.get("category", "General Issue")
            title = data.get("title", f"Report: {category}")
            location = data.get("location", "Unknown Location")
            urgency = data.get("urgency", "Standard")
            description = data.get("description", "")
            photo_url = data.get("photo_url", "")

            # Generate categorized ID
            prefix = "MP" if "Missed" in category else ("BN" if "Bin" in category else "ID")
            ticket_id = f"ECO-2026-{prefix}-{int(datetime.datetime.now().timestamp() % 10000):04d}"
            now_str = datetime.datetime.now().strftime("Today at %I:%M %p")

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO tickets (id, category, title, location, urgency, description, photo_url, status, current_step, created_at, resolved_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', 2, ?, 'Under Review')
                """, (ticket_id, category, title, location, urgency, description, photo_url, now_str))

                # Create 4 steps
                steps = [
                    (ticket_id, 1, "Report Logged", f"Citizen reported: {title}", now_str, 1),
                    (ticket_id, 2, "Pending Inspection", "Assigned to area sanitation coordinator", "Active Now", 1),
                    (ticket_id, 3, "Crew Dispatched", "Recovery vehicle / repair unit scheduled", "Pending", 0),
                    (ticket_id, 4, "Resolved", "Final verification and sign-off", "Pending", 0)
                ]
                cursor.executemany("INSERT INTO ticket_steps (ticket_id, step_num, name, description, time_str, is_done) VALUES (?,?,?,?,?,?)", steps)

                # Create live notification
                cursor.execute("""
                    INSERT INTO notifications (title, message, type, zone, time_str, is_unread)
                    VALUES (?, ?, 'orange', ?, 'Just now', 1)
                """, (f"New Ticket: {ticket_id}", f"{category} reported at {location}", location))

                conn.commit()

            return self.send_json({"success": True, "ticket_id": ticket_id, "message": "Ticket created and stored in live database"}, status=201)

        elif path.startswith("/api/tickets/") and path.endswith("/advance"):
            # Advance ticket workflow step
            ticket_id = path.replace("/api/tickets/", "").replace("/advance", "").strip().upper()
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT current_step, status FROM tickets WHERE id = ?", (ticket_id,))
                row = cursor.fetchone()
                if not row:
                    return self.send_json({"error": "Ticket not found"}, status=404)

                current_step = row[0]
                next_step = min(4, current_step + 1)
                new_status = "Resolved" if next_step == 4 else ("Dispatched" if next_step == 3 else "Pending")
                now_str = datetime.datetime.now().strftime("%I:%M %p")

                cursor.execute("UPDATE tickets SET current_step = ?, status = ?, resolved_at = ? WHERE id = ?", 
                               (next_step, new_status, f"Completed at {now_str}" if next_step == 4 else "In Progress", ticket_id))
                cursor.execute("UPDATE ticket_steps SET is_done = 1, time_str = ? WHERE ticket_id = ? AND step_num = ?", 
                               (now_str, ticket_id, current_step))

                cursor.execute("""
                    INSERT INTO notifications (title, message, type, zone, time_str, is_unread)
                    VALUES (?, ?, 'green', 'Update', 'Just now', 1)
                """, (f"Update: {ticket_id}", f"Status updated to {new_status} at {now_str}"))

                conn.commit()

            return self.send_json({"success": True, "ticket_id": ticket_id, "new_step": next_step, "status": new_status})

        elif path.startswith("/api/tickets/") and path.endswith("/update"):
            ticket_id = path.replace("/api/tickets/", "").replace("/update", "").strip().upper()
            try:
                data = json.loads(post_body.decode("utf-8"))
            except Exception:
                data = {}
            new_status = data.get("status")
            now_str = datetime.datetime.now().strftime("%I:%M %p")
            with get_db() as conn:
                cursor = conn.cursor()
                if new_status == "Resolved":
                    cursor.execute("UPDATE tickets SET status = 'Resolved', current_step = 4, resolved_at = ? WHERE id = ?", (f"Completed at {now_str}", ticket_id))
                    cursor.execute("UPDATE ticket_steps SET is_done = 1 WHERE ticket_id = ?", (ticket_id,))
                elif new_status == "Dispatched":
                    cursor.execute("UPDATE tickets SET status = 'Dispatched', current_step = 3 WHERE id = ?", (ticket_id,))
                    cursor.execute("UPDATE ticket_steps SET is_done = 1 WHERE ticket_id = ? AND step_num <= 3", (ticket_id,))
                elif new_status == "Pending":
                    cursor.execute("UPDATE tickets SET status = 'Pending', current_step = 2 WHERE id = ?", (ticket_id,))
                    cursor.execute("UPDATE ticket_steps SET is_done = 1 WHERE ticket_id = ? AND step_num <= 2", (ticket_id,))

                cursor.execute("""
                    INSERT INTO notifications (title, message, type, zone, time_str, is_unread)
                    VALUES (?, ?, 'green', 'Authority', 'Just now', 1)
                """, (f"Authority Action: {ticket_id}", f"Officer set status to {new_status}"))
                conn.commit()
            return self.send_json({"success": True, "ticket_id": ticket_id, "status": new_status})

        elif path == "/api/reminders":
            try:
                data = json.loads(post_body.decode("utf-8"))
            except Exception:
                return self.send_json({"error": "Invalid JSON"}, status=400)

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO reminders (email, phone, evening, morning, weather, zone, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    data.get("email"),
                    data.get("phone"),
                    1 if data.get("evening") else 0,
                    1 if data.get("morning") else 0,
                    1 if data.get("weather") else 0,
                    data.get("zone", "zone-green-valley"),
                    datetime.datetime.now().isoformat()
                ))
                conn.commit()

            return self.send_json({"success": True, "message": "Reminder preferences saved to database."})

        elif path == "/api/upload":
            # Save raw base64 or multipart image
            try:
                data = json.loads(post_body.decode("utf-8"))
                filename = f"img_{int(datetime.datetime.now().timestamp())}.png"
                filepath = os.path.join(UPLOAD_DIR, filename)
                
                # Base64 payload
                import base64
                img_data = data.get("image", "")
                if "," in img_data:
                    img_data = img_data.split(",", 1)[1]
                
                with open(filepath, "wb") as f:
                    f.write(base64.b64decode(img_data))

                return self.send_json({"success": True, "url": f"/uploads/{filename}"})
            except Exception as e:
                return self.send_json({"error": str(e)}, status=400)

        self.send_json({"error": "Endpoint not found"}, status=404)

    def serve_static(self, path):
        if path == "/" or path == "":
            path = "/index.html"

        # Sanitize path to prevent directory traversal
        rel_path = path.lstrip("/")
        full_path = os.path.normpath(os.path.join(BASE_DIR, rel_path))

        if not full_path.startswith(BASE_DIR) or not os.path.exists(full_path) or os.path.isdir(full_path):
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"404 Not Found")
            return

        mime_type, _ = mimetypes.guess_type(full_path)
        if not mime_type:
            mime_type = "application/octet-stream"

        try:
            with open(full_path, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime_type)
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(str(e).encode("utf-8"))


def run():
    init_db()
    server_address = ("0.0.0.0", PORT)
    httpd = ThreadingHTTPServer(server_address, EcoTrackHandler)
    print(f"==================================================")
    print(f"  EcoTrack Live Server Running on http://localhost:{PORT}")
    print(f"  Connected to persistent SQLite database: {DB_PATH}")
    print(f"  REST API Endpoints active at http://localhost:{PORT}/api/*")
    print(f"==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()

if __name__ == "__main__":
    run()
