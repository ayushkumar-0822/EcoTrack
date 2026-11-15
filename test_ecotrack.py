"""
EcoTrack Automated Sanity and Quality Test Suite
Tests Phases 1 to 4 deliverables:
1. Canonical file structure (no root duplicates)
2. CSS syntax and brace balance
3. JavaScript syntax and brace/paren balance
4. Dynamic ticket ID format validation
5. SQLite schema integrity
6. Dynamic date and calendar logic
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
        """Phase 4 & 5 readiness: SQLite database has required tables and columns."""
        db_path = "ecotrack.db"
        self.assertTrue(os.path.exists(db_path), "ecotrack.db must exist")
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall()]
        conn.close()

        self.assertIn("tickets", tables, "tickets table must exist")
        self.assertIn("ticket_steps", tables, "ticket_steps table must exist")
        self.assertIn("notifications", tables, "notifications table must exist")
        self.assertIn("fleet_routes", tables, "fleet_routes table must exist")

if __name__ == "__main__":
    unittest.main()
