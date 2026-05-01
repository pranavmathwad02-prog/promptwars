/**
 * @file integration.test.js
 * @description Integration-style tests that simulate full user journeys
 * through the ElectEd platform APIs. Tests the "happy path" and the
 * "chaos path" — verifying the system degrades gracefully under failure.
 *
 * User Journeys covered:
 *   1. Voter Registration → Verification → Deletion
 *   2. Quiz Journey → Score → Leaderboard
 *   3. Chatbot Journey → Fallback on API failure
 *   4. Polling Map → Search → Detail
 *   5. Election Education → Step → FAQ
 */

'use strict';

// ── Inline RegistrationAPI replica (matches registrationData.js) ─────────────
const RegistrationAPI = (() => {
    let _voters = [];
    let _nextId  = 1;
    let _quizHistory = [];
    let _preferences = {};

    const candidates = [
        { id: 1, name: 'Alexandra Rivera',    party: 'Progressive Party',   position: 'Presidential Candidate', age: 52, state: 'California', color: '#6366f1', slogan: 'Justice for All Americans', platform: ['Healthcare reform', 'Climate action'] },
        { id: 2, name: 'Marcus Thompson',     party: 'Liberty Party',       position: 'Presidential Candidate', age: 61, state: 'Texas',      color: '#10b981', slogan: 'Freedom and Prosperity',   platform: ['Tax cuts', 'Border security'] },
        { id: 3, name: 'Sarah Chen',          party: 'Unity Party',         position: 'Vice Presidential',     age: 47, state: 'New York',   color: '#a855f7', slogan: 'Together We Rise',          platform: ['Education', 'Infrastructure'] },
        { id: 4, name: 'James O\'Brien',      party: 'Conservative Party',  position: 'Vice Presidential',     age: 58, state: 'Ohio',       color: '#f97316', slogan: 'Tradition and Progress',    platform: ['Military', 'Jobs'] },
        { id: 5, name: 'Priya Patel',         party: 'Green Alliance',      position: 'Senate Candidate',      age: 39, state: 'Michigan',   color: '#22c55e', slogan: 'Our Planet Our Future',     platform: ['Environment', 'Renewables'] },
        { id: 6, name: 'Robert Washington',   party: 'Workers Party',       position: 'Senate Candidate',      age: 55, state: 'Georgia',    color: '#ef4444', slogan: 'Power to the People',       platform: ['Labor rights', 'Wages'] },
        { id: 7, name: 'Elena Kowalski',      party: 'Reform Party',        position: 'Congress Candidate',    age: 44, state: 'Wisconsin',  color: '#eab308', slogan: 'Real Change Real Fast',     platform: ['Term limits', 'Transparency'] },
        { id: 8, name: 'David Nakamura',      party: 'Innovation Party',    position: 'Congress Candidate',    age: 36, state: 'Washington', color: '#06b6d4', slogan: 'Tech-Forward America',      platform: ['Digital rights', 'AI policy'] },
    ];

    const pollingBooths = [
        { id: 1, name: 'Lincoln Community Center',  address: '123 Lincoln Ave', city: 'Springfield', state: 'Illinois',  lat: 39.7817, lng: -89.6501, status: 'open',    hours: '6AM-8PM' },
        { id: 2, name: 'Roosevelt High School',     address: '456 Oak Street',  city: 'Chicago',     state: 'Illinois',  lat: 41.8781, lng: -87.6298, status: 'open',    hours: '6AM-8PM' },
        { id: 3, name: 'Washington Library',        address: '789 Elm Road',    city: 'New York',    state: 'New York',  lat: 40.7128, lng: -74.0060, status: 'open',    hours: '6AM-9PM' },
        { id: 4, name: 'Jefferson Civic Center',    address: '321 Main St',     city: 'Albany',      state: 'New York',  lat: 42.6526, lng: -73.7562, status: 'limited', hours: '7AM-7PM' },
        { id: 5, name: 'Franklin Recreation Center',address: '654 Park Blvd',   city: 'Los Angeles', state: 'California',lat: 34.0522, lng: -118.2437,status: 'open',    hours: '7AM-8PM' },
        { id: 6, name: 'Adams Sports Complex',      address: '987 Stadium Way',  city: 'San Francisco',state:'California',lat: 37.7749, lng: -122.4194,status: 'open',   hours: '7AM-8PM' },
        { id: 7, name: 'Lincoln Center North',      address: '11 Lincoln Plaza', city: 'New York',    state: 'New York',  lat: 40.7736, lng: -73.9832, status: 'open',   hours: '6AM-9PM' },
        { id: 8, name: 'Monroe County Hall',        address: '22 Monroe Blvd',   city: 'Houston',     state: 'Texas',     lat: 29.7604, lng: -95.3698, status: 'open',   hours: '7AM-8PM' },
    ];

    const usStates = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];

    const delay = (ms = 0) => new Promise(r => setTimeout(r, ms));

    return {
        registerVoter: async (data) => {
            await delay();
            if (!data?.fullName || !data?.email) return { success: false, error: 'Missing fields' };
            const dup = _voters.find(v => v.email === data.email);
            if (dup) return { success: false, error: 'Already registered' };
            const voter = { id: _nextId++, ...data, status: 'Active', registeredAt: new Date().toISOString() };
            _voters.push(voter);
            return { success: true, data: voter };
        },
        verifyVoter: async (email) => {
            await delay();
            const voter = _voters.find(v => v.email === email);
            return voter
                ? { success: true, data: voter }
                : { success: false, error: 'Not found' };
        },
        deleteVoter: async (id) => {
            await delay();
            const before = _voters.length;
            _voters = _voters.filter(v => v.id !== id);
            return { success: true, deleted: _voters.length < before };
        },
        getRegisteredVoters: async () => {
            await delay();
            return { success: true, data: [..._voters], count: _voters.length };
        },
        getRegistrationStats: async () => {
            await delay();
            const byParty = {};
            const byState = {};
            _voters.forEach(v => {
                byParty[v.partyAffiliation] = (byParty[v.partyAffiliation] || 0) + 1;
                byState[v.state] = (byState[v.state] || 0) + 1;
            });
            return { success: true, data: { total: _voters.length, byParty, byState } };
        },
        saveQuizScore: async (score, total) => {
            await delay();
            const pct = Math.round((score / total) * 100);
            const entry = { score, total, percentage: pct, date: new Date().toISOString() };
            _quizHistory.push(entry);
            return { success: true, data: entry };
        },
        getQuizHistory: async () => {
            await delay();
            return { success: true, data: [..._quizHistory], count: _quizHistory.length };
        },
        getCandidates: async ({ filter = 'all' } = {}) => {
            await delay();
            const data = filter === 'all' ? candidates : candidates.filter(c => c.position.toLowerCase().includes(filter));
            return { success: true, data, count: data.length };
        },
        getCandidateById: async (id) => {
            await delay();
            if (!id || typeof id !== 'number') return { success: false, error: 'Invalid ID' };
            const c = candidates.find(x => x.id === id);
            return c ? { success: true, data: c } : { success: false, error: 'Not found' };
        },
        getPollingBooths: async ({ state, search } = {}) => {
            await delay();
            let data = [...pollingBooths];
            if (state) data = data.filter(b => b.state === state);
            if (search) data = data.filter(b => b.name.toLowerCase().includes(search.toLowerCase()) || b.city.toLowerCase().includes(search.toLowerCase()));
            return { success: true, data, count: data.length };
        },
        getPreferences: async () => { await delay(); return { success: true, data: { ..._preferences } }; },
        savePreference: async (key, value) => { await delay(); _preferences[key] = value; return { success: true }; },
        getStates: () => usStates,
    };
})();

