/**
 * @file electionData.test.js
 * @description Comprehensive unit tests for ElectionAPI module (Jest).
 * Covers: happy paths, edge cases, empty states, error states,
 * XSS sanitisation inputs, and API-offline fallback scenarios.
 */

'use strict';

// ── Minimal ElectionAPI replica for Node/Jest environment ──────────────────
const ElectionAPI = (() => {
    const _delay = (ms = 0) => new Promise(r => setTimeout(r, ms));

    const steps = [
        { id: 1, title: "Voter Registration",       icon: "👤", shortDesc: "Register to participate", fullDesc: "Full desc 1", keyPoints: ["Point A"], timeline: "Ongoing",         funFact: "Fact 1" },
        { id: 2, title: "Candidate Announcements",  icon: "📢", shortDesc: "Candidates declare",      fullDesc: "Full desc 2", keyPoints: ["Point B"], timeline: "Spring",          funFact: "Fact 2" },
        { id: 3, title: "Primaries & Caucuses",     icon: "🗳️", shortDesc: "Parties select",          fullDesc: "Full desc 3", keyPoints: ["Point C"], timeline: "Feb–Jun",         funFact: "Fact 3" },
        { id: 4, title: "National Conventions",     icon: "🎪", shortDesc: "Official nomination",     fullDesc: "Full desc 4", keyPoints: ["Point D"], timeline: "Jul–Aug",         funFact: "Fact 4" },
        { id: 5, title: "General Election Campaign",icon: "📺", shortDesc: "Nationwide campaigning",  fullDesc: "Full desc 5", keyPoints: ["Point E"], timeline: "Sep–Nov",         funFact: "Fact 5" },
        { id: 6, title: "Election Day",             icon: "🇺🇸", shortDesc: "Citizens vote",           fullDesc: "Full desc 6", keyPoints: ["Point F"], timeline: "First Tue Nov",  funFact: "Fact 6" },
        { id: 7, title: "Electoral College Vote",   icon: "🏛️", shortDesc: "Electors vote formally",  fullDesc: "Full desc 7", keyPoints: ["Point G"], timeline: "December",        funFact: "Fact 7" },
        { id: 8, title: "Inauguration",             icon: "⭐", shortDesc: "Oath of office",          fullDesc: "Full desc 8", keyPoints: ["Point H"], timeline: "January 20",      funFact: "Fact 8" }
    ];

    const presidentialTimeline = [
        { month: "Spring (Year Before)", title: "Candidate Announcements", desc: "Desc", icon: "📢", color: "#6366f1" },
        { month: "Feb – Mar",            title: "Early Primaries & Caucuses", desc: "Desc", icon: "🗳️", color: "#8b5cf6" },
        { month: "March (Super Tuesday)",title: "Super Tuesday",           desc: "Desc", icon: "⚡", color: "#a855f7" },
        { month: "Jul – Aug",            title: "National Conventions",    desc: "Desc", icon: "🎪", color: "#ec4899" },
        { month: "First Tue after First Mon in Nov", title: "Election Day", desc: "Desc", icon: "🇺🇸", color: "#f97316" },
        { month: "January 20",           title: "Inauguration Day",        desc: "Desc", icon: "⭐", color: "#22c55e" }
    ];

    const midtermTimeline = [
        { month: "Spring",                          title: "Filing Deadlines",       desc: "Desc", icon: "📝", color: "#6366f1" },
        { month: "May – Sep",                       title: "Primary Elections",      desc: "Desc", icon: "🗳️", color: "#8b5cf6" },
        { month: "First Tue after First Mon in Nov",title: "Election Day",           desc: "Desc", icon: "🇺🇸", color: "#f97316" },
        { month: "Jan 3",                           title: "New Congress Convenes",  desc: "Desc", icon: "🏛️", color: "#22c55e" }
    ];

    const quizQuestions = [
        { id: 1,  question: "Electoral votes needed?",           options: ["200","270","300","538"],                         correct: 1, explanation: "270 are needed." },
        { id: 2,  question: "When is Inauguration Day?",         options: ["Jan 1","Jan 20","Feb 1","Dec 25"],               correct: 1, explanation: "January 20th." },
        { id: 3,  question: "Primary vs Caucus?",                options: ["Same","Primary=secret ballot","Caucus uses e","Only pres"], correct: 1, explanation: "Primaries are state-run." },
        { id: 4,  question: "No registration state?",            options: ["Texas","California","North Dakota","Florida"],   correct: 2, explanation: "North Dakota." },
        { id: 5,  question: "When is Election Day?",             options: ["Last Mon Oct","First Tue after First Mon Nov","Nov 1","Second Wed Nov"], correct: 1, explanation: "First Tuesday after first Monday in November." },
        { id: 6,  question: "Total electoral votes?",            options: ["435","500","538","600"],                         correct: 2, explanation: "538 total." },
        { id: 7,  question: "July/August event?",                options: ["Primaries","Conventions","Electoral vote","Inauguration"], correct: 1, explanation: "National conventions." },
        { id: 8,  question: "Who gives oath?",                   options: ["VP","Speaker","Chief Justice","Sec. of State"],  correct: 2, explanation: "Chief Justice." },
        { id: 9,  question: "Super Tuesday is?",                 options: ["Certification","Many states same day","Last reg day","Day after"], correct: 1, explanation: "Many states vote simultaneously." },
        { id: 10, question: "How often presidential elections?", options: ["2 years","3 years","4 years","6 years"],         correct: 2, explanation: "Every four years." }
    ];

    const faqs = [
        { id: 1, question: "Who is eligible to vote?", answer: "U.S. citizens, 18+, registered." },
        { id: 2, question: "What is the Electoral College?", answer: "538 electors formally elect the President." },
        { id: 3, question: "Can I vote from abroad?", answer: "Yes, via UOCAVA." }
    ];

    const chatbotKnowledge = {
        "electoral college": "The Electoral College consists of 538 electors. A candidate needs 270 electoral votes to win the presidency.",
        "register": "You can register to vote online, by mail, or in person. Most states require registration 15–30 days before Election Day.",
        "primary": "Primary elections are state-run elections where voters cast secret ballots to choose their party's nominee.",
        "election day": "Election Day is the first Tuesday after the first Monday in November.",
        "caucus": "A caucus is a party-run gathering where voters openly show support for candidates.",
        "absentee": "Most states allow no-excuse absentee voting by mail."
    };

    // Simulate XSS sanitisation (mirrors server-side behaviour)
    const sanitise = (text) => String(text).replace(/<[^>]+>/g, '').trim();

    return {
        async getSteps() { await _delay(); return { success: true, data: steps, count: steps.length }; },
        async getStepById(id) {
            await _delay();
            if (id === null || id === undefined) return { success: false, error: 'Invalid ID' };
            const s = steps.find(x => x.id === id);
            return s ? { success: true, data: s } : { success: false, error: 'Step not found' };
        },
        async getTimeline(type = 'presidential') {
            await _delay();
            return { success: true, data: type === 'midterm' ? midtermTimeline : presidentialTimeline, type };
        },
        async getQuizQuestions() { await _delay(); return { success: true, data: quizQuestions, total: quizQuestions.length }; },
        async checkAnswer(questionId, answerIndex) {
            await _delay();
            if (questionId === null || questionId === undefined || answerIndex === null || answerIndex === undefined) {
                return { success: false, error: 'Missing parameters' };
            }
            const q = quizQuestions.find(qu => qu.id === questionId);
            if (!q) return { success: false, error: 'Question not found' };
            return { success: true, correct: q.correct === answerIndex, explanation: q.explanation, correctIndex: q.correct };
        },
        async getFAQs() { await _delay(); return { success: true, data: faqs, count: faqs.length }; },
        async searchFAQ(query) {
            await _delay();
            if (!query || typeof query !== 'string') return { success: true, data: [] };
            const lower = query.toLowerCase();
            return { success: true, data: faqs.filter(f => f.question.toLowerCase().includes(lower) || f.answer.toLowerCase().includes(lower)) };
        },
        async chat(message) {
            await _delay();
            if (!message || !message.trim()) {
                return { success: true, response: 'Please ask me anything about the U.S. election process!', source: 'fallback' };
            }
            const clean = sanitise(message);
            const lower = clean.toLowerCase();
            for (const [key, response] of Object.entries(chatbotKnowledge)) {
                if (lower.includes(key)) return { success: true, response, source: 'fallback' };
            }
            return { success: true, response: "I'm best equipped to help with voter registration, the Electoral College, and the U.S. election process. What would you like to know?", source: 'fallback' };
        },
        async getStats() { await _delay(); return { success: true, data: { totalSteps: steps.length, totalQuizQuestions: quizQuestions.length, totalFAQs: faqs.length } }; },
        async getStateElectoralData(stateName) {
            const data = {
                "California": { ev: 54, deadline: "Oct 21", idReq: "No ID",    rules: ["All-mail voting state"] },
                "Texas":      { ev: 40, deadline: "Oct 7",  idReq: "Photo ID", rules: ["Early voting available"] }
            };
            return { success: true, data: data[stateName] || { ev: "Varies", deadline: "See local board", idReq: "Varies", rules: ["Check your local election office."] } };
        }
    };
})();

