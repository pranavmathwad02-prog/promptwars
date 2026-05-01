# Contributing to ElectEd 🗳️

Thank you for your interest in improving ElectEd! This document explains how to contribute effectively.

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Code Standards](#code-standards)
5. [Submitting a Pull Request](#submitting-a-pull-request)
6. [Reporting Bugs](#reporting-bugs)

---

## Code of Conduct

All contributors are expected to be respectful, inclusive, and professional.
This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

---

## Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥ 3.10 | Backend server |
| Node.js | ≥ 18.0 | Test runner (Jest) |
| Git | Any | Version control |

### Setup

```bash
# 1. Fork and clone the repository
git clone https://github.com/pranavmathwad02-prog/promptwars.git
cd promptwars

# 2. (Optional) Set Gemini API key for AI features
echo "window.GEMINI_API_KEY = 'your-key';" > config.js

# 3. Start the dev server
python serve.py

# 4. Install test dependencies
npm install

# 5. Run all tests
npm test
```

---

## Development Workflow

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<description>` | `feat/voice-input` |
| Bug fix | `fix/<description>` | `fix/modal-focus-trap` |
| Docs | `docs/<description>` | `docs/api-reference` |
| Tests | `test/<description>` | `test/edge-cases` |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(chat): add Gemini streaming support
fix(modal): restore focus on close
docs(readme): add architecture diagram
test(api): add boundary input tests
```

---

## Code Standards

### Python (`serve.py`)

- **PEP 8** compliant (79-char line limit)
- **Google-style docstrings** on all functions and classes
- **Full type hints** using `typing` module (`List`, `Dict`, `Optional`)
- **Specific exception handling** — never bare `except:`
- **Logging** via `logging` module — never `print()`

```python
# ✅ Good
def get_voters(self) -> List[Dict[str, Any]]:
    """Retrieve all voters ordered by registration date."""
    ...

# ❌ Bad
def get_voters(self):
    print("getting voters")
    ...
```

### JavaScript (`js/`)

- **`'use strict'`** at top of every file
- **JSDoc** on every exported function with `@param`, `@returns`, `@throws`
- **`const`** by default; `let` only when value changes; never `var`
- **Strict equality** (`===` / `!==`) throughout
- **No magic numbers** — use named constants

```js
// ✅ Good
/** @param {number} score @returns {string} */
const getRating = (score) => score >= MIN_PASSING_SCORE ? 'Pass' : 'Fail';

// ❌ Bad
const getRating = (score) => score >= 80 ? 'Pass' : 'Fail';
```

### CSS

- Use **CSS custom properties** (variables) for all colors, radii, and transitions
- Font sizes in **`rem`** (never `px` for typography)
- Include **`@media (prefers-reduced-motion)`** for all animations

---

## Submitting a Pull Request

1. **Open an issue first** for any significant change
2. **Create a branch** from `main`
3. **Write tests** covering the new code
4. **Ensure all existing tests pass**: `npm test`
5. **Open a PR** with a clear description and link to the issue

### PR Checklist

- [ ] Tests added / updated
- [ ] Documentation updated (README / JSDoc / docstrings)
- [ ] No new `console.log` or `print()` statements
- [ ] `npm test` passes with zero failures
- [ ] Accessibility checked (keyboard navigation, ARIA)

---

## Reporting Bugs

Please use [GitHub Issues](https://github.com/pranavmathwad02-prog/promptwars/issues) with:

- **Description** of the problem
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Browser / OS / Python version**

For security vulnerabilities, see [SECURITY.md](./SECURITY.md) instead.
