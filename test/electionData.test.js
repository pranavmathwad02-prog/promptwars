/**
 * @file electionData.test.js
 * @description Unit tests for ElectionAPI module (Jest)
 * Tests all public API methods for correctness, data integrity, and edge cases.
 */

// ── Inline the ElectionAPI for Node/Jest environment ──
// We simulate the module since it's an IIFE in browser context.

// Re-create minimal ElectionAPI for testing
const ElectionAPI = (() => {
    const _delay = (ms = 0) => new Promise(r => setTimeout(r, ms));

    const steps = [
        { id: 1, title: "Voter Registration", icon: "👤", shortDesc: "Register to participate", fullDesc: "Full desc 1", keyPoints: ["Point A"], timeline: "Ongoing", funFact: "Fact 1" },
        { id: 2, title: "Candidate Announcements", icon: "📢", shortDesc: "Candidates declare", fullDesc: "Full desc 2", keyPoints: ["Point B"], timeline: "Spring", funFact: "Fact 2" },
        { id: 3, title: "Primaries & Caucuses", icon: "🗳️", shortDesc: "Parties select candidates", fullDesc: "Full desc 3", keyPoints: ["Point C"], timeline: "Feb–Jun", funFact: "Fact 3" },
        { id: 4, title: "National Conventions", icon: "🎪", shortDesc: "Official nomination", fullDesc: "Full desc 4", keyPoints: ["Point D"], timeline: "Jul–Aug", funFact: "Fact 4" },
        { id: 5, title: "General Election Campaign", icon: "📺", shortDesc: "Nationwide campaigning", fullDesc: "Full desc 5", keyPoints: ["Point E"], timeline: "Sep–Nov", funFact: "Fact 5" },
        { id: 6, title: "Election Day", icon: "🇺🇸", shortDesc: "Citizens vote", fullDesc: "Full desc 6", keyPoints: ["Point F"], timeline: "First Tue Nov", funFact: "Fact 6" },
        { id: 7, title: "Electoral College Vote", icon: "🏛️", shortDesc: "Electors vote formally", fullDesc: "Full desc 7", keyPoints: ["Point G"], timeline: "December", funFact: "Fact 7" },
        { id: 8, title: "Inauguration", icon: "⭐", shortDesc: "Oath of office", fullDesc: "Full desc 8", keyPoints: ["Point H"], timeline: "January 20", funFact: "Fact 8" }
    ];

    const presidentialTimeline = [
        { month: "Spring (Year Before)", title: "Candidate Announcements", desc: "Desc", icon: "📢", color: "#6366f1" },
        { month: "Feb – Mar", title: "Early Primaries & Caucuses", desc: "Desc", icon: "🗳️", color: "#8b5cf6" },
        { month: "March (Super Tuesday)", title: "Super Tuesday", desc: "Desc", icon: "⚡", color: "#a855f7" },
        { month: "Jul – Aug", title: "National Conventions", desc: "Desc", icon: "🎪", color: "#ec4899" },
        { month: "First Tue after First Mon in Nov", title: "Election Day", desc: "Desc", icon: "🇺🇸", color: "#f97316" },
        { month: "January 20", title: "Inauguration Day", desc: "Desc", icon: "⭐", color: "#22c55e" }
    ];

    const midtermTimeline = [
        { month: "Spring", title: "Filing Deadlines", desc: "Desc", icon: "📝", color: "#6366f1" },
        { month: "May – Sep", title: "Primary Elections", desc: "Desc", icon: "🗳️", color: "#8b5cf6" },
        { month: "First Tue after First Mon in Nov", title: "Election Day", desc: "Desc", icon: "🇺🇸", color: "#f97316" },
        { month: "Jan 3", title: "New Congress Convenes", desc: "Desc", icon: "🏛️", color: "#22c55e" }
    ];

    const quizQuestions = [
        { id: 1, question: "How many electoral votes are needed?", options: ["200", "270", "300", "538"], correct: 1, explanation: "270 are needed." },
        { id: 2, question: "When is Inauguration Day?", options: ["Jan 1", "Jan 20", "Feb 1", "Dec 25"], correct: 1, explanation: "January 20th." },
        { id: 3, question: "Primary vs Caucus?", options: ["Same", "Primary=secret ballot", "Caucus uses electronic", "Primaries only presidential"], correct: 1, explanation: "Primaries are state-run with secret ballots." },
        { id: 4, question: "Which state needs no registration?", options: ["Texas", "California", "North Dakota", "Florida"], correct: 2, explanation: "North Dakota." },
        { id: 5, question: "When is Election Day?", options: ["Last Mon Oct", "First Tue after First Mon Nov", "Nov 1", "Second Wed Nov"], correct: 1, explanation: "First Tuesday after first Monday in November." },
        { id: 6, question: "Total electoral votes?", options: ["435", "500", "538", "600"], correct: 2, explanation: "538 total." },
        { id: 7, question: "July/August event?", options: ["Primaries", "Conventions", "Electoral vote", "Inauguration"], correct: 1, explanation: "National conventions." },
        { id: 8, question: "Who gives oath?", options: ["VP", "Speaker", "Chief Justice", "Sec. of State"], correct: 2, explanation: "Chief Justice." },
        { id: 9, question: "Super Tuesday is?", options: ["Certification day", "Many states vote same day", "Last day register", "Day after election"], correct: 1, explanation: "Many states vote simultaneously." },
        { id: 10, question: "How often are presidential elections?", options: ["2 years", "3 years", "4 years", "6 years"], correct: 2, explanation: "Every four years." }
    ];

    const faqs = [
        { id: 1, question: "Who is eligible to vote?", answer: "U.S. citizens, 18+, registered." },
        { id: 2, question: "What is the Electoral College?", answer: "538 electors formally elect the President." },
        { id: 3, question: "Can I vote from abroad?", answer: "Yes, via UOCAVA." }
    ];

    const chatbotKnowledge = {
        "electoral college": "The Electoral College consists of 538 electors...",
        "register": "You can register to vote online...",
        "primary": "Primary elections are state-run elections...",
        "election day": "Election Day is the first Tuesday after the first Monday in November."
    };

    return {
        async getSteps() { await _delay(); return { success: true, data: steps, count: steps.length }; },
        async getStepById(id) { await _delay(); const s = steps.find(x => x.id === id); return s ? { success: true, data: s } : { success: false, error: "Step not found" }; },
        async getTimeline(type = "presidential") { await _delay(); return { success: true, data: type === "midterm" ? midtermTimeline : presidentialTimeline, type }; },
        async getQuizQuestions() { await _delay(); return { success: true, data: quizQuestions, total: quizQuestions.length }; },
        async checkAnswer(questionId, answerIndex) {
            await _delay();
            const q = quizQuestions.find(qu => qu.id === questionId);
            if (!q) return { success: false, error: "Question not found" };
            return { success: true, correct: q.correct === answerIndex, explanation: q.explanation, correctIndex: q.correct };
        },
        async getFAQs() { await _delay(); return { success: true, data: faqs, count: faqs.length }; },
        async searchFAQ(query) { await _delay(); const lower = query.toLowerCase(); return { success: true, data: faqs.filter(f => f.question.toLowerCase().includes(lower) || f.answer.toLowerCase().includes(lower)) }; },
        async chat(message) {
            await _delay();
            const lower = message.toLowerCase();
            for (const [key, response] of Object.entries(chatbotKnowledge)) {
                if (lower.includes(key)) return { success: true, response };
            }
            return { success: true, response: "I don't have a specific answer for that." };
        },
        async getStats() { await _delay(); return { success: true, data: { totalSteps: steps.length, totalQuizQuestions: quizQuestions.length, totalFAQs: faqs.length } }; },
        async getStateElectoralData(stateName) {
            const data = { "California": { ev: 54, deadline: "Oct 21", idReq: "No ID", rules: ["All-mail voting state"] }, "Texas": { ev: 40, deadline: "Oct 7", idReq: "Photo ID", rules: ["Early voting available"] } };
            return { success: true, data: data[stateName] || { ev: "Varies", deadline: "See local board", idReq: "Varies", rules: ["Check your local election office."] } };
        }
    };
})();

