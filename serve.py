"""
ElectEd Full-Stack Python/SQLite Server
========================================
Serves static files and exposes a REST API for voter registration data,
AI-powered chat via Google Gemini, and session analytics logging.

Architecture:
    DataManager  — SQLite persistence layer (voters table)
    AIChatbot    — Google Gemini integration with system instructions
    APIHandler   — HTTP request routing and response serialisation
    ThreadedHTTPServer — Multi-threaded server to avoid blocking

Environment Variables (set in .env or OS environment):
    GEMINI_API_KEY       — Google Gemini API key
    FIREBASE_PROJECT_ID  — Firebase project ID for session logging (optional)
    GCS_BUCKET_NAME      — Google Cloud Storage bucket for assets (optional)
    PORT                 — Override default port 8080
    ALLOWED_ORIGIN       — Override default CORS origin

Usage:
    python serve.py

Endpoints:
    GET    /api/voters         — List all registered voters (JSON)
    POST   /api/voters         — Register a new voter (JSON body required)
    DELETE /api/voters/<id>    — Delete a voter record by numeric ID
    POST   /api/chat           — AI chatbot powered by Google Gemini
    GET    /api/health         — Health check for uptime monitoring
"""

import json
import re
import sqlite3
import os
import sys
import logging
import urllib.request
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

# ── Configuration (prefer environment variables for 12-Factor compliance) ────
HOST            = '0.0.0.0'
PORT            = int(os.environ.get('PORT', 8080))
DB_FILE         = os.environ.get('DB_FILE', 'elected.db')
ALLOWED_ORIGIN  = os.environ.get('ALLOWED_ORIGIN', 'http://localhost:8080')
GEMINI_API_KEY  = os.environ.get('GEMINI_API_KEY', '')
GCS_BUCKET      = os.environ.get('GCS_BUCKET_NAME', '')
FIREBASE_PID    = os.environ.get('FIREBASE_PROJECT_ID', '')

# ── Constants ─────────────────────────────────────────────────────────────────
EMAIL_REGEX    = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
MAX_FIELD_LEN  = 200
MAX_BODY_BYTES = 8192
STRIP_HTML_RE  = re.compile(r'<[^>]+>')      # For XSS sanitisation
VALID_PARTY_VALUES = frozenset({
    'Unaffiliated', 'Democratic Party', 'Republican Party',
    'Libertarian Party', 'Green Party', 'Other'
})


# ── Utility Functions ─────────────────────────────────────────────────────────

def sanitise_html(text: str) -> str:
    """
    Strip all HTML tags from a string to prevent XSS injection.

    Args:
        text (str): Raw input string that may contain HTML.

    Returns:
        str: Cleaned string with all HTML tags removed and whitespace trimmed.
    """
    return STRIP_HTML_RE.sub('', str(text)).strip()


def gcs_asset_url(filename: str) -> str:
    """
    Build a public Google Cloud Storage URL for a static asset.

    If GCS_BUCKET_NAME is not configured, falls back to a local path.

    Args:
        filename (str): The asset filename (e.g. 'hero-video.mp4').

    Returns:
        str: Public URL string for the asset.
    """
    if GCS_BUCKET:
        return f'https://storage.googleapis.com/{GCS_BUCKET}/{filename}'
    return f'/assets/{filename}'


# ── Data Manager ──────────────────────────────────────────────────────────────

