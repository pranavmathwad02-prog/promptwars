"""
ElectEd Full-Stack Python/SQLite Server
========================================
Serves static files and exposes a REST API for voter registration data.

Usage:
    python serve.py

Endpoints:
    GET    /api/voters         — List all registered voters (JSON)
    POST   /api/voters         — Register a new voter (JSON body required)
    DELETE /api/voters/<id>    — Delete a voter record by numeric ID

Static files are served from the current directory on port 8080.
"""

import json
import re
import sqlite3
import os
import sys
import logging
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────────────────────
HOST = '0.0.0.0'
PORT = 8080
DB_FILE = 'elected.db'

# Allowed CORS origins — restrict in production
ALLOWED_ORIGIN = 'http://localhost:8080'

# ── Constants ─────────────────────────────────────────────────────────────────
EMAIL_REGEX = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
MAX_FIELD_LEN = 200
VALID_PARTY_VALUES = {
    'Unaffiliated', 'Democratic Party', 'Republican Party',
    'Libertarian Party', 'Green Party', 'Other'
}

# ── Database Initialisation ───────────────────────────────────────────────────
def init_db():
    """Create the voters table if it does not already exist."""
    try:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS voters (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                fullName        TEXT    NOT NULL,
                email           TEXT    UNIQUE NOT NULL,
                state           TEXT    NOT NULL,
                dob             TEXT    NOT NULL,
                age             INTEGER NOT NULL,
                partyAffiliation TEXT   NOT NULL DEFAULT 'Unaffiliated',
                registeredAt    TEXT    NOT NULL,
                status          TEXT    NOT NULL DEFAULT 'Active'
            )
        ''')
        conn.commit()
        logger.info('Database initialised: %s', DB_FILE)
    except sqlite3.Error as exc:
        logger.critical('Failed to initialise database: %s', exc)
        sys.exit(1)
    finally:
        conn.close()


# ── Input Validation Helpers ──────────────────────────────────────────────────
def validate_voter_payload(data: dict) -> tuple[bool, str]:
    """
    Validates incoming voter registration JSON.
    Returns (is_valid: bool, error_message: str).
    """
    required = ('fullName', 'email', 'state', 'dob', 'age', 'registeredAt')
    for field in required:
        if field not in data:
            return False, f"Missing required field: '{field}'"

    full_name = str(data.get('fullName', '')).strip()
    if len(full_name) < 2 or len(full_name) > MAX_FIELD_LEN:
        return False, 'fullName must be between 2 and 200 characters.'

    email = str(data.get('email', '')).strip().lower()
    if not EMAIL_REGEX.match(email) or len(email) > MAX_FIELD_LEN:
        return False, 'A valid email address is required.'

    try:
        age = int(data['age'])
        if age < 18 or age > 130:
            return False, 'Age must be between 18 and 130.'
    except (ValueError, TypeError):
        return False, 'Age must be a valid integer.'

    state = str(data.get('state', '')).strip()
    if not state or len(state) > 60:
        return False, 'A valid state is required.'

    dob = str(data.get('dob', '')).strip()
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', dob):
        return False, 'Date of birth must be in YYYY-MM-DD format.'

    party = str(data.get('partyAffiliation', 'Unaffiliated')).strip()
    if party not in VALID_PARTY_VALUES:
        return False, f"Invalid party affiliation. Must be one of: {', '.join(VALID_PARTY_VALUES)}"

    return True, ''


# ── Request Handler ───────────────────────────────────────────────────────────
class APIHandler(SimpleHTTPRequestHandler):
    """Handles API routes and delegates static file serving to the base class."""

    # Silence default access log noise — use our logger instead
    def log_message(self, fmt, *args):
        logger.info('%s - %s', self.address_string(), fmt % args)

    def send_json(self, data: dict, status: int = 200) -> None:
        """Serialise `data` as JSON and write a complete HTTP response."""
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Vary', 'Origin')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == '/api/voters':
            self._handle_get_voters()
        else:
            super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == '/api/voters':
            self._handle_post_voter()
        else:
            self.send_json({'success': False, 'error': 'Not Found'}, 404)

    def do_DELETE(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path.startswith('/api/voters/'):
            raw_id = parsed.path.split('/')[-1]
            self._handle_delete_voter(raw_id)
        else:
            self.send_json({'success': False, 'error': 'Not Found'}, 404)

    # ── Route Handlers ────────────────────────────────────────────────────────

    def _handle_get_voters(self) -> None:
        """Return all registered voters ordered by registration date."""
        try:
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT * FROM voters ORDER BY id DESC')
            voters = [dict(row) for row in c.fetchall()]
            self.send_json({'success': True, 'data': voters, 'count': len(voters)})
        except sqlite3.Error as exc:
            logger.error('GET /api/voters failed: %s', exc)
            self.send_json({'success': False, 'error': 'Internal server error.'}, 500)
        finally:
            conn.close()

    def _handle_post_voter(self) -> None:
        """Register a new voter after validating the request body."""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length <= 0 or content_length > 4096:
                self.send_json({'success': False, 'error': 'Invalid request body.'}, 400)
                return

            raw_body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(raw_body)
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json({'success': False, 'error': 'Invalid JSON payload.'}, 400)
            return

        is_valid, error_msg = validate_voter_payload(data)
        if not is_valid:
            self.send_json({'success': False, 'error': error_msg}, 400)
            return

        # Sanitise fields before insertion
        full_name      = str(data['fullName']).strip()
        email          = str(data['email']).strip().lower()
        state          = str(data['state']).strip()
        dob            = str(data['dob']).strip()
        age            = int(data['age'])
        party          = str(data.get('partyAffiliation', 'Unaffiliated')).strip()
        registered_at  = str(data['registeredAt']).strip()

        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('''
                INSERT INTO voters
                    (fullName, email, state, dob, age, partyAffiliation, registeredAt, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (full_name, email, state, dob, age, party, registered_at, 'Active'))
            conn.commit()
            voter_id = c.lastrowid
            logger.info('Voter registered: id=%d email=%s', voter_id, email)
            self.send_json({
                'success': True,
                'data': {
                    'id': voter_id,
                    'fullName': full_name,
                    'email': email,
                    'state': state,
                    'dob': dob,
                    'age': age,
                    'partyAffiliation': party,
                    'registeredAt': registered_at,
                    'status': 'Active'
                },
                'message': 'Registration successful! Saved to database.'
            }, 201)
        except sqlite3.IntegrityError:
            self.send_json({'success': False, 'error': 'This email is already registered.'}, 409)
        except sqlite3.Error as exc:
            logger.error('POST /api/voters DB error: %s', exc)
            self.send_json({'success': False, 'error': 'Internal server error.'}, 500)
        finally:
            conn.close()

    def _handle_delete_voter(self, raw_id: str) -> None:
        """Delete a voter by numeric ID."""
        try:
            voter_id = int(raw_id)  # Prevent SQL injection — must be a plain integer
        except (ValueError, TypeError):
            self.send_json({'success': False, 'error': 'Invalid voter ID.'}, 400)
            return

        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('DELETE FROM voters WHERE id = ?', (voter_id,))
            conn.commit()
            if c.rowcount == 0:
                self.send_json({'success': False, 'error': 'Voter not found.'}, 404)
            else:
                logger.info('Voter deleted: id=%d', voter_id)
                self.send_json({'success': True, 'message': 'Voter deleted from database.'})
        except sqlite3.Error as exc:
            logger.error('DELETE /api/voters/%d DB error: %s', voter_id, exc)
            self.send_json({'success': False, 'error': 'Internal server error.'}, 500)
        finally:
            conn.close()


# ── Threaded HTTP Server ──────────────────────────────────────────────────────
class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Handle each request in a separate thread to avoid blocking."""
    daemon_threads = True
    allow_reuse_address = True


# ── Entry Point ───────────────────────────────────────────────────────────────
if __name__ == '__main__':
    init_db()
    server = ThreadedHTTPServer((HOST, PORT), APIHandler)
    url = f'http://localhost:{PORT}'
    logger.info('ElectEd Server running -> %s', url)
    logger.info('Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info('Server stopped.')
        server.server_close()
