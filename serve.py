import json
import sqlite3
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs

# Initialize SQLite Database
DB_FILE = 'elected.db'

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS voters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fullName TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            state TEXT NOT NULL,
            dob TEXT NOT NULL,
            age INTEGER NOT NULL,
            partyAffiliation TEXT NOT NULL,
            registeredAt TEXT NOT NULL,
            status TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

class APIHandler(SimpleHTTPRequestHandler):
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/voters':
            conn = sqlite3.connect(DB_FILE)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT * FROM voters ORDER BY id DESC')
            voters = [dict(row) for row in c.fetchall()]
            conn.close()
            self.send_json({"success": True, "data": voters, "count": len(voters)})
            return
        
        # Fallback to static files
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/voters':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body)
                conn = sqlite3.connect(DB_FILE)
                c = conn.cursor()
                c.execute('''
                    INSERT INTO voters (fullName, email, state, dob, age, partyAffiliation, registeredAt, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (data['fullName'], data['email'], data['state'], data['dob'], data['age'], 
                      data.get('partyAffiliation', 'Unaffiliated'), data['registeredAt'], 'Active'))
                conn.commit()
                voter_id = c.lastrowid
                conn.close()
                data['id'] = voter_id
                self.send_json({"success": True, "data": data, "message": "Registration successful! Saved to database."})
            except sqlite3.IntegrityError:
                self.send_json({"success": False, "error": "This email is already registered."}, 400)
            except Exception as e:
                self.send_json({"success": False, "error": str(e)}, 500)
            return

    def do_DELETE(self):
        parsed = urlparse(self.path)
        if parsed.path.startswith('/api/voters/'):
            voter_id = parsed.path.split('/')[-1]
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute('DELETE FROM voters WHERE id = ?', (voter_id,))
            conn.commit()
            conn.close()
            self.send_json({"success": True, "message": "Voter deleted from database."})
            return

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    server = ThreadedHTTPServer(('0.0.0.0', 8080), APIHandler)
    print('ElectEd Fullstack Backend (SQLite + HTTP Server) running on http://localhost:8080')
    server.serve_forever()