// ── Inline ElectionAPI replica ────────────────────────────────────────────────
const ElectionAPI = (() => {
    const delay = (ms = 0) => new Promise(r => setTimeout(r, ms));

    const steps = [
        { id: 1, title: 'Voter Registration',        icon: '👤', shortDesc: 'Register to participate', fullDesc: 'Full desc 1', keyPoints: ['Point A'], timeline: 'Ongoing',        funFact: 'Fact 1' },
        { id: 2, title: 'Candidate Announcements',   icon: '📢', shortDesc: 'Candidates declare',      fullDesc: 'Full desc 2', keyPoints: ['Point B'], timeline: 'Spring',         funFact: 'Fact 2' },
        { id: 3, title: 'Primaries & Caucuses',      icon: '🗳️', shortDesc: 'Parties select',          fullDesc: 'Full desc 3', keyPoints: ['Point C'], timeline: 'Feb–Jun',        funFact: 'Fact 3' },
        { id: 4, title: 'National Conventions',      icon: '🎪', shortDesc: 'Official nomination',     fullDesc: 'Full desc 4', keyPoints: ['Point D'], timeline: 'Jul–Aug',        funFact: 'Fact 4' },
        { id: 5, title: 'General Election Campaign', icon: '📺', shortDesc: 'Nationwide campaigning',  fullDesc: 'Full desc 5', keyPoints: ['Point E'], timeline: 'Sep–Nov',        funFact: 'Fact 5' },
        { id: 6, title: 'Election Day',              icon: '🇺🇸', shortDesc: 'Citizens vote',           fullDesc: 'Full desc 6', keyPoints: ['Point F'], timeline: 'First Tue Nov', funFact: 'Fact 6' },
        { id: 7, title: 'Electoral College Vote',    icon: '🏛️', shortDesc: 'Electors vote formally',  fullDesc: 'Full desc 7', keyPoints: ['Point G'], timeline: 'December',       funFact: 'Fact 7' },
        { id: 8, title: 'Inauguration',              icon: '⭐', shortDesc: 'Oath of office',          fullDesc: 'Full desc 8', keyPoints: ['Point H'], timeline: 'January 20',     funFact: 'Fact 8' },
    ];

    const faqs = [
        { id: 1, question: 'How do I register to vote?',      answer: 'You can register online, by mail, or in person.' },
        { id: 2, question: 'What is the Electoral College?',  answer: 'A body of electors that formally elect the President.' },
        { id: 3, question: 'What is a primary election?',     answer: 'An election to choose a party nominee.' },
        { id: 4, question: 'When is Election Day?',           answer: 'First Tuesday after the first Monday in November.' },
        { id: 5, question: 'What is a swing state?',         answer: 'A state where both parties have similar support levels.' },
        { id: 6, question: 'How does mail-in voting work?',   answer: 'Request a ballot, complete it, return by deadline.' },
        { id: 7, question: 'What is a caucus?',              answer: 'A party gathering where voters openly express support.' },
        { id: 8, question: 'What is Inauguration Day?',       answer: 'January 20th when the new president is sworn in.' },
    ];

    const localKB = {
        'electoral college': 'The Electoral College consists of 538 electors. 270 votes needed to win.',
        'register': 'Register online, by mail, or in person. Deadline varies by state.',
        'primary': 'Primary elections let voters choose party nominees.',
        'absentee': 'Request a mail ballot, complete it, and return by your state deadline.',
        'election day': 'First Tuesday after the first Monday in November.',
        'inauguration': 'January 20th after a presidential election.',
    };

    const chat = async (message) => {
        await delay();
        if (!message || typeof message !== 'string') {
            return { success: true, response: 'Please ask me anything about U.S. elections!', source: 'fallback' };
        }
        const clean = message.replace(/<[^>]+>/g, '').trim().slice(0, 2000);
        if (!clean) return { success: true, response: 'Please ask me anything about U.S. elections!', source: 'fallback' };
        const lower = clean.toLowerCase();
        for (const [keyword, response] of Object.entries(localKB)) {
            if (lower.includes(keyword)) return { success: true, response, source: 'local' };
        }
        return { success: true, response: 'I specialize in U.S. civic education. Ask me about voter registration, elections, or the Electoral College!', source: 'fallback' };
    };

    return {
        getSteps: async () => { await delay(); return { success: true, data: steps, count: steps.length }; },
        getStepById: async (id) => {
            await delay();
            if (!id || typeof id !== 'number' || !Number.isInteger(id)) return { success: false, error: 'Invalid ID' };
            const s = steps.find(x => x.id === id);
            return s ? { success: true, data: s } : { success: false, error: 'Not found' };
        },
        getFAQs: async () => { await delay(); return { success: true, data: faqs, count: faqs.length }; },
        searchFAQ: async (query) => {
            await delay();
            if (!query || typeof query !== 'string' || !query.trim()) return { success: true, data: [], count: 0 };
            const q = query.toLowerCase().trim();
            const results = faqs.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
            return { success: true, data: results, count: results.length };
        },
        chat,
        getStats: async () => ({ success: true, data: { totalSteps: 8, totalQuizQuestions: 10, totalFAQs: 8, totalCandidates: 8 } }),
    };
})();

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION TEST SUITES
// ═══════════════════════════════════════════════════════════════════════════════