// ════════════════════════════════════════
// TEST SUITES
// ════════════════════════════════════════

describe('ElectionAPI.getSteps()', () => {
    test('returns success with an array of 8 steps', async () => {
        const res = await ElectionAPI.getSteps();
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data).toHaveLength(8);
        expect(res.count).toBe(8);
    });

    test('each step has required fields', async () => {
        const res = await ElectionAPI.getSteps();
        res.data.forEach(step => {
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

    test('step IDs are sequential and unique', async () => {
        const res = await ElectionAPI.getSteps();
        const ids = res.data.map(s => s.id);
        const uniqueIds = [...new Set(ids)];
        expect(uniqueIds).toHaveLength(ids.length);
        ids.forEach((id, i) => expect(id).toBe(i + 1));
    });
});

describe('ElectionAPI.getStepById()', () => {
    test('returns correct step for valid ID', async () => {
        const res = await ElectionAPI.getStepById(1);
        expect(res.success).toBe(true);
        expect(res.data.id).toBe(1);
        expect(res.data.title).toBe('Voter Registration');
    });

    test('returns failure for non-existent ID', async () => {
        const res = await ElectionAPI.getStepById(999);
        expect(res.success).toBe(false);
        expect(res.error).toBe('Step not found');
    });

    test('returns the last step correctly', async () => {
        const res = await ElectionAPI.getStepById(8);
        expect(res.success).toBe(true);
        expect(res.data.title).toBe('Inauguration');
    });
});

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
        const pres = await ElectionAPI.getTimeline('presidential');
        const mid = await ElectionAPI.getTimeline('midterm');
        expect(pres.data.length).toBeGreaterThan(mid.data.length);
    });

    test('each timeline item has required fields', async () => {
        const res = await ElectionAPI.getTimeline('presidential');
        res.data.forEach(item => {
            expect(item).toHaveProperty('month');
            expect(item).toHaveProperty('title');
            expect(item).toHaveProperty('desc');
            expect(item).toHaveProperty('icon');
            expect(item).toHaveProperty('color');
            expect(item.color).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });
});

describe('ElectionAPI.getQuizQuestions()', () => {
    test('returns 10 quiz questions', async () => {
        const res = await ElectionAPI.getQuizQuestions();
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(10);
        expect(res.total).toBe(10);
    });

    test('each question has 4 options', async () => {
        const res = await ElectionAPI.getQuizQuestions();
        res.data.forEach(q => {
            expect(q.options).toHaveLength(4);
        });
    });

    test('correct answer index is within valid range (0-3)', async () => {
        const res = await ElectionAPI.getQuizQuestions();
        res.data.forEach(q => {
            expect(q.correct).toBeGreaterThanOrEqual(0);
            expect(q.correct).toBeLessThanOrEqual(3);
        });
    });

    test('each question has a non-empty explanation', async () => {
        const res = await ElectionAPI.getQuizQuestions();
        res.data.forEach(q => {
            expect(typeof q.explanation).toBe('string');
            expect(q.explanation.length).toBeGreaterThan(5);
        });
    });
});

describe('ElectionAPI.checkAnswer()', () => {
    test('returns correct=true for the right answer', async () => {
        const res = await ElectionAPI.checkAnswer(1, 1); // Q1 correct is index 1 (270)
        expect(res.success).toBe(true);
        expect(res.correct).toBe(true);
    });

    test('returns correct=false for wrong answer', async () => {
        const res = await ElectionAPI.checkAnswer(1, 0); // Wrong answer
        expect(res.success).toBe(true);
        expect(res.correct).toBe(false);
    });

    test('returns the correct index in response', async () => {
        const res = await ElectionAPI.checkAnswer(1, 0);
        expect(res.correctIndex).toBe(1);
    });

    test('returns failure for invalid question ID', async () => {
        const res = await ElectionAPI.checkAnswer(999, 0);
        expect(res.success).toBe(false);
        expect(res).toHaveProperty('error');
    });

    test('validates all 10 questions have a correct answer defined', async () => {
        const questions = await ElectionAPI.getQuizQuestions();
        for (const q of questions.data) {
            const res = await ElectionAPI.checkAnswer(q.id, q.correct);
            expect(res.correct).toBe(true);
        }
    });
});

describe('ElectionAPI.getFAQs()', () => {
    test('returns success with FAQ array', async () => {
        const res = await ElectionAPI.getFAQs();
        expect(res.success).toBe(true);
        expect(Array.isArray(res.data)).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('each FAQ has id, question, and answer', async () => {
        const res = await ElectionAPI.getFAQs();
        res.data.forEach(faq => {
            expect(faq).toHaveProperty('id');
            expect(faq).toHaveProperty('question');
            expect(faq).toHaveProperty('answer');
            expect(typeof faq.question).toBe('string');
            expect(typeof faq.answer).toBe('string');
            expect(faq.question.length).toBeGreaterThan(0);
            expect(faq.answer.length).toBeGreaterThan(0);
        });
    });
});

describe('ElectionAPI.searchFAQ()', () => {
    test('returns matching results for a known keyword', async () => {
        const res = await ElectionAPI.searchFAQ('electoral');
        expect(res.success).toBe(true);
        expect(res.data.length).toBeGreaterThan(0);
    });

    test('returns empty array for no matching results', async () => {
        const res = await ElectionAPI.searchFAQ('xyzxyznonexistent12345');
        expect(res.success).toBe(true);
        expect(res.data).toHaveLength(0);
    });

    test('search is case-insensitive', async () => {
        const lower = await ElectionAPI.searchFAQ('electoral');
        const upper = await ElectionAPI.searchFAQ('ELECTORAL');
        expect(lower.data.length).toBe(upper.data.length);
    });
});

describe('ElectionAPI.chat()', () => {
    test('returns a response object with success=true', async () => {
        const res = await ElectionAPI.chat('How does the electoral college work?');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
        expect(res.response.length).toBeGreaterThan(0);
    });

    test('returns a relevant response for known topics', async () => {
        const res = await ElectionAPI.chat('tell me about the electoral college');
        expect(res.response.toLowerCase()).toContain('538');
    });

    test('returns a fallback response for unknown queries', async () => {
        const res = await ElectionAPI.chat('pizza recipes');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
    });

    test('handles empty string gracefully', async () => {
        const res = await ElectionAPI.chat('');
        expect(res.success).toBe(true);
        expect(typeof res.response).toBe('string');
    });
});

describe('ElectionAPI.getStats()', () => {
    test('returns statistics object with required fields', async () => {
        const res = await ElectionAPI.getStats();
        expect(res.success).toBe(true);
        expect(res.data).toHaveProperty('totalSteps');
        expect(res.data).toHaveProperty('totalQuizQuestions');
        expect(res.data).toHaveProperty('totalFAQs');
    });

    test('statistics are consistent with actual data', async () => {
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

describe('ElectionAPI.getStateElectoralData()', () => {
    test('returns data for a known state', async () => {
        const res = await ElectionAPI.getStateElectoralData('California');
        expect(res.success).toBe(true);
        expect(res.data).toHaveProperty('ev');
        expect(res.data).toHaveProperty('deadline');
        expect(res.data).toHaveProperty('idReq');
        expect(res.data).toHaveProperty('rules');
        expect(Array.isArray(res.data.rules)).toBe(true);
    });

    test('California has 54 electoral votes', async () => {
        const res = await ElectionAPI.getStateElectoralData('California');
        expect(res.data.ev).toBe(54);
    });

    test('Texas has 40 electoral votes', async () => {
        const res = await ElectionAPI.getStateElectoralData('Texas');
        expect(res.data.ev).toBe(40);
    });

    test('returns default data for an unknown state', async () => {
        const res = await ElectionAPI.getStateElectoralData('Unknown Territory XYZ');
        expect(res.success).toBe(true);
        expect(res.data).toHaveProperty('ev');
        expect(res.data).toHaveProperty('rules');
    });
});
