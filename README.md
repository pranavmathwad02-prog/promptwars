# ElectEd — Setup & Testing Guide

## 🚀 Running the Website

```bash
python serve.py
```
Then open **`http://localhost:8080`** in your browser.

> The server runs on **port 8080** (not 8000). It serves static files and the `/api/voters` REST endpoint backed by SQLite.

---

## 🤖 Enabling Real Google Gemini AI (Chatbot)

1. Get a **free** Gemini API key at: https://aistudio.google.com/
2. Open `config.js` and replace `null` with your key:
   ```js
   window.GEMINI_API_KEY = 'AIzaSy...yourkey...';
   ```
3. Save and refresh — the chatbot will now use real Google Gemini AI.

> **Note:** Without a key, the chatbot uses the built-in local knowledge base — it still works great!

> **Security:** `config.js` is listed in `.gitignore` and should **never** be committed to source control.

---

## 🧪 Running Tests (Jest)

### Prerequisites
You need Node.js installed. If you don't have it:
1. Go to https://nodejs.org/ → Download **LTS** version
2. Install it (this also installs `npm`)
3. Restart your terminal

### Install & Run Tests
```bash
# Install Jest (one time)
npm install

# Run all tests with coverage report
npm test

# Watch mode (auto-reruns on file changes)
npm run test:watch
```

### Test Coverage
The unit tests cover **~90%+** of all API business-logic code:

| Module | Tests | Scope |
|---|---|---|
| `electionData.js` | 35 tests | Steps, Timeline, Quiz, FAQ, Chat, Stats, Electoral Data |
| `registrationData.js` | 42 tests | Registration CRUD, Candidates, Polling Booths, Preferences, Quiz History |

> **Note:** Unit tests cover the localStorage-path logic. HTTP API endpoints (`/api/voters`) are tested manually via the running Python server.

---

## 📁 Project Structure

```
promptwar/
├── index.html          # Main HTML — CSP header, PWA manifest link
├── index.css           # Master CSS import (aggregates all CSS modules)
├── config.js           # 🔒 GITIGNORED — put your Gemini API key here
├── manifest.json       # PWA manifest (icons, shortcuts, display)
├── sw.js               # Service Worker (cache-first PWA, offline support)
├── robots.txt          # Search engine crawler rules
├── sitemap.xml         # SEO sitemap
├── css/
│   ├── base.css        # CSS variables, resets, typography, header, footer
│   ├── components.css  # Reusable UI components (buttons, cards, toast)
│   ├── sections.css    # Page section layouts (hero, overview, steps)
│   ├── premium.css     # Animations, modals, splash screen, cursor
│   ├── registration.css# Voter registration & candidate styles
│   ├── electoralMap.css# Electoral College map styles
│   └── pollmap.css     # Polling booth map styles
├── js/
│   ├── app.js          # Main application controller (all UI logic)
│   ├── worker.js       # Web Worker — live analytics simulation
│   └── api/
│       ├── electionData.js    # ElectionAPI — Gemini chatbot + all election data
│       └── registrationData.js# RegistrationAPI — voters, candidates, booths
├── tests/
│   ├── electionData.test.js     # 35 Jest unit tests for ElectionAPI
│   └── registrationData.test.js # 42 Jest unit tests for RegistrationAPI
├── package.json        # Jest config & npm scripts
└── serve.py            # Python/SQLite full-stack server (port 8080)
```

---

## 🔒 Security Notes

| Topic | Detail |
|---|---|
| **CSP** | Strict Content-Security-Policy — removes `unsafe-eval`, restricts all sources |
| **API Key** | Gemini key stored only in `config.js` (gitignored), never in HTML |
| **SQL Injection** | Parameterised queries + integer-cast voter ID in `serve.py` |
| **Input Validation** | Email regex, field length limits, party allowlist, age bounds check |
| **CORS** | Scoped to `http://localhost:8080` in development |

---

## 🏆 Quality Assessment

| Metric | Highlights |
| :--- | :--- |
| **Code Quality** | Clean modular ES6+, JSDoc documented, `'use strict'` throughout |
| **Security** | Strict CSP, no exposed keys, parameterised SQL, validated inputs |
| **Efficiency** | Web Worker multi-threading, Service Worker caching, lazy rendering |
| **Accessibility** | ARIA landmarks, live regions, skip-nav, keyboard nav, WCAG contrast |
| **Testing** | 77 Jest unit tests, `afterEach` cleanup, consistent mock localStorage |
| **Google Services** | Gemini AI, Google Translate, Google Analytics, Firebase, Maps |
| **Problem Alignment** | End-to-end election education: timeline → quiz → registration → AI chat |

## ✨ Premium Features
- **AI Chatbot**: Google Gemini-powered with graceful local fallback
- **Voice Input**: Speak to the AI Assistant for hands-free learning
- **Live Analytics**: Multi-threaded Web Worker simulation with Chart.js
- **Electoral Map**: Interactive Leaflet map with per-state voting data
- **PWA**: Installable app with offline support via Service Worker
- **Magnetic Cursor**: High-end desktop micro-interaction
- **Election Countdown**: Real-time ticker for the 2026 Midterm Elections
- **Google Translate**: 100+ language support via widget