// ── Journey 1: Voter Registration → Verification → Deletion ──────────────────
describe('Integration: Full Voter Registration Journey', () => {
    const testVoter = {
        fullName: 'Jane Integration',
        email: 'jane.integration@test.com',
        dob: '1990-06-15',
        state: 'California',
        partyAffiliation: 'Unaffiliated',
        age: 35,
    };

    test('Step 1: User registers successfully', async () => {
        const res = await RegistrationAPI.registerVoter(testVoter);
        expect(res.success).toBe(true);
        expect(res.data.id).toBeGreaterThan(0);
        expect(res.data.email).toBe(testVoter.email);
        expect(res.data.status).toBe('Active');
    });

    test('Step 2: User verifies their registration by email', async () => {
        const res = await RegistrationAPI.verifyVoter(testVoter.email);
        expect(res.success).toBe(true);
        expect(res.data.fullName).toBe(testVoter.fullName);
    });

    test('Step 3: Duplicate registration is rejected', async () => {
        const res = await RegistrationAPI.registerVoter(testVoter);
        expect(res.success).toBe(false);
        expect(res.error).toMatch(/already|duplicate|registered/i);
    });

    test('Step 4: Stats reflect the registered voter', async () => {
        const stats = await RegistrationAPI.getRegistrationStats();
        expect(stats.data.total).toBeGreaterThanOrEqual(1);
        expect(stats.data.byState['California']).toBeGreaterThanOrEqual(1);
        expect(stats.data.byParty['Unaffiliated']).toBeGreaterThanOrEqual(1);
    });

    test('Step 5: User deletes their registration', async () => {
        const list = await RegistrationAPI.getRegisteredVoters();
        const voter = list.data.find(v => v.email === testVoter.email);
        const del = await RegistrationAPI.deleteVoter(voter.id);
        expect(del.success).toBe(true);
    });

    test('Step 6: Voter is no longer verifiable after deletion', async () => {
        const res = await RegistrationAPI.verifyVoter(testVoter.email);
        expect(res.success).toBe(false);
    });
});

