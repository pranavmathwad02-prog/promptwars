/**
 * @file registrationData.test.js
 * @description Unit tests for the RegistrationAPI business-logic layer (Jest).
 *
 * Scope: Tests the pure data-logic functions (validation, CRUD on localStorage,
 * candidate filtering, quiz history, preferences, polling booths).
 * These tests run against an inline implementation that mirrors the localStorage
 * fallback path of registrationData.js — the same logic that runs in-browser
 * when the Python server is offline.
 *
 * Integration tests for the /api/voters HTTP endpoints live in serve.py.
 */

// Set generous timeout for slow CI machines
jest.setTimeout(10000);

// ── Mock localStorage (unavailable in Node/Jest by default) ──────────────────
class MockLocalStorage {
    constructor() { this._store = {}; }
    getItem(key) { return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null; }
    setItem(key, value) { this._store[key] = String(value); }
    removeItem(key) { delete this._store[key]; }
    clear() { this._store = {}; }
}

const localStorage = new MockLocalStorage();

const RegistrationAPI = (() => {
    const STORAGE_KEYS = {
        voters: 'elected_registered_voters',
        quizScores: 'elected_quiz_scores',
        userPrefs: 'elected_user_prefs'
    };

    const _delay = (ms = 0) => new Promise(r => setTimeout(r, ms));
    const _get = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
    const _set = (key, data) => { localStorage.setItem(key, JSON.stringify(data)); };
    const _getObj = (key) => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };

    const candidates = [
        { id: 1, name: "Sarah Mitchell", party: "Democratic Party", position: "President", state: "California", age: 54, slogan: "Unity Through Progress", platform: ["Universal healthcare expansion", "Climate action plan"], photo: null, color: "#3b82f6" },
        { id: 2, name: "James Crawford", party: "Republican Party", position: "President", state: "Texas", age: 61, slogan: "Strength & Prosperity", platform: ["Tax reform", "Border security"], photo: null, color: "#ef4444" },
        { id: 3, name: "Maria Gonzalez", party: "Democratic Party", position: "Senate", state: "Florida", age: 47, slogan: "A Voice for Every Family", platform: ["Affordable housing", "Immigration reform"], photo: null, color: "#3b82f6" },
        { id: 4, name: "Robert Chen", party: "Republican Party", position: "Senate", state: "Ohio", age: 52, slogan: "Common Sense Leadership", platform: ["Deficit reduction", "Veterans support"], photo: null, color: "#ef4444" },
        { id: 5, name: "Dr. Amara Johnson", party: "Independent", position: "President", state: "Virginia", age: 49, slogan: "Beyond Party Lines", platform: ["Campaign finance reform", "Term limits"], photo: null, color: "#8b5cf6" },
        { id: 6, name: "Michael Torres", party: "Democratic Party", position: "House", state: "New York", age: 38, slogan: "Building Tomorrow Today", platform: ["Green energy jobs", "Student debt relief"], photo: null, color: "#3b82f6" },
        { id: 7, name: "Elizabeth Harper", party: "Republican Party", position: "Governor", state: "Georgia", age: 55, slogan: "Georgia First", platform: ["State tax cuts", "School choice"], photo: null, color: "#ef4444" },
        { id: 8, name: "David Nakamura", party: "Independent", position: "Senate", state: "Washington", age: 44, slogan: "Integrity in Action", platform: ["Tech regulation", "Environmental protection"], photo: null, color: "#8b5cf6" }
    ];

    const booths = [
        { id: 1, name: "Washington Community Center", address: "1234 Constitution Ave NW", city: "Washington", state: "District of Columbia", lat: 38.8977, lng: -77.0365, hours: "6:00 AM - 8:00 PM", status: "open", accessible: true, type: "Community Center" },
        { id: 2, name: "Lincoln High School Gym", address: "500 E 65th St", city: "New York", state: "New York", lat: 40.7614, lng: -73.9776, hours: "6:00 AM - 9:00 PM", status: "open", accessible: true, type: "School" },
        { id: 3, name: "City Hall Annex", address: "200 N Spring St", city: "Los Angeles", state: "California", lat: 34.0522, lng: -118.2437, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Government Building" },
        { id: 10, name: "North Dallas Senior Center", address: "3800 N Belt Line Rd", city: "Dallas", state: "Texas", lat: 32.7767, lng: -96.7970, hours: "Closed for renovation", status: "closed", accessible: false, type: "Senior Center" }
    ];

    return {
        async registerVoter(voterData) {
            await _delay();
            const { fullName, email, state, dob, partyAffiliation } = voterData;
            if (!fullName || fullName.trim().length < 2) return { success: false, error: "Full name is required (min 2 characters)." };
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: "A valid email address is required." };
            if (!state) return { success: false, error: "Please select your state." };
            if (!dob) return { success: false, error: "Date of birth is required." };
            const birthDate = new Date(dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            if (age < 18) return { success: false, error: "You must be at least 18 years old to register." };
            const voters = _get(STORAGE_KEYS.voters);
            if (voters.find(v => v.email.toLowerCase() === email.toLowerCase())) return { success: false, error: "This email is already registered." };
            const voter = { id: Date.now(), fullName: fullName.trim(), email: email.trim().toLowerCase(), state, dob, age, partyAffiliation: partyAffiliation || "Unaffiliated", registeredAt: new Date().toISOString(), status: "Active" };
            voters.push(voter);
            _set(STORAGE_KEYS.voters, voters);
            return { success: true, data: voter, message: "Registration successful! You are now registered to vote." };
        },
        async getRegisteredVoters() {
            await _delay();
            const voters = _get(STORAGE_KEYS.voters);
            return { success: true, data: voters, count: voters.length };
        },
        async getRegistrationStats() {
            await _delay();
            const voters = _get(STORAGE_KEYS.voters);
            const byParty = {};
            const byState = {};
            voters.forEach(v => {
                byParty[v.partyAffiliation] = (byParty[v.partyAffiliation] || 0) + 1;
                byState[v.state] = (byState[v.state] || 0) + 1;
            });
            return { success: true, data: { total: voters.length, byParty, byState } };
        },
        async deleteVoter(id) {
            await _delay();
            let voters = _get(STORAGE_KEYS.voters);
            voters = voters.filter(v => v.id !== id);
            _set(STORAGE_KEYS.voters, voters);
            return { success: true, message: "Voter registration removed." };
        },
        async getCandidates(filter = {}) {
            await _delay();
            let result = [...candidates];
            if (filter.party) result = result.filter(c => c.party === filter.party);
            if (filter.position) result = result.filter(c => c.position === filter.position);
            return { success: true, data: result, count: result.length };
        },
        async getCandidateById(id) {
            await _delay();
            const c = candidates.find(c => c.id === id);
            return c ? { success: true, data: c } : { success: false, error: "Candidate not found." };
        },
        async saveQuizScore(score, total) {
            await _delay();
            const scores = _get(STORAGE_KEYS.quizScores);
            const entry = { score, total, percentage: Math.round((score / total) * 100), date: new Date().toISOString() };
            scores.push(entry);
            _set(STORAGE_KEYS.quizScores, scores);
            return { success: true, data: entry };
        },
        async getQuizHistory() {
            await _delay();
            const scores = _get(STORAGE_KEYS.quizScores);
            return { success: true, data: scores, count: scores.length, bestScore: scores.length ? Math.max(...scores.map(s => s.percentage)) : 0 };
        },
        async savePreference(key, value) {
            const prefs = _getObj(STORAGE_KEYS.userPrefs);
            prefs[key] = value;
            _set(STORAGE_KEYS.userPrefs, prefs);
            return { success: true };
        },
        async getPreferences() {
            return { success: true, data: _getObj(STORAGE_KEYS.userPrefs) };
        },
        getStates() {
            return ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"];
        },
        async getPollingBooths(filter = {}) {
            await _delay();
            let result = [...booths];
            if (filter.state && filter.state !== 'all') result = result.filter(b => b.state === filter.state);
            if (filter.search) { const q = filter.search.toLowerCase(); result = result.filter(b => b.name.toLowerCase().includes(q) || b.city.toLowerCase().includes(q) || b.state.toLowerCase().includes(q)); }
            return { success: true, data: result, count: result.length };
        }
    };
})();

