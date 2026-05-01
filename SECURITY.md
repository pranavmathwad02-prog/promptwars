# Security Policy 🔐

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.3.x   | ✅ Yes     |
| 2.2.x   | ✅ Yes     |
| < 2.2   | ❌ No      |

---

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report them privately:

1. **Email:** Create a GitHub private advisory at  
   `https://github.com/pranavmathwad02-prog/promptwars/security/advisories/new`

2. **Include in your report:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact (data exposure, XSS, injection, etc.)
   - Suggested fix (if known)

---

## Response Timeline

| Stage | Time |
|-------|------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix & release | Within 30 days for critical issues |

---

## Security Measures in Place

| Measure | Implementation |
|---------|---------------|
| Content Security Policy | `index.html` `<meta http-equiv="Content-Security-Policy">` |
| XSS sanitisation | `serve.py` `sanitise_html()` + JS `chat()` input strip |
| SQL injection prevention | Parameterised queries in `serve.py` `DataManager` |
| API key protection | Environment variables only; `config.js` in `.gitignore` |
| CORS restriction | `ALLOWED_ORIGIN` constant in `serve.py` |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` |
| Rate limiting | 60 req/min per IP (sliding window) in `APIHandler` |
| Input size limits | `MAX_BODY_BYTES = 8192` enforced server-side |

---

## Scope

**In scope:**
- SQL injection in voter registration API
- XSS in chatbot input/output
- Sensitive data exposure (API keys, voter PII)
- Authentication bypass (if added in future)
- Path traversal in static file serving

**Out of scope:**
- Rate-limit bypass on public demo instances
- Third-party library vulnerabilities (report to upstream)
- Issues requiring physical access to the server

---

## Disclosure Policy

This project follows **Coordinated Disclosure**. We ask that you give us a reasonable time to fix the issue before publishing any details publicly.