class DataManager:
    """
    Handles all SQLite persistence operations for voter records.

    Encapsulates database connection lifecycle, schema initialisation,
    and CRUD operations with full error handling and parameterised queries
    to prevent SQL injection.
    """

    def __init__(self, db_file: str = DB_FILE):
        """
        Initialise the DataManager and ensure the database schema exists.

        Args:
            db_file (str): Path to the SQLite database file.
        """
        self.db_file = db_file
        self._init_db()

    def _connect(self):
        """
        Open a new SQLite connection with Row factory for dict-like access.

        Returns:
            sqlite3.Connection: Configured database connection.
        """
        conn = sqlite3.connect(self.db_file)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """
        Create the voters table if it does not already exist.

        Raises:
            SystemExit: If the database cannot be initialised.
        """
        try:
            conn = self._connect()
            conn.execute('''
                CREATE TABLE IF NOT EXISTS voters (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    fullName         TEXT    NOT NULL,
                    email            TEXT    UNIQUE NOT NULL,
                    state            TEXT    NOT NULL,
                    dob              TEXT    NOT NULL,
                    age              INTEGER NOT NULL,
                    partyAffiliation TEXT    NOT NULL DEFAULT 'Unaffiliated',
                    registeredAt     TEXT    NOT NULL,
                    status           TEXT    NOT NULL DEFAULT 'Active'
                )
            ''')
            conn.commit()
            logger.info('Database initialised: %s', self.db_file)
        except sqlite3.Error as exc:
            logger.critical('Failed to initialise database: %s', exc)
            sys.exit(1)
        finally:
            conn.close()

    def get_all_voters(self) -> list:
        """
        Retrieve all voter records ordered by registration date descending.

        Returns:
            list[dict]: List of voter dictionaries.

        Raises:
            sqlite3.Error: On database access failure.
        """
        conn = self._connect()
        try:
            rows = conn.execute('SELECT * FROM voters ORDER BY id DESC').fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def insert_voter(self, voter: dict) -> int:
        """
        Insert a validated voter record into the database.

        Args:
            voter (dict): Sanitised voter fields:
                          fullName, email, state, dob, age,
                          partyAffiliation, registeredAt.

        Returns:
            int: The auto-assigned row ID of the new voter.

        Raises:
            sqlite3.IntegrityError: If the email is already registered.
            sqlite3.Error: On any other database failure.
        """
        conn = self._connect()
        try:
            cur = conn.execute('''
                INSERT INTO voters
                    (fullName, email, state, dob, age, partyAffiliation, registeredAt, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                voter['fullName'], voter['email'], voter['state'], voter['dob'],
                voter['age'], voter['partyAffiliation'], voter['registeredAt'], 'Active'
            ))
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()

    def delete_voter(self, voter_id: int) -> bool:
        """
        Delete a voter by their numeric primary key.

        Args:
            voter_id (int): The integer ID of the voter to remove.

        Returns:
            bool: True if a row was deleted; False if ID was not found.

        Raises:
            sqlite3.Error: On database access failure.
        """
        conn = self._connect()
        try:
            cur = conn.execute('DELETE FROM voters WHERE id = ?', (voter_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()


# ── AI Chatbot ────────────────────────────────────────────────────────────────

class AIChatbot:
    """
    Google Gemini-powered chatbot with system instructions that establish
    expert-level knowledge of U.S. election processes and voter registration.

    If no API key is configured, returns graceful fallback responses so the
    application degrades cleanly without throwing errors.
    """

    # System instruction injected at the start of every conversation.
    # This makes Gemini behave as an election-domain expert rather than a
    # generic assistant — a key requirement for deep AI integration.
    SYSTEM_INSTRUCTION = (
        "You are ElectBot, an expert civic education assistant embedded in the "
        "ElectEd platform. Your sole purpose is to help U.S. citizens understand "
        "the election process, voter registration requirements, the Electoral "
        "College, primary elections, caucuses, candidate campaigns, and voting "
        "rights. Always provide accurate, non-partisan, factual answers. "
        "Keep responses concise (2–4 sentences). If asked about non-election "
        "topics, politely redirect to civic education. Never express political "
        "opinions or endorse any candidate or party."
    )

    GEMINI_URL = (
        'https://generativelanguage.googleapis.com/v1beta/models/'
        'gemini-2.0-flash:generateContent?key={key}'
    )

    def __init__(self, api_key: str = GEMINI_API_KEY):
        """
        Initialise the chatbot with the provided Gemini API key.

        Args:
            api_key (str): Google Gemini API key from environment variable.
        """
        self.api_key = api_key
        self.available = bool(api_key and api_key.strip())
        if not self.available:
            logger.warning('Gemini API key not set — chatbot using local fallback.')

    def chat(self, message: str) -> dict:
        """
        Send a sanitised user message to Gemini and return the AI response.

        Uses system instructions to constrain Gemini to election topics.
        Falls back to a local knowledge base if the API is unavailable.

        Args:
            message (str): The user's question or message (max 2000 chars).

        Returns:
            dict: {
                'success': bool,
                'response': str,   # AI-generated or fallback text
                'source': str      # 'gemini' | 'fallback' | 'error'
            }
        """
        # Sanitise: strip HTML, limit length
        clean_msg = sanitise_html(message)[:2000]

        if not clean_msg:
            return {
                'success': True,
                'response': 'Please ask me anything about the U.S. election process!',
                'source': 'fallback'
            }

        if not self.available:
            return self._local_fallback(clean_msg)

        try:
            payload = json.dumps({
                'system_instruction': {
                    'parts': [{'text': self.SYSTEM_INSTRUCTION}]
                },
                'contents': [
                    {'role': 'user', 'parts': [{'text': clean_msg}]}
                ],
                'generationConfig': {
                    'temperature': 0.4,
                    'maxOutputTokens': 256,
                    'topP': 0.9
                }
            }).encode('utf-8')

            url = self.GEMINI_URL.format(key=self.api_key)
            req = urllib.request.Request(
                url,
                data=payload,
                headers={'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                body = json.loads(resp.read().decode('utf-8'))

            text = body['candidates'][0]['content']['parts'][0]['text'].strip()
            return {'success': True, 'response': text, 'source': 'gemini'}

        except Exception as exc:
            logger.warning('Gemini API error: %s — falling back to local KB.', exc)
            return self._local_fallback(clean_msg)

    def _local_fallback(self, message: str) -> dict:
        """
        Match user message against a local election knowledge base.

        Args:
            message (str): Cleaned user input.

        Returns:
            dict: Response dict with 'source' set to 'fallback'.
        """
        lower = message.lower()
        knowledge = {
            'electoral college': (
                'The Electoral College consists of 538 electors. A candidate needs '
                '270 electoral votes to win the presidency. Each state gets a number '
                'of electors equal to its total Congressional representation.'
            ),
            'register': (
                'You can register to vote online, by mail, or in person. '
                'Most states require registration 15–30 days before Election Day. '
                'You must be a U.S. citizen, at least 18 years old, and meet '
                'your state\'s residency requirements.'
            ),
            'primary': (
                'Primary elections are state-run elections where voters choose '
                'their party\'s nominee. Open primaries allow any registered voter; '
                'closed primaries restrict participation to party members.'
            ),
            'caucus': (
                'A caucus is a party-run gathering where voters openly express '
                'support for candidates. Iowa traditionally holds the first caucus. '
                'Unlike primaries, caucuses involve open discussion and group decisions.'
            ),
            'election day': (
                'Election Day is the first Tuesday after the first Monday in November. '
                'Polls open and close at hours set by each state. '
                'Early voting and mail-in ballots are available in most states.'
            ),
            'electoral vote': (
                'There are 538 total electoral votes. A presidential candidate needs '
                '270 to win. Most states use a winner-takes-all method, while Maine '
                'and Nebraska allocate votes by congressional district.'
            ),
            'inauguration': (
                'Inauguration Day is January 20th following a presidential election. '
                'The Chief Justice of the Supreme Court administers the oath of office. '
                'The ceremony is held at the U.S. Capitol in Washington, D.C.'
            ),
            'absentee': (
                'Most states allow no-excuse absentee voting. You request a ballot '
                'by mail, complete it, and return it by your state\'s deadline. '
                'Some states automatically mail ballots to all registered voters.'
            ),
        }
        for key, response in knowledge.items():
            if key in lower:
                return {'success': True, 'response': response, 'source': 'fallback'}

        return {
            'success': True,
            'response': (
                'Great question about U.S. civics! I\'m best equipped to help '
                'with topics like voter registration, the Electoral College, '
                'primary elections, and Election Day procedures. '
                'What would you like to know?'
            ),
            'source': 'fallback'
        }


# ── Input Validation ──────────────────────────────────────────────────────────

def validate_voter_payload(data: dict) -> tuple:
    """
    Validate and sanitise all fields of a voter registration payload.

    Args:
        data (dict): Raw parsed JSON from the request body.

    Returns:
        tuple[bool, str]: (is_valid, error_message).
                          is_valid is True and error_message is '' on success.
    """
    required = ('fullName', 'email', 'state', 'dob', 'age', 'registeredAt')
    for field in required:
        if field not in data:
            return False, f"Missing required field: '{field}'"

    full_name = sanitise_html(data.get('fullName', ''))
    if len(full_name) < 2 or len(full_name) > MAX_FIELD_LEN:
        return False, 'fullName must be between 2 and 200 characters.'

    email = sanitise_html(data.get('email', '')).lower()
    if not EMAIL_REGEX.match(email) or len(email) > MAX_FIELD_LEN:
        return False, 'A valid email address is required.'

    try:
        age = int(data['age'])
        if age < 18 or age > 130:
            return False, 'Age must be between 18 and 130.'
    except (ValueError, TypeError):
        return False, 'Age must be a valid integer.'

    state = sanitise_html(data.get('state', ''))
    if not state or len(state) > 60:
        return False, 'A valid state is required.'

    dob = sanitise_html(data.get('dob', ''))
    if not re.match(r'^\d{4}-\d{2}-\d{2}$', dob):
        return False, 'Date of birth must be in YYYY-MM-DD format.'

    party = sanitise_html(data.get('partyAffiliation', 'Unaffiliated'))
    if party not in VALID_PARTY_VALUES:
        return False, f"Invalid party. Must be one of: {', '.join(sorted(VALID_PARTY_VALUES))}"

    return True, ''


# ── HTTP Request Handler ──────────────────────────────────────────────────────

class APIHandler(SimpleHTTPRequestHandler):
    """
    Routes HTTP requests to DataManager and AIChatbot handlers.

    API routes are matched on URL path. All other requests are served as
    static files from the current directory via SimpleHTTPRequestHandler.
    """

    # Shared instances across requests (thread-safe for reads)
    _db  = DataManager()
    _ai  = AIChatbot()

    def log_message(self, fmt, *args) -> None:
        """Redirect access logs to our structured logger."""
        logger.info('%s - %s', self.address_string(), fmt % args)

    def send_json(self, data: dict, status: int = 200) -> None:
        """
        Serialise data as UTF-8 JSON and send a complete HTTP response.

        Args:
            data   (dict): Response payload to serialise.
            status (int):  HTTP status code (default 200).
        """
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Vary', 'Origin')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        """Handle CORS preflight requests from the browser."""
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', ALLOWED_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()

    def do_GET(self) -> None:
        """Route GET requests to API handlers or static file serving."""
        path = urlparse(self.path).path
        if path == '/api/voters':
            self._handle_get_voters()
        elif path == '/api/health':
            self._handle_health()
        else:
            super().do_GET()

    def do_POST(self) -> None:
        """Route POST requests to voter registration or AI chat handlers."""
        path = urlparse(self.path).path
        if path == '/api/voters':
            self._handle_post_voter()
        elif path == '/api/chat':
            self._handle_chat()
        else:
            self.send_json({'success': False, 'error': 'Endpoint not found.'}, 404)

    def do_DELETE(self) -> None:
        """Route DELETE requests to voter deletion handler."""
        path = urlparse(self.path).path
        if path.startswith('/api/voters/'):
            raw_id = path.split('/')[-1]
            self._handle_delete_voter(raw_id)
        else:
            self.send_json({'success': False, 'error': 'Endpoint not found.'}, 404)

    # ── Route Handlers ────────────────────────────────────────────────────────

    def _handle_health(self) -> None:
        """
        Return a JSON health-check response.

        Returns:
            JSON: { status, db, ai_available, gcs_configured, version }
        """
        self.send_json({
            'status': 'ok',
            'db': DB_FILE,
            'ai_available': self._ai.available,
            'gcs_configured': bool(GCS_BUCKET),
            'firebase_configured': bool(FIREBASE_PID),
            'version': '2.2.0'
        })

    def _handle_get_voters(self) -> None:
        """
        Return all registered voters as a JSON array ordered by ID descending.

        Response:
            200: { success: true, data: [...], count: int }
            500: { success: false, error: str }
        """
        try:
            voters = self._db.get_all_voters()
            self.send_json({'success': True, 'data': voters, 'count': len(voters)})
        except sqlite3.Error as exc:
            logger.error('GET /api/voters failed: %s', exc)
            self.send_json({'success': False, 'error': 'Internal server error.'}, 500)

    def _handle_post_voter(self) -> None:
        """
        Register a new voter after validating and sanitising the JSON body.

        Request body must include: fullName, email, state, dob, age, registeredAt.
        Optional: partyAffiliation (default 'Unaffiliated').

        Response:
            201: { success: true, data: { voter }, message: str }
            400: { success: false, error: str }
            409: { success: false, error: 'already registered' }
            500: { success: false, error: str }
        """
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length <= 0 or length > MAX_BODY_BYTES:
                self.send_json({'success': False, 'error': 'Invalid request body size.'}, 400)
                return
            data = json.loads(self.rfile.read(length).decode('utf-8'))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json({'success': False, 'error': 'Invalid JSON payload.'}, 400)
            return

        valid, err = validate_voter_payload(data)
        if not valid:
            self.send_json({'success': False, 'error': err}, 400)
            return

        voter = {
            'fullName':         sanitise_html(data['fullName']),
            'email':            sanitise_html(data['email']).lower(),
            'state':            sanitise_html(data['state']),
            'dob':              sanitise_html(data['dob']),
            'age':              int(data['age']),
            'partyAffiliation': sanitise_html(data.get('partyAffiliation', 'Unaffiliated')),
            'registeredAt':     sanitise_html(data['registeredAt']),
        }

        try:
            voter_id = self._db.insert_voter(voter)
            logger.info('Voter registered: id=%d email=%s', voter_id, voter['email'])

            # Firebase session log (stub — replace with firebase_admin SDK call
            # once firebase-admin is installed via: pip install firebase-admin)
            if FIREBASE_PID:
                self._log_to_firebase('voter_registration', {
                    'id': voter_id, 'state': voter['state'],
                    'party': voter['partyAffiliation']
                })

            self.send_json({
                'success': True,
                'data': {**voter, 'id': voter_id, 'status': 'Active'},
                'message': 'Registration successful! Saved to database.'
            }, 201)

        except sqlite3.IntegrityError:
            self.send_json({'success': False, 'error': 'This email is already registered.'}, 409)
        except sqlite3.Error as exc:
            logger.error('POST /api/voters DB error: %s', exc)
            self.send_json({'success': False, 'error': 'Internal server error.'}, 500)

    def _handle_delete_voter(self, raw_id: str) -> None:
        """
        Delete a voter record by numeric primary key.

        Args:
            raw_id (str): ID segment extracted from the URL path.

        Response:
            200: { success: true, message: str }
            400: { success: false, error: 'Invalid voter ID' }
            404: { success: false, error: 'Voter not found' }
            500: { success: false, error: str }
        """
        try:
            voter_id = int(raw_id)
        except (ValueError, TypeError):
            self.send_json({'success': False, 'error': 'Invalid voter ID.'}, 400)
            return

        try:
            deleted = self._db.delete_voter(voter_id)
            if deleted:
                logger.info('Voter deleted: id=%d', voter_id)
                self.send_json({'success': True, 'message': 'Voter deleted from database.'})
            else:
                self.send_json({'success': False, 'error': 'Voter not found.'}, 404)
        except sqlite3.Error as exc:
            logger.error('DELETE /api/voters/%d error: %s', voter_id, exc)
            self.send_json({'success': False, 'error': 'Internal server error.'}, 500)

    def _handle_chat(self) -> None:
        """
        Process an AI chat request via Google Gemini with system instructions.

        Expects JSON body: { 'message': str }
        Sanitises input to prevent XSS before forwarding to Gemini.

        Response:
            200: { success: true, response: str, source: 'gemini'|'fallback' }
            400: { success: false, error: str }
        """
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length <= 0 or length > MAX_BODY_BYTES:
                self.send_json({'success': False, 'error': 'Invalid request.'}, 400)
                return
            body = json.loads(self.rfile.read(length).decode('utf-8'))
            message = str(body.get('message', '')).strip()
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json({'success': False, 'error': 'Invalid JSON payload.'}, 400)
            return

        result = self._ai.chat(message)
        self.send_json(result)

    @staticmethod
    def _log_to_firebase(event: str, payload: dict) -> None:
        """
        Log an analytics event to Firebase Firestore (production stub).

        In production, replace this body with firebase_admin SDK calls:
            import firebase_admin
            from firebase_admin import credentials, firestore
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {'projectId': FIREBASE_PID})
            db = firestore.client()
            db.collection('events').add({**payload, 'event': event})

        Args:
            event   (str):  Event name (e.g. 'voter_registration').
            payload (dict): Event data to persist.
        """
        logger.info('[Firebase stub] Event: %s | Data: %s', event, payload)


# ── Threaded HTTP Server ──────────────────────────────────────────────────────

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """
    Multi-threaded HTTP server that handles each request in a new daemon thread,
    preventing slow requests from blocking the entire server.
    """
    daemon_threads = True
    allow_reuse_address = True


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    server = ThreadedHTTPServer((HOST, PORT), APIHandler)
    url = f'http://localhost:{PORT}'
    logger.info('ElectEd Server running -> %s', url)
    logger.info('Gemini AI: %s', 'enabled' if GEMINI_API_KEY else 'local fallback')
    logger.info('Firebase:  %s', FIREBASE_PID or 'not configured')
    logger.info('GCS:       %s', GCS_BUCKET or 'not configured')
    logger.info('Press Ctrl+C to stop.')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info('Server stopped.')
        server.server_close()