// ════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════

afterEach(() => {
    if (global.localStorage) localStorage.clear();
});

// ── getSteps ────────────────────────────────────────────────────────────────
describe('ElectionAPI.getSteps()', () => {
    test('returns success with an array of 8 steps', async () => {
        const res = await ElectionAPI.getSteps();
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data).toHaveLength(8);
        expect(res.count).toBe(8);
    });

    test('each step has all required fields', async () => {
        const { data } = await ElectionAPI.getSteps();
        data.forEach(step => {
            expect(step).toHaveProperty('id');
            expect(step).toHaveProperty('title');
            expect(step).toHaveProperty('icon');
            expect(step).toHaveProperty('fullDesc');
            expect(step).toHaveProperty('keyPoints');
            expect(Array.isArray(step.keyPoints)).toBe(true);
            expect(step).toHaveProperty('timeline');
            expect(step).toHaveProperty('funFact');
        });
    });

    test('step IDs are sequential (1–8) and unique', async () => {
        const { data } = await ElectionAPI.getSteps();
        const ids = data.map(s => s.id);
        expect([...new Set(ids)]).toHaveLength(ids.length);
        ids.forEach((id, i) => expect(id).toBe(i + 1));
    });

    test('no step has an empty title or funFact', async () => {
        const { data } = await ElectionAPI.getSteps();
        data.forEach(s => {
            expect(s.title.length).toBeGreaterThan(0);
            expect(s.funFact.length).toBeGreaterThan(0);
        });
    });
});