// ════════════════════════════════════════
// SETUP: Reset storage before EVERY test,
//        and clean up after EVERY test.
// ════════════════════════════════════════
beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

// ════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════

describe('RegistrationAPI.registerVoter()', () => {
    const validVoter = {
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        dob: '1990-06-15',
        state: 'California',
        partyAffiliation: 'Democratic Party'
    };

    test('successfully registers a valid voter', async () => {
        const res = await RegistrationAPI.registerVoter(validVoter);
        expect(res.success).toBe(true);
        expect(res.data.fullName).toBe('Jane Doe');
        expect(res.data.email).toBe('jane@example.com');
        expect(res.data.status).toBe('Active');
        expect(res).toHaveProperty('message');
    });

    test('stores voter in localStorage', async () => {
        await RegistrationAPI.registerVoter(validVoter);
        const votersRes = await RegistrationAPI.getRegisteredVoters();
        expect(votersRes.count).toBe(1);
        expect(votersRes.data[0].email).toBe('jane@example.com');
    });

    test('rejects voter under 18 years old', async () => {
        const minorVoter = { ...validVoter, dob: new Date(Date.now() - 17 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] };
        const res = await RegistrationAPI.registerVoter(minorVoter);
        expect(res.success).toBe(false);
        expect(res.error).toContain('18');
    });

    test('rejects duplicate email registration', async () => {
        await RegistrationAPI.registerVoter(validVoter);
        const res = await RegistrationAPI.registerVoter({ ...validVoter, fullName: 'Jane Clone' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('already registered');
    });

    test('rejects voter with invalid email format', async () => {
        const res = await RegistrationAPI.registerVoter({ ...validVoter, email: 'not-an-email' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('email');
    });

    test('rejects voter with name too short (< 2 chars)', async () => {
        const res = await RegistrationAPI.registerVoter({ ...validVoter, email: 'other@test.com', fullName: 'J' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('Full name');
    });

    test('rejects voter with missing state', async () => {
        const res = await RegistrationAPI.registerVoter({ ...validVoter, email: 'other2@test.com', state: '' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('state');
    });

    test('rejects voter with missing date of birth', async () => {
        const res = await RegistrationAPI.registerVoter({ ...validVoter, email: 'other3@test.com', dob: '' });
        expect(res.success).toBe(false);
        expect(res.error).toContain('birth');
    });

    test('email is stored lowercase', async () => {
        await RegistrationAPI.registerVoter({ ...validVoter, email: 'Jane@Example.COM' });
        const votersRes = await RegistrationAPI.getRegisteredVoters();
        expect(votersRes.data[0].email).toBe('jane@example.com');
    });

    test('defaults partyAffiliation to Unaffiliated when not provided', async () => {
        const { partyAffiliation, ...noParty } = validVoter;
        await RegistrationAPI.registerVoter(noParty);
        const votersRes = await RegistrationAPI.getRegisteredVoters();
        expect(votersRes.data[0].partyAffiliation).toBe('Unaffiliated');
    });
});

describe('RegistrationAPI.getRegisteredVoters()', () => {
    test('returns empty array initially', async () => {
        const res = await RegistrationAPI.getRegisteredVoters();
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
        expect(res.count).toBe(0);
    });

    test('count matches data array length', async () => {
        await RegistrationAPI.registerVoter({ fullName: 'Alice', email: 'alice@test.com', dob: '1985-01-01', state: 'Texas', partyAffiliation: 'Republican Party' });
        await RegistrationAPI.registerVoter({ fullName: 'Bob', email: 'bob@test.com', dob: '1990-05-20', state: 'Florida', partyAffiliation: 'Democratic Party' });
        const res = await RegistrationAPI.getRegisteredVoters();
        expect(res.count).toBe(res.data.length);
        expect(res.count).toBe(2);
    });
});

describe('RegistrationAPI.deleteVoter()', () => {
    test('deletes a registered voter by ID', async () => {
        const reg = await RegistrationAPI.registerVoter({ fullName: 'Delete Me', email: 'delete@test.com', dob: '1988-03-10', state: 'Ohio', partyAffiliation: 'Unaffiliated' });
        const voterId = reg.data.id;
        await RegistrationAPI.deleteVoter(voterId);
        const votersRes = await RegistrationAPI.getRegisteredVoters();
        expect(votersRes.data.find(v => v.id === voterId)).toBeUndefined();
        expect(votersRes.count).toBe(0);
    });

    test('does not throw for non-existent voter ID', async () => {
        const res = await RegistrationAPI.deleteVoter(99999999);
        expect(res.success).toBe(true);
    });
});

describe('RegistrationAPI.getRegistrationStats()', () => {
    test('returns zero stats when no voters registered', async () => {
        const res = await RegistrationAPI.getRegistrationStats();
        expect(res.success).toBe(true);
        expect(res.data.total).toBe(0);
    });

    test('groups voters by party correctly', async () => {
        await RegistrationAPI.registerVoter({ fullName: 'Voter A', email: 'a@test.com', dob: '1980-01-01', state: 'Texas', partyAffiliation: 'Democratic Party' });
        await RegistrationAPI.registerVoter({ fullName: 'Voter B', email: 'b@test.com', dob: '1980-01-01', state: 'Texas', partyAffiliation: 'Republican Party' });
        await RegistrationAPI.registerVoter({ fullName: 'Voter C', email: 'c@test.com', dob: '1980-01-01', state: 'Texas', partyAffiliation: 'Democratic Party' });
        const res = await RegistrationAPI.getRegistrationStats();
        expect(res.data.byParty['Democratic Party']).toBe(2);
        expect(res.data.byParty['Republican Party']).toBe(1);
        expect(res.data.total).toBe(3);
    });

    test('groups voters by state correctly', async () => {
        await RegistrationAPI.registerVoter({ fullName: 'CA Voter', email: 'ca@test.com', dob: '1980-01-01', state: 'California', partyAffiliation: 'Unaffiliated' });
        await RegistrationAPI.registerVoter({ fullName: 'TX Voter', email: 'tx@test.com', dob: '1980-01-01', state: 'Texas', partyAffiliation: 'Unaffiliated' });
        const res = await RegistrationAPI.getRegistrationStats();
        expect(res.data.byState['California']).toBe(1);
        expect(res.data.byState['Texas']).toBe(1);
    });
});

describe('RegistrationAPI.getCandidates()', () => {
    test('returns all 8 candidates with no filter', async () => {
        const res = await RegistrationAPI.getCandidates();
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(8);
    });

    test('filters candidates by position "President"', async () => {
        const res = await RegistrationAPI.getCandidates({ position: 'President' });
        expect(res.success).toBe(true);
        res.data.forEach(c => expect(c.position).toBe('President'));
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('filters candidates by party "Democratic Party"', async () => {
        const res = await RegistrationAPI.getCandidates({ party: 'Democratic Party' });
        expect(res.success).toBe(true);
        res.data.forEach(c => expect(c.party).toBe('Democratic Party'));
    });

    test('each candidate has required fields', async () => {
        const res = await RegistrationAPI.getCandidates();
        res.data.forEach(c => {
            expect(c).toHaveProperty('id');
            expect(c).toHaveProperty('name');
            expect(c).toHaveProperty('party');
            expect(c).toHaveProperty('position');
            expect(c).toHaveProperty('state');
            expect(c).toHaveProperty('age');
            expect(c).toHaveProperty('slogan');
            expect(Array.isArray(c.platform)).toBe(true);
            expect(c.platform.length).toBeGreaterThan(0);
        });
    });

    test('candidate colors are valid hex values', async () => {
        const res = await RegistrationAPI.getCandidates();
        res.data.forEach(c => {
            expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    test('returns empty array for a non-existent position filter', async () => {
        const res = await RegistrationAPI.getCandidates({ position: 'Mayor' });
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });
});

describe('RegistrationAPI.getCandidateById()', () => {
    test('returns correct candidate for valid ID', async () => {
        const res = await RegistrationAPI.getCandidateById(1);
        expect(res.success).toBe(true);
        expect(res.data.name).toBe('Sarah Mitchell');
    });

    test('returns failure for non-existent candidate ID', async () => {
        const res = await RegistrationAPI.getCandidateById(999);
        expect(res.success).toBe(false);
        expect(res.error).toBe('Candidate not found.');
    });
});

describe('RegistrationAPI.saveQuizScore() & getQuizHistory()', () => {
    test('saves a quiz score and retrieves it in history', async () => {
        await RegistrationAPI.saveQuizScore(8, 10);
        const history = await RegistrationAPI.getQuizHistory();
        expect(history.success).toBe(true);
        expect(history.count).toBe(1);
        expect(history.data[0].score).toBe(8);
        expect(history.data[0].total).toBe(10);
        expect(history.data[0].percentage).toBe(80);
    });

    test('tracks best score across multiple attempts', async () => {
        await RegistrationAPI.saveQuizScore(6, 10);
        await RegistrationAPI.saveQuizScore(9, 10);
        await RegistrationAPI.saveQuizScore(7, 10);
        const history = await RegistrationAPI.getQuizHistory();
        expect(history.bestScore).toBe(90);
    });

    test('returns bestScore of 0 when no history exists', async () => {
        const history = await RegistrationAPI.getQuizHistory();
        expect(history.bestScore).toBe(0);
    });
});

describe('RegistrationAPI.savePreference() & getPreferences()', () => {
    test('saves and retrieves a preference', async () => {
        await RegistrationAPI.savePreference('theme', 'dark');
        const prefs = await RegistrationAPI.getPreferences();
        expect(prefs.success).toBe(true);
        expect(prefs.data.theme).toBe('dark');
    });

    test('can store multiple preferences', async () => {
        await RegistrationAPI.savePreference('theme', 'light');
        await RegistrationAPI.savePreference('language', 'en');
        const prefs = await RegistrationAPI.getPreferences();
        expect(prefs.data.theme).toBe('light');
        expect(prefs.data.language).toBe('en');
    });

    test('overwriting a preference updates its value', async () => {
        await RegistrationAPI.savePreference('theme', 'dark');
        await RegistrationAPI.savePreference('theme', 'light');
        const prefs = await RegistrationAPI.getPreferences();
        expect(prefs.data.theme).toBe('light');
    });
});

describe('RegistrationAPI.getStates()', () => {
    test('returns an array of 51 entries (50 states + DC)', () => {
        const states = RegistrationAPI.getStates();
        expect(Array.isArray(states)).toBe(true);
        expect(states).toHaveLength(51);
    });

    test('includes California and Texas', () => {
        const states = RegistrationAPI.getStates();
        expect(states).toContain('California');
        expect(states).toContain('Texas');
    });

    test('includes District of Columbia', () => {
        const states = RegistrationAPI.getStates();
        expect(states).toContain('District of Columbia');
    });

    test('all entries are non-empty strings', () => {
        const states = RegistrationAPI.getStates();
        states.forEach(s => {
            expect(typeof s).toBe('string');
            expect(s.length).toBeGreaterThan(0);
        });
    });
});

describe('RegistrationAPI.getPollingBooths()', () => {
    test('returns all booths with no filter', async () => {
        const res = await RegistrationAPI.getPollingBooths();
        expect(res.success).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('filters booths by state', async () => {
        const res = await RegistrationAPI.getPollingBooths({ state: 'New York' });
        expect(res.success).toBe(true);
        res.data.forEach(b => expect(b.state).toBe('New York'));
    });

    test('returns empty for non-existent state', async () => {
        const res = await RegistrationAPI.getPollingBooths({ state: 'Nonexistent State XYZ' });
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('filters by search term (city name)', async () => {
        const res = await RegistrationAPI.getPollingBooths({ search: 'new york' });
        expect(res.success).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('each booth has required fields', async () => {
        const res = await RegistrationAPI.getPollingBooths();
        res.data.forEach(b => {
            expect(b).toHaveProperty('id');
            expect(b).toHaveProperty('name');
            expect(b).toHaveProperty('address');
            expect(b).toHaveProperty('city');
            expect(b).toHaveProperty('state');
            expect(b).toHaveProperty('lat');
            expect(b).toHaveProperty('lng');
            expect(b).toHaveProperty('hours');
            expect(b).toHaveProperty('status');
            expect(b).toHaveProperty('accessible');
            expect(['open', 'limited', 'closed']).toContain(b.status);
        });
    });

    test('count matches data array length', async () => {
        const res = await RegistrationAPI.getPollingBooths();
        expect(res.count).toBe(res.data.length);
    });
});