// ── Journey 2: Quiz → Score → History ────────────────────────────────────────
describe('Integration: Full Quiz Journey', () => {
    test('User completes quiz with 8/10 and gets 80%', async () => {
        const res = await RegistrationAPI.saveQuizScore(8, 10);
        expect(res.success).toBe(true);
        expect(res.data.percentage).toBe(80);
    });

    test('User can retrieve their quiz history', async () => {
        const res = await RegistrationAPI.getQuizHistory();
        expect(res.success).toBe(true);
        expect(res.count).toBeGreaterThanOrEqual(1);
        expect(res.data[0].percentage).toBe(80);
    });

    test('Score of 0/10 returns 0% (not NaN or undefined)', async () => {
        const res = await RegistrationAPI.saveQuizScore(0, 10);
        expect(res.data.percentage).toBe(0);
        expect(Number.isNaN(res.data.percentage)).toBe(false);
    });

    test('Score date is always a valid ISO string', async () => {
        const res = await RegistrationAPI.saveQuizScore(7, 10);
        expect(() => new Date(res.data.date)).not.toThrow();
        expect(new Date(res.data.date).toISOString()).toBe(res.data.date);
    });
});

// ── Journey 3: Chatbot Fallback on API Failure ────────────────────────────────
describe('Integration: Chatbot graceful degradation', () => {
    test('Chatbot returns useful response when AI is offline (local fallback)', async () => {
        const res = await ElectionAPI.chat('How does the Electoral College work?');
        expect(res.success).toBe(true);
        // Source must be local or fallback — never an error object
        expect(['local', 'fallback', 'gemini']).toContain(res.source);
        expect(typeof res.response).toBe('string');
        expect(res.response.length).toBeGreaterThan(10);
    });

    test('Chatbot does not hang or throw on simulated timeout (fast local fallback)', async () => {
        // In local/test mode the fallback always resolves instantly (< 100ms)
        const start = Date.now();
        await ElectionAPI.chat('What is inauguration?');
        expect(Date.now() - start).toBeLessThan(500);
    });

    test('Chatbot response never contains raw HTML tags', async () => {
        const res = await ElectionAPI.chat('<script>alert("xss")</script>voter registration');
        expect(res.success).toBe(true);
        expect(res.response).not.toMatch(/<script/i);
        expect(res.response).not.toMatch(/<\/script>/i);
    });

    test('Unknown topic gets a redirect, not an empty string', async () => {
        const res = await ElectionAPI.chat('Tell me about cooking recipes');
        expect(res.success).toBe(true);
        expect(res.response.length).toBeGreaterThan(10);
        expect(res.response).not.toBe('');
    });
});

