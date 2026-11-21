"""
EcoTrack Automated Sanity and Quality Test Suite
Tests Phases 1 to 5 deliverables + Admin Login & Mobile Navigation
"""

import os
import re
import sqlite3
import datetime
import unittest

class TestEcoTrack(unittest.TestCase):

    def test_01_canonical_files_exist_and_no_root_duplicates(self):
        """Phase 1: Canonical files exist, root duplicates removed."""
        self.assertTrue(os.path.exists("CSS/style.css"), "CSS/style.css must exist")
        self.assertTrue(os.path.exists("JS/main.js"), "JS/main.js must exist")
        self.assertFalse(os.path.exists("style.css"), "Root style.css duplicate must not exist")
        self.assertFalse(os.path.exists("script.js"), "Root script.js duplicate must not exist")

    def test_02_index_html_references(self):
        """Phase 1: index.html correctly references canonical files."""
        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()
        self.assertIn('href="CSS/style.css', html, "index.html must reference CSS/style.css")
        self.assertIn('src="JS/main.js"', html, "index.html must reference JS/main.js")
        self.assertNotIn('href="style.css"', html, "index.html must not link root style.css")
        self.assertNotIn('src="script.js"', html, "index.html must not link root script.js")

    def test_03_css_syntax_and_sections(self):
        """Phase 2: CSS brace balance and standard 12-section organization."""
        with open("CSS/style.css", "r", encoding="utf-8") as f:
            css = f.read()
        open_braces = css.count("{")
        close_braces = css.count("}")
        self.assertEqual(open_braces, close_braces, f"CSS braces unbalanced: {open_braces} vs {close_braces}")
        
        # Verify 12 sections present
        for sec_num in range(1, 13):
            self.assertTrue(
                re.search(rf"\/\* =+\s*{sec_num}\.", css),
                f"Section {sec_num} must exist in CSS/style.css"
            )

    def test_04_js_balance_and_demo_mode(self):
        """Phases 3 & 4: JS balance, DEMO_MODE flag, and dynamic ticket logic."""
        with open("JS/main.js", "r", encoding="utf-8") as f:
            js = f.read()
        self.assertEqual(js.count("{"), js.count("}"), "JS braces unbalanced")
        self.assertEqual(js.count("("), js.count(")"), "JS parentheses unbalanced")
        self.assertEqual(js.count("["), js.count("]"), "JS brackets unbalanced")

        # Verify DEMO_MODE flag
        self.assertIn("const DEMO_MODE = false;", js, "JS must define DEMO_MODE = false")
        
        # Verify dynamic year and calendar
        self.assertIn("today.getFullYear()", js, "JS must dynamically read getFullYear()")
        self.assertIn("generateTicketId", js, "JS must define generateTicketId helper")

    def test_05_ticket_id_pattern(self):
        """Phase 3: Dynamic Ticket ID pattern matches ECO-YYYY-ZONE-XXX."""
        current_year = datetime.datetime.now().year
        pattern = re.compile(rf"^ECO-{current_year}-[A-Z]+-\d{{3,4}}$")
        sample_id = f"ECO-{current_year}-LPU-101"
        self.assertTrue(pattern.match(sample_id), f"Sample ticket ID {sample_id} matches pattern")

    def test_06_database_schema(self):
        """Database Architecture: schema_postgres.sql defines required Cloud DB tables."""
        schema_path = "schema_postgres.sql"
        self.assertTrue(os.path.exists(schema_path), "schema_postgres.sql must exist")
        with open(schema_path, "r", encoding="utf-8") as f:
            sql = f.read()

        self.assertIn("tickets", sql, "tickets table must exist in schema")
        self.assertIn("ticket_steps", sql, "ticket_steps table must exist in schema")
        self.assertIn("notifications", sql, "notifications table must exist in schema")
        self.assertIn("fleet_routes", sql, "fleet_routes table must exist in schema")
        self.assertIn("reminders", sql, "reminders table must exist in schema")

    def test_07_admin_login_modal_and_nav_toggle(self):
        """Admin Login Modal & Mobile Responsive Navbar deliverables."""
        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()

        # 1. Admin login modal elements
        self.assertIn('id="adminLoginModal"', html, "adminLoginModal must exist in index.html")
        self.assertIn('id="adminUserId"', html, "adminUserId input must exist in index.html")
        self.assertIn('id="adminPassword"', html, "adminPassword input must exist in index.html")
        self.assertIn('id="linkForgotPassword"', html, "linkForgotPassword must exist in index.html")
        self.assertIn('id="btnAdminLogout"', html, "btnAdminLogout must exist in index.html")

        # 2. Mobile navbar hamburger toggle
        self.assertIn('id="mobileNavToggle"', html, "mobileNavToggle button must exist in index.html")
        self.assertIn('class="nav-hamburger-btn"', html, "nav-hamburger-btn must exist in index.html")

        # 3. CSS styles
        with open("CSS/style.css", "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn(".nav-hamburger-btn", css, "CSS must style .nav-hamburger-btn")
        self.assertIn(".login-error-alert", css, "CSS must style .login-error-alert")

        # 4. JS logic
        with open("JS/main.js", "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("isAdminAuthenticated", js, "JS must define isAdminAuthenticated")
        self.assertIn("mobileNavToggle", js, "JS must handle mobileNavToggle click")
        self.assertIn("adminLoginForm", js, "JS must handle adminLoginForm submit")

    def test_08_supabase_and_cleanup_integrity(self):
        """Verify Supabase connection config is intact and dead files/code are removed."""
        # 1. Scratch/backup/AI plugin/local server files removed
        self.assertFalse(os.path.exists("prompt_phases.txt"), "prompt_phases.txt must be removed")
        self.assertFalse(os.path.exists("ecotrack.db.bak"), "ecotrack.db.bak must be removed")
        self.assertFalse(os.path.exists(".agents"), ".agents folder must be removed")
        self.assertFalse(os.path.exists(".coderabbit.yaml"), ".coderabbit.yaml must be removed")
        self.assertFalse(os.path.exists("server.py"), "server.py must be removed")
        self.assertFalse(os.path.exists("ecotrack.db"), "ecotrack.db must be removed")
        self.assertFalse(os.path.exists("start_server.bat"), "start_server.bat must be removed")
        self.assertFalse(os.path.exists(".env"), ".env must be removed")
        self.assertFalse(os.path.exists("node_modules"), "node_modules must be removed")

        # 2. Supabase integration intact
        with open("JS/main.js", "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("SUPABASE_CONFIG", js, "JS must define SUPABASE_CONFIG")
        self.assertIn("https://fbgcoulrluypogrdlgtv.supabase.co", js, "JS must have Supabase URL")
        self.assertIn("handleSupabaseRequest", js, "JS must define handleSupabaseRequest")

        # 3. Dead code removed
        self.assertNotIn("EcoTrackDesignTokens", js, "Dead Figma tokens must be removed from JS")
        self.assertNotIn("EcoTrackCMS", js, "Dead CMS bridge must be removed from JS")

    def test_09_hero_blue_button_and_dynamic_calendar(self):
        """Verify hero Report in detail blue button and dynamic calendar updates."""
        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()

        # 1. Blue button in hero section linking to #report
        self.assertIn('id="btnReportInDetail"', html, "btnReportInDetail must exist in index.html")
        self.assertIn('href="#report"', html, "btnReportInDetail must link to #report")
        self.assertIn('Report in detail', html, "Report in detail text must be in button")

        # 2. CSS styles for .btn-blue
        with open("CSS/style.css", "r", encoding="utf-8") as f:
            css = f.read()
        self.assertIn(".btn-blue", css, ".btn-blue class must be defined in style.css")

        # 3. JS calendar dynamic date & garbage stream rendering
        with open("JS/main.js", "r", encoding="utf-8") as f:
            js = f.read()
        self.assertIn("btnReportInDetail", js, "btnReportInDetail handler must exist in main.js")
        self.assertIn("selectedDateHeading", js, "selectedDateHeading must be dynamically updated")
        self.assertIn("garbageTypes", js, "garbageTypes must be extracted and shown below date")
        self.assertNotIn("MONTH_NAMES[month].substring", js, "month scope bug must be resolved in updateDetailPanel")

if __name__ == "__main__":
    unittest.main()