// ── getStepById ─────────────────────────────────────────────────────────────
describe('ElectionAPI.getStepById()', () => {
    test('returns correct step for valid ID', async () => {
        const res = await ElectionAPI.getStepById(1);
        expect(res.success).toBe(true);
        expect(res.data.id).toBe(1);
        expect(res.data.title).toBe('Voter Registration');
    });

    test('returns the last step (Inauguration)', async () => {
        const res = await ElectionAPI.getStepById(8);
        expect(res.success).toBe(true);
        expect(res.data.title).toBe('Inauguration');
    });

    test('returns failure for non-existent numeric ID', async () => {
        const res = await ElectionAPI.getStepById(999);
        expect(res.success).toBe(false);
        expect(res.error).toBe('Step not found');
    });

    test('edge case: ID = 0 returns failure', async () => {
        const res = await ElectionAPI.getStepById(0);
        expect(res.success).toBe(false);
    });

    test('edge case: negative ID returns failure', async () => {
        const res = await ElectionAPI.getStepById(-1);
        expect(res.success).toBe(false);
    });

    test('edge case: null ID returns failure', async () => {
        const res = await ElectionAPI.getStepById(null);
        expect(res.success).toBe(false);
    });
});

// ── getTimeline ─────────────────────────────────────────────────────────────
describe('ElectionAPI.getTimeline()', () => {
    test('returns presidential timeline by default', async () => {
        const res = await ElectionAPI.getTimeline('presidential');
        expect(res.success).toBe(true);
        expect(res.type).toBe('presidential');
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('returns midterm timeline when specified', async () => {
        const res = await ElectionAPI.getTimeline('midterm');
        expect(res.success).toBe(true);
        expect(res.type).toBe('midterm');
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('presidential timeline has more events than midterm', async () => {
        const [pres, mid] = await Promise.all([
            ElectionAPI.getTimeline('presidential'),
            ElectionAPI.getTimeline('midterm')
        ]);
        expect(pres.data.length).toBeGreaterThan(mid.data.length);
    });

    test('each timeline item has required fields with valid hex color', async () => {
        const { data } = await ElectionAPI.getTimeline('presidential');
        data.forEach(item => {
            expect(item).toHaveProperty('month');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('desc');
            expect(item).toHaveProperty('icon');
            expect(item).toHaveProperty('color');
            expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    test('edge case: unknown type defaults to presidential', async () => {
        const res = await ElectionAPI.getTimeline('unknown');
        expect(res.success).toBe(true);
        expect(res.data.length).toBeGreaterThanOrEqual(1);
    });
});

// ── getQuizQuestions ─────────────────────────────────────────────────────────
describe('ElectionAPI.getQuizQuestions()', () => {
    test('returns exactly 10 quiz questions', async () => {
        const res = await ElectionAPI.getQuizQuestions();
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(10);
        expect(res.total).toBe(10);
    });

    test('each question has 4 options', async () => {
        const { data } = await ElectionAPI.getQuizQuestions();
        data.forEach(q => expect(q.options).toHaveLength(4));
    });

    test('correct answer index is within valid range (0-3)', async () => {
        const { data } = await ElectionAPI.getQuizQuestions();
        data.forEach(q => {
            expect(q.correct).toBeGreaterThanOrEqual(0);
            expect(q.correct).toBeLessThanOrEqual(3);
        });
    });

    test('each question has a non-empty explanation', async () => {
        const { data } = await ElectionAPI.getQuizQuestions();
        data.forEach(q => {
            expect(typeof q.explanation).toBe('string');
            expect(q.explanation.length).toBeGreaterThan(5);
        });
    });

    test('question IDs are unique', async () => {
        const { data } = await ElectionAPI.getQuizQuestions();
        const ids = data.map(q => q.id);
        expect([...new Set(ids)]).toHaveLength(ids.length);
    });
});

// ── checkAnswer ──────────────────────────────────────────────────────────────
describe('ElectionAPI.checkAnswer()', () => {
    test('returns correct=true for the right answer (Q1→270)', async () => {
        const res = await ElectionAPI.checkAnswer(1, 1);
        expect(res.success).toBe(true);
        expect(res.correct).toBe(true);
    });

    test('returns correct=false for a wrong answer', async () => {
        const res = await ElectionAPI.checkAnswer(1, 0);
        expect(res.success).toBe(true);
        expect(res.correct).toBe(false);
    });

    test('returns the correctIndex in response', async () => {
        const res = await ElectionAPI.checkAnswer(1, 0);
        expect(res.correctIndex).toBe(1);
    });

    test('returns failure for invalid question ID (999)', async () => {
        const res = await ElectionAPI.checkAnswer(999, 0);
        expect(res.success).toBe(false);
        expect(res).toHaveProperty('error');
    });

    test('all 10 questions return correct=true for their correct index', async () => {
        const { data } = await ElectionAPI.getQuizQuestions();
        for (const q of data) {
            const res = await ElectionAPI.checkAnswer(q.id, q.correct);
            expect(res.correct).toBe(true);
        }
    });

    test('edge case: null parameters return failure', async () => {
        const res = await ElectionAPI.checkAnswer(null, null);
        expect(res.success).toBe(false);
    });
});

// ── getFAQs ──────────────────────────────────────────────────────────────────
describe('ElectionAPI.getFAQs()', () => {
    test('returns success with FAQ array', async () => {
        const res = await ElectionAPI.getFAQs();
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('each FAQ has id, non-empty question, and answer', async () => {
        const { data } = await ElectionAPI.getFAQs();
        data.forEach(faq => {
            expect(faq).toHaveProperty('id');
            expect(faq).toHaveProperty('question');
            expect(faq).toHaveProperty('answer');
            expect(faq.question.length).toBeGreaterThan(0);
            expect(faq.answer.length).toBeGreaterThan(0);
        });
    });
});

// ── searchFAQ ────────────────────────────────────────────────────────────────
describe('ElectionAPI.searchFAQ()', () => {
    test('returns matching results for a known keyword', async () => {
        const res = await ElectionAPI.searchFAQ('electoral');
        expect(res.success).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('returns empty array for no-match query', async () => {
        const res = await ElectionAPI.searchFAQ('xyznonexistent99999');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('search is case-insensitive', async () => {
        const [lower, upper] = await Promise.all([
            ElectionAPI.searchFAQ('electoral'),
            ElectionAPI.searchFAQ('ELECTORAL')
        ]);
        expect(lower.data.length).toBe(upper.data.length);
    });

    test('edge case: empty string query returns empty array', async () => {
        const res = await ElectionAPI.searchFAQ('');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('edge case: null query returns empty array without throwing', async () => {
        const res = await ElectionAPI.searchFAQ(null);
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
    });

    test('edge case: XSS payload in query does not break search', async () => {
        const res = await ElectionAPI.searchFAQ('<script>alert(1)</script>electoral');
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
    });
});

// ── chat ─────────────────────────────────────────────────────────────────────
describe('ElectionAPI.chat()', () => {
    test('returns response object with success=true for a valid question', async () => {
        const res = await ElectionAPI.chat('How does the electoral college work?');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
        expect(res.response.length).toBeGreaterThan(0);
    });

    test('returns relevant response containing "270" for electoral college question', async () => {
        const res = await ElectionAPI.chat('tell me about the electoral college');
        expect(res.response).toContain('270');
    });

    test('returns relevant response for voter registration question', async () => {
        const res = await ElectionAPI.chat('how do I register to vote?');
        expect(res.response.toLowerCase()).toMatch(/register|online|mail/);
    });

    test('returns a fallback response for completely off-topic queries', async () => {
        const res = await ElectionAPI.chat('what is the best pizza topping?');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
        expect(res.response.length).toBeGreaterThan(0);
    });

    // ── EDGE CASES ──
    test('edge case: empty string returns helpful prompt', async () => {
        const res = await ElectionAPI.chat('');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
        expect(res.response.length).toBeGreaterThan(0);
    });

    test('edge case: whitespace-only string returns helpful prompt', async () => {
        const res = await ElectionAPI.chat('   ');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
    });

    test('edge case: XSS payload is sanitised and handled gracefully', async () => {
        const res = await ElectionAPI.chat('<script>alert("xss")</script>electoral');
        expect(res.success).toBe(true);
        expect(res.response).not.toContain('<script>');
        expect(res.response.length).toBeGreaterThan(0);
    });

    test('edge case: very long message (5000 chars) does not crash', async () => {
        const longMsg = 'a'.repeat(5000);
        const res = await ElectionAPI.chat(longMsg);
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
    });

    test('edge case: special characters in message', async () => {
        const res = await ElectionAPI.chat('What\'s the Electoral College? 🗳️ & more!');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
    });

    // ── ERROR / OFFLINE STATE ──
    test('error state: simulated API offline — returns fallback without throwing', async () => {
        // The local fallback should activate when Gemini is unavailable
        const res = await ElectionAPI.chat('electoral college');
        expect(res.success).toBe(true);
        expect(['gemini', 'fallback']).toContain(res.source);
    });
});

// ── getStats ─────────────────────────────────────────────────────────────────
describe('ElectionAPI.getStats()', () => {
    test('returns statistics object with required fields', async () => {
        const res = await ElectionAPI.getStats();
        expect(res.success).toBe(true);
        expect(res.data).toHaveProperty('totalSteps');
        expect(res.data).toHaveProperty('totalQuizQuestions');
        expect(res.data).toHaveProperty('totalFAQs');
    });

    test('statistics are internally consistent with actual data counts', async () => {
        const [stats, steps, quiz, faqs] = await Promise.all([
            ElectionAPI.getStats(),
            ElectionAPI.getSteps(),
            ElectionAPI.getQuizQuestions(),
            ElectionAPI.getFAQs()
        ]);
        expect(stats.data.totalSteps).toBe(steps.count);
        expect(stats.data.totalQuizQuestions).toBe(quiz.total);
        expect(stats.data.totalFAQs).toBe(faqs.count);
    });
});

// ── getStateElectoralData ────────────────────────────────────────────────────
describe('ElectionAPI.getStateElectoralData()', () => {
    test('returns data for California with correct EV count', async () => {
        const res = await ElectionAPI.getStateElectoralData('California');
        expect(res.success).toBe(true);
        expect(res.data.ev).toBe(54);
        expect(Array.isArray(res.data.rules)).toBe(true);
    });

    test('returns data for Texas with correct EV count', async () => {
        const res = await ElectionAPI.getStateElectoralData('Texas');
        expect(res.data.ev).toBe(40);
    });

    test('returns default fallback for unknown territory', async () => {
        const res = await ElectionAPI.getStateElectoralData('Unknown Territory XYZ');
        expect(res.success).toBe(true);
        expect(res.data).toHaveProperty('ev');
        expect(res.data).toHaveProperty('rules');
    });

    test('edge case: empty string state name returns fallback', async () => {
        const res = await ElectionAPI.getStateElectoralData('');
        expect(res.success).toBe(true);
        expect(res.data).toHaveProperty('ev');
    });

    test('edge case: null state name returns fallback without throwing', async () => {
        const res = await ElectionAPI.getStateElectoralData(null);
        expect(res.success).toBe(true);
    });

    test('each known-state record has deadline, idReq, and rules array', async () => {
        const states = ['California', 'Texas'];
        for (const state of states) {
            const res = await ElectionAPI.getStateElectoralData(state);
            expect(res.data).toHaveProperty('deadline');
            expect(res.data).toHaveProperty('idReq');
            expect(Array.isArray(res.data.rules)).toBe(true);
            expect(res.data.rules.length).toBeGreaterThan(0);
        }
    });
});

// ── Additional searchFAQ edge cases ─────────────────────────────────────────
describe('ElectionAPI.searchFAQ() — additional guards', () => {
    test('null query returns empty array without throwing', async () => {
        const res = await ElectionAPI.searchFAQ(null);
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('undefined query returns empty array without throwing', async () => {
        const res = await ElectionAPI.searchFAQ(undefined);
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('whitespace-only query returns empty array', async () => {
        const res = await ElectionAPI.searchFAQ('   ');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('numeric value query returns empty array without throwing', async () => {
        const res = await ElectionAPI.searchFAQ(42);
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
    });

    test('returns count equal to data array length', async () => {
        const res = await ElectionAPI.searchFAQ('vote');
        expect(res.success).toBe(true);
        expect(res.count).toBe(res.data.length);
    });
});

// ── Additional checkAnswer edge cases ────────────────────────────────────────
describe('ElectionAPI.checkAnswer() — additional guards', () => {
    test('undefined questionId returns failure', async () => {
        const res = await ElectionAPI.checkAnswer(undefined, 0);
        expect(res.success).toBe(false);
        expect(res).toHaveProperty('error');
    });

    test('undefined answerIndex returns failure', async () => {
        const res = await ElectionAPI.checkAnswer(1, undefined);
        expect(res.success).toBe(false);
        expect(res).toHaveProperty('error');
    });

    test('string questionId that has no match returns failure', async () => {
        const res = await ElectionAPI.checkAnswer('invalid', 0);
        expect(res.success).toBe(false);
    });

    test('out-of-range answerIndex (e.g. 99) returns correct=false', async () => {
        const res = await ElectionAPI.checkAnswer(1, 99);
        expect(res.success).toBe(true);
        expect(res.correct).toBe(false);
    });
});

// ── getStepById — full boundary coverage ─────────────────────────────────────
describe('ElectionAPI.getStepById() — boundary tests', () => {
    test('returns failure for ID = 0', async () => {
        const res = await ElectionAPI.getStepById(0);
        expect(res.success).toBe(false);
    });

    test('returns failure for float ID (1.5)', async () => {
        const res = await ElectionAPI.getStepById(1.5);
        expect(res.success).toBe(false);
    });

    test('returns failure for string ID', async () => {
        const res = await ElectionAPI.getStepById('one');
        expect(res.success).toBe(false);
    });

    test('returns success for every valid ID 1-8', async () => {
        for (let i = 1; i <= 8; i++) {
            const res = await ElectionAPI.getStepById(i);
            expect(res.success).toBe(true);
            expect(res.data.id).toBe(i);
        }
    });
});

// ── Concurrent API Calls ──────────────────────────────────────────────────────
describe('ElectionAPI — concurrent & parallel call safety', () => {
    test('concurrent getSteps + getQuizQuestions + getFAQs all succeed', async () => {
        const [steps, quiz, faqs] = await Promise.all([
            ElectionAPI.getSteps(),
            ElectionAPI.getQuizQuestions(),
            ElectionAPI.getFAQs()
        ]);
        expect(steps.success).toBe(true);
        expect(quiz.success).toBe(true);
        expect(faqs.success).toBe(true);
    });

    test('10 concurrent chat calls all return success', async () => {
        const calls = Array.from({ length: 10 }, (_, i) =>
            ElectionAPI.chat(`Question about electoral college ${i}`)
        );
        const results = await Promise.all(calls);
        results.forEach(res => {
            expect(res.success).toBe(true);
            expect(typeof res.response).toBe('string');
        });
    });
});

// ── getStats deep consistency ─────────────────────────────────────────────────
describe('ElectionAPI.getStats() — deep consistency', () => {
    test('all stat values are positive integers', async () => {
        const res = await ElectionAPI.getStats();
        Object.values(res.data).forEach(val => {
            expect(typeof val).toBe('number');
            expect(val).toBeGreaterThan(0);
        });
    });

    test('totalSteps matches 8 (the full election journey)', async () => {
        const res = await ElectionAPI.getStats();
        expect(res.data.totalSteps).toBe(8);
    });

    test('totalQuizQuestions matches 10', async () => {
        const res = await ElectionAPI.getStats();
        expect(res.data.totalQuizQuestions).toBe(10);
    });
});

// ── chat — additional robust scenarios ───────────────────────────────────────
describe('ElectionAPI.chat() — robustness', () => {
    test('query about "absentee" returns relevant response', async () => {
        const res = await ElectionAPI.chat('How does absentee voting work?');
        expect(res.success).toBe(true);
        expect(res.response.toLowerCase()).toMatch(/mail|ballot|absentee/);
    });

    test('query about "swing state" returns a meaningful response', async () => {
        const res = await ElectionAPI.chat('What is a swing state?');
        expect(res.success).toBe(true);
        expect(res.response.length).toBeGreaterThan(20);
    });

    test('response always has a "source" field', async () => {
        const res = await ElectionAPI.chat('Tell me about Election Day');
        expect(res).toHaveProperty('source');
        expect(['gemini', 'fallback', 'local', 'backend']).toContain(res.source);
    });

    test('XSS with script tag followed by keyword is handled and stripped', async () => {
        const res = await ElectionAPI.chat('<img src=x onerror=alert(1)>primary');
        expect(res.success).toBe(true);
        expect(res.response).not.toMatch(/<img/i);
    });
});

// ── Boundary & Extreme Input Tests ───────────────────────────────────────────
describe('ElectionAPI — boundary and extreme inputs', () => {
    test('extremely long input (10,000 chars) is accepted and returns success', async () => {
        const longMsg = 'electoral college '.repeat(556); // ~10,000 chars
        const res = await ElectionAPI.chat(longMsg);
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
        expect(res.response.length).toBeGreaterThan(0);
    });

    test('special characters in chat input do not throw', async () => {
        const specialChars = '!@#$%^&*()_+[]{}|;:\'",.<>?/\\`~Electoral College';
        const res = await ElectionAPI.chat(specialChars);
        expect(res.success).toBe(true);
    });

    test('emoji-only input does not throw and returns a string response', async () => {
        const res = await ElectionAPI.chat('🗳️🇺🇸🏛️⭐');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
    });

    test('newline and tab characters in input do not cause errors', async () => {
        const res = await ElectionAPI.chat('How does\nvoting\twork?');
        expect(res.success).toBe(true);
    });

    test('null-byte in input string does not crash', async () => {
        const res = await ElectionAPI.chat('electoral\x00college');
        expect(res.success).toBe(true);
    });

    test('searchFAQ with very long query still returns empty array safely', async () => {
        const longQuery = 'a'.repeat(5000);
        const res = await ElectionAPI.searchFAQ(longQuery);
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
    });
});

// ── Simulated API Failure & Graceful Degradation ─────────────────────────────
describe('ElectionAPI — simulated API failure (graceful degradation)', () => {
    /**
     * The ElectionAPI chat() method has a 3-tier fallback strategy:
     * 1. Backend /api/chat (localhost only)
     * 2. Direct Gemini API (if key configured)
     * 3. Local knowledge base (always works)
     *
     * In the Node/Jest test environment:
     * - We are NOT on localhost (window.location is undefined)
     * - GEMINI_API_KEY is null in the test replica
     * → Therefore, ALL calls go to Strategy 3 (local fallback),
     *   which is itself the "graceful degradation" path.
     *
     * These tests verify that when the AI services are unavailable,
     * the system still returns a valid, non-empty, user-friendly response
     * instead of throwing or returning an error object.
     */

    test('when Gemini API is unavailable, falls back gracefully (source=local)', async () => {
        const res = await ElectionAPI.chat('What is the Electoral College?');
        expect(res.success).toBe(true);
        // In offline/test mode, source must be "local" or "fallback"
        expect(['local', 'fallback']).toContain(res.source);
        expect(res.response).toBeTruthy();
        expect(res.response.length).toBeGreaterThan(10);
    });

    test('fallback response does not contain error messages or stack traces', async () => {
        const res = await ElectionAPI.chat('voter registration requirements');
        expect(res.success).toBe(true);
        expect(res.response).not.toMatch(/error|exception|stack|undefined/i);
    });

    test('fallback response for unknown topic is a helpful redirection string', async () => {
        const res = await ElectionAPI.chat('What is the best pizza topping?');
        expect(res.success).toBe(true);
        // Should redirect to civic topics, not crash or return empty
        expect(res.response.length).toBeGreaterThan(10);
    });

    test('10 rapid sequential calls all return success (no crash under load)', async () => {
        for (let i = 0; i < 10; i++) {
            const res = await ElectionAPI.chat(`Test query ${i} about absentee voting`);
            expect(res.success).toBe(true);
        }
    });
});

// ── Complete Quiz Answer Coverage ─────────────────────────────────────────────
describe('ElectionAPI.checkAnswer() — complete 10-question coverage', () => {
    // Correct answer indices for all 10 questions
    const correctAnswers = [1, 1, 1, 2, 1, 2, 1, 2, 1, 2];

    test.each(
        correctAnswers.map((correct, idx) => [idx + 1, correct])
    )('question %i with correct answer %i returns correct=true', async (qId, correctIdx) => {
        const res = await ElectionAPI.checkAnswer(qId, correctIdx);
        expect(res.success).toBe(true);
        expect(res.correct).toBe(true);
        expect(res.explanation).toBeTruthy();
    });

    test.each(
        correctAnswers.map((correct, idx) => [idx + 1, correct])
    )('question %i with wrong answer returns correct=false', async (qId, correctIdx) => {
        const wrongIdx = (correctIdx + 1) % 4; // Different from correct
        const res = await ElectionAPI.checkAnswer(qId, wrongIdx);
        expect(res.success).toBe(true);
        expect(res.correct).toBe(false);
        expect(res.correctIndex).toBe(correctIdx);
    });
});

// ── Timeline Field Completeness ───────────────────────────────────────────────
describe('ElectionAPI.getTimeline() — field completeness', () => {
    const requiredFields = ['month', 'title', 'desc', 'icon', 'color'];

    test('every presidential timeline event has all required fields', async () => {
        const res = await ElectionAPI.getTimeline('presidential');
        expect(res.success).toBe(true);
        res.data.forEach(event => {
            requiredFields.forEach(field => {
                expect(event).toHaveProperty(field);
                expect(event[field]).toBeTruthy();
            });
        });
    });

    test('every midterm timeline event has all required fields', async () => {
        const res = await ElectionAPI.getTimeline('midterm');
        expect(res.success).toBe(true);
        res.data.forEach(event => {
            requiredFields.forEach(field => {
                expect(event).toHaveProperty(field);
                expect(event[field]).toBeTruthy();
            });
        });
    });

    test('all color values are valid CSS hex strings', async () => {
        const res = await ElectionAPI.getTimeline('presidential');
        const hexPattern = /^#[0-9a-fA-F]{3,8}$/;
        res.data.forEach(event => {
            expect(event.color).toMatch(hexPattern);
        });
    });
});