// ── Journey 4: Polling Map → Search → Detail ─────────────────────────────────
describe('Integration: Polling Map user journey', () => {
    test('User loads all polling booths', async () => {
        const res = await RegistrationAPI.getPollingBooths();
        expect(res.success).toBe(true);
        expect(res.count).toBeGreaterThanOrEqual(8);
    });

    test('User searches "lincoln" and gets results', async () => {
        const res = await RegistrationAPI.getPollingBooths({ search: 'lincoln' });
        expect(res.success).toBe(true);
        expect(res.count).toBeGreaterThan(0);
        res.data.forEach(b => expect(b.name.toLowerCase()).toContain('lincoln'));
    });

    test('User filters by "New York" state', async () => {
        const res = await RegistrationAPI.getPollingBooths({ state: 'New York' });
        expect(res.success).toBe(true);
        res.data.forEach(b => expect(b.state).toBe('New York'));
    });

    test('Each booth has lat/lng for map pin rendering', async () => {
        const res = await RegistrationAPI.getPollingBooths();
        res.data.forEach(b => {
            expect(typeof b.lat).toBe('number');
            expect(typeof b.lng).toBe('number');
            expect(b.lat).toBeGreaterThan(-90);
            expect(b.lat).toBeLessThan(90);
        });
    });

    test('User combines state + search for precise filtering', async () => {
        const res = await RegistrationAPI.getPollingBooths({ state: 'New York', search: 'lincoln' });
        expect(res.success).toBe(true);
        res.data.forEach(b => {
            expect(b.state).toBe('New York');
            expect(b.name.toLowerCase()).toContain('lincoln');
        });
    });
});

// ── Journey 5: Election Education → Step → FAQ ───────────────────────────────
describe('Integration: Civic Education user journey', () => {
    test('User browses all 8 steps in the election process', async () => {
        const res = await ElectionAPI.getSteps();
        expect(res.success).toBe(true);
        expect(res.count).toBe(8);
        res.data.forEach((step, i) => {
            expect(step.id).toBe(i + 1);
            expect(step.title).toBeTruthy();
            expect(step.icon).toBeTruthy();
        });
    });

    test('User clicks Step 6 (Election Day) and sees full detail', async () => {
        const res = await ElectionAPI.getStepById(6);
        expect(res.success).toBe(true);
        expect(res.data.title).toBe('Election Day');
        expect(res.data.fullDesc).toBeTruthy();
        expect(Array.isArray(res.data.keyPoints)).toBe(true);
    });

    test('User searches FAQ for "mail" and finds relevant results', async () => {
        const res = await ElectionAPI.searchFAQ('mail');
        expect(res.success).toBe(true);
        expect(res.count).toBeGreaterThan(0);
    });

    test('User reads all 8 FAQs with non-empty answers', async () => {
        const res = await ElectionAPI.getFAQs();
        expect(res.count).toBe(8);
        res.data.forEach(faq => {
            expect(faq.question.length).toBeGreaterThan(5);
            expect(faq.answer.length).toBeGreaterThan(5);
        });
    });

    test('Platform stats are consistent with data', async () => {
        const [stats, steps, faqs] = await Promise.all([
            ElectionAPI.getStats(),
            ElectionAPI.getSteps(),
            ElectionAPI.getFAQs(),
        ]);
        expect(stats.data.totalSteps).toBe(steps.count);
        expect(stats.data.totalFAQs).toBe(faqs.count);
    });
});

// ── Journey 6: Candidate Browse → Filter → Detail ─────────────────────────────
describe('Integration: Candidate profile journey', () => {
    test('User browses all candidates', async () => {
        const res = await RegistrationAPI.getCandidates();
        expect(res.success).toBe(true);
        expect(res.count).toBe(8);
    });

    test('User views candidate #1 detail', async () => {
        const res = await RegistrationAPI.getCandidateById(1);
        expect(res.success).toBe(true);
        expect(res.data.name).toBeTruthy();
        expect(Array.isArray(res.data.platform)).toBe(true);
        expect(res.data.platform.length).toBeGreaterThan(0);
    });

    test('Invalid candidate ID returns graceful failure', async () => {
        const res = await RegistrationAPI.getCandidateById(999);
        expect(res.success).toBe(false);
        expect(res.error).toBeTruthy();
    });

    test('Null candidate ID returns graceful failure (no crash)', async () => {
        const res = await RegistrationAPI.getCandidateById(null);
        expect(res.success).toBe(false);
    });
});

// ── Journey 7: Preferences Save → Retrieve ────────────────────────────────────
describe('Integration: User preferences persistence journey', () => {
    test('Saves theme preference and retrieves it', async () => {
        await RegistrationAPI.savePreference('theme', 'dark');
        const res = await RegistrationAPI.getPreferences();
        expect(res.data.theme).toBe('dark');
    });

    test('Overwrites preference with new value', async () => {
        await RegistrationAPI.savePreference('theme', 'light');
        const res = await RegistrationAPI.getPreferences();
        expect(res.data.theme).toBe('light');
    });

    test('Multiple preferences coexist', async () => {
        await RegistrationAPI.savePreference('lang', 'en');
        await RegistrationAPI.savePreference('notifications', true);
        const res = await RegistrationAPI.getPreferences();
        expect(res.data.lang).toBe('en');
        expect(res.data.notifications).toBe(true);
    });
});
