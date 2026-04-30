/**
 * Election Data API Module
 * Simulates a backend REST API with comprehensive election process data.
 * All data endpoints return Promises to mimic async API calls.
 */
'use strict';
const ElectionAPI = (() => {
    // Simulate network latency
    const _delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

    // ── ELECTION STEPS DATA ──
    const steps = [
        {
            id: 1,
            title: "Voter Registration",
            icon: "👤",
            shortDesc: "Register to participate in elections",
            fullDesc: "Voter registration is the first and most fundamental step in the democratic process. Eligible citizens must register before they can vote in any election. This process ensures the integrity of elections by maintaining accurate voter rolls.",
            keyPoints: [
                "Most states require registration 15–30 days before Election Day",
                "Some states offer same-day registration at polling places",
                "You can register online, by mail, or in person in most states",
                "You must be a U.S. citizen, meet your state's residency requirements, and be 18 years old by Election Day",
                "The National Voter Registration Act (1993) made registration more accessible"
            ],
            timeline: "Ongoing — deadlines vary by state",
            funFact: "North Dakota is the only state that does not require voter registration."
        },
        {
            id: 2,
            title: "Candidate Announcements",
            icon: "📢",
            shortDesc: "Candidates declare their intention to run",
            fullDesc: "Potential candidates officially announce their campaigns, often 1–2 years before the general election. This phase involves building campaign teams, fundraising, and beginning to share their platform with voters.",
            keyPoints: [
                "Presidential candidates typically announce 12–18 months before the election",
                "Candidates must file with the Federal Election Commission (FEC)",
                "Campaign finance laws regulate how much money can be raised and spent",
                "Candidates begin traveling the country to build support",
                "Exploratory committees are often formed before official announcements"
            ],
            timeline: "Spring of the year before election",
            funFact: "The earliest presidential campaign announcement was by Ted Cruz in March 2015, about 20 months before Election Day 2016."
        },
        {
            id: 3,
            title: "Primaries & Caucuses",
            icon: "🗳️",
            shortDesc: "Parties select their candidates through voter participation",
            fullDesc: "Primary elections and caucuses are how political parties choose their nominees. Primaries are state-run elections where voters cast secret ballots, while caucuses are party-run gatherings where participants openly show support for candidates.",
            keyPoints: [
                "Iowa traditionally holds the first caucus; New Hampshire the first primary",
                "Open primaries allow any registered voter; closed primaries restrict to party members",
                "Delegates are awarded based on primary/caucus results",
                "Super Tuesday features multiple states voting on the same day",
                "Candidates who perform poorly may drop out during this phase"
            ],
            timeline: "February – June of election year",
            funFact: "The Iowa caucuses have been a key early indicator since 1972, though their schedule has changed in recent cycles."
        },
        {
            id: 4,
            title: "National Conventions",
            icon: "🎪",
            shortDesc: "Parties officially nominate their presidential candidates",
            fullDesc: "Each major political party holds a national convention, typically in the summer before the general election. Delegates from across the country gather to officially nominate the party's presidential and vice-presidential candidates.",
            keyPoints: [
                "Delegates formally cast votes to nominate the presidential candidate",
                "The vice-presidential running mate is announced",
                "The party platform — a statement of goals and principles — is adopted",
                "Conventions feature keynote speeches from party leaders",
                "Modern conventions are largely ceremonial but serve to unify the party"
            ],
            timeline: "July – August of election year",
            funFact: "The first national political convention was held by the Anti-Masonic Party in 1831."
        },
        {
            id: 5,
            title: "General Election Campaign",
            icon: "📺",
            shortDesc: "Candidates campaign nationwide for voter support",
            fullDesc: "After the conventions, nominees from each party campaign vigorously across the country. This phase includes presidential debates, advertising, rallies, and intensive outreach to swing states.",
            keyPoints: [
                "Presidential debates are organized by the Commission on Presidential Debates",
                "Candidates focus heavily on swing states that could go either way",
                "Campaign spending reaches its peak during this phase",
                "Early voting and absentee ballot requests begin",
                "Media coverage and polls intensify as Election Day approaches"
            ],
            timeline: "September – November of election year",
            funFact: "The first televised presidential debate was between John F. Kennedy and Richard Nixon in 1960."
        },
        {
            id: 6,
            title: "Election Day",
            icon: "🇺🇸",
            shortDesc: "Citizens cast their votes for President and other offices",
            fullDesc: "Election Day is held on the first Tuesday after the first Monday in November. Voters across the country cast their ballots at polling places, by mail, or through early voting. Results are tallied and reported throughout the evening.",
            keyPoints: [
                "Polls are open for specific hours determined by each state",
                "Voters select candidates for President, Congress, and local offices",
                "Most states use electronic voting machines or paper ballots",
                "Exit polls provide early indications of results",
                "Results in close races may take days or weeks to finalize"
            ],
            timeline: "First Tuesday after the first Monday in November",
            funFact: "Election Day was established in 1845. Tuesday was chosen because it gave farmers a day to travel to polling places after Sunday worship."
        },
        {
            id: 7,
            title: "Electoral College Vote",
            icon: "🏛️",
            shortDesc: "Electors formally cast votes for President",
            fullDesc: "The President is not directly elected by popular vote but through the Electoral College. Each state has a number of electors equal to its total Congressional representation. Electors meet in their state capitals in December to formally cast their votes.",
            keyPoints: [
                "There are 538 total electoral votes; 270 are needed to win",
                "Most states use a winner-take-all system for awarding electoral votes",
                "Maine and Nebraska use a congressional district method",
                "Faithless electors — those who vote against their state's popular vote — are rare",
                "Congress certifies the electoral vote results in January"
            ],
            timeline: "First Monday after the second Wednesday in December",
            funFact: "The Electoral College has elected a president who lost the popular vote five times in U.S. history."
        },
        {
            id: 8,
            title: "Inauguration",
            icon: "⭐",
            shortDesc: "The President-elect takes the oath of office",
            fullDesc: "Inauguration Day marks the peaceful transfer of power. The President-elect takes the oath of office on the steps of the U.S. Capitol, delivers an inaugural address, and begins their four-year term.",
            keyPoints: [
                "Inauguration Day is January 20th (established by the 20th Amendment in 1933)",
                "The Chief Justice of the Supreme Court administers the oath",
                "The inaugural address outlines the new President's vision and priorities",
                "A parade from the Capitol to the White House follows the ceremony",
                "Inaugural balls and celebrations take place throughout the evening"
            ],
            timeline: "January 20th following the election",
            funFact: "William Henry Harrison's 1841 inaugural address was the longest at 8,445 words — and he died 31 days later, partly from a cold caught during the speech."
        }
    ];

    // ── TIMELINE DATA ──
    const presidentialTimeline = [
        { month: "Spring (Year Before)", title: "Candidate Announcements", desc: "Candidates begin declaring their campaigns and forming exploratory committees.", icon: "📢", color: "#6366f1" },
        { month: "Feb – Mar", title: "Early Primaries & Caucuses", desc: "Iowa, New Hampshire, and other early states hold their contests.", icon: "🗳️", color: "#8b5cf6" },
        { month: "March (Super Tuesday)", title: "Super Tuesday", desc: "Multiple states hold primaries on a single day, often deciding the nominees.", icon: "⚡", color: "#a855f7" },
        { month: "Mar – Jun", title: "Remaining Primaries", desc: "States continue holding primaries and caucuses to allocate delegates.", icon: "📊", color: "#d946ef" },
        { month: "Jul – Aug", title: "National Conventions", desc: "Parties officially nominate their presidential and VP candidates.", icon: "🎪", color: "#ec4899" },
        { month: "Sep – Oct", title: "Presidential Debates", desc: "Candidates participate in nationally televised debates.", icon: "📺", color: "#f43f5e" },
        { month: "Early Oct – Nov", title: "Early Voting Begins", desc: "Many states allow voters to cast ballots before Election Day.", icon: "📬", color: "#ef4444" },
        { month: "First Tue after First Mon in Nov", title: "Election Day", desc: "Voters across the nation cast their ballots.", icon: "🇺🇸", color: "#f97316" },
        { month: "December", title: "Electoral College Votes", desc: "Electors formally cast their votes in state capitals.", icon: "🏛️", color: "#eab308" },
        { month: "January 6", title: "Congressional Certification", desc: "Congress meets in joint session to certify the electoral vote.", icon: "📜", color: "#84cc16" },
        { month: "January 20", title: "Inauguration Day", desc: "The new President takes the oath of office.", icon: "⭐", color: "#22c55e" }
    ];

    const midtermTimeline = [
        { month: "Spring", title: "Filing Deadlines", desc: "Candidates file paperwork to appear on primary ballots.", icon: "📝", color: "#6366f1" },
        { month: "May – Sep", title: "Primary Elections", desc: "Parties hold primaries to select candidates for Congress and state offices.", icon: "🗳️", color: "#8b5cf6" },
        { month: "Sep – Oct", title: "Campaign Season", desc: "Candidates debate and campaign for House, Senate, and state positions.", icon: "📺", color: "#ec4899" },
        { month: "Early Oct – Nov", title: "Early Voting", desc: "Early voting and absentee balloting begins in many states.", icon: "📬", color: "#ef4444" },
        { month: "First Tue after First Mon in Nov", title: "Election Day", desc: "All 435 House seats, ~33 Senate seats, and many state offices are decided.", icon: "🇺🇸", color: "#f97316" },
        { month: "Jan 3", title: "New Congress Convenes", desc: "Newly elected members of Congress are sworn in.", icon: "🏛️", color: "#22c55e" }
    ];

    // ── QUIZ DATA ──
    const quizQuestions = [
        {
            id: 1,
            question: "How many electoral votes are needed to win the U.S. presidency?",
            options: ["200", "270", "300", "538"],
            correct: 1,
            explanation: "A candidate needs 270 out of 538 total electoral votes to win the presidency."
        },
        {
            id: 2,
            question: "When is Inauguration Day?",
            options: ["January 1", "January 20", "February 1", "December 25"],
            correct: 1,
            explanation: "Inauguration Day is January 20th, established by the 20th Amendment in 1933."
        },
        {
            id: 3,
            question: "What is the difference between a primary and a caucus?",
            options: [
                "There is no difference",
                "Primaries are state-run secret ballot elections; caucuses are party-run open gatherings",
                "Caucuses use electronic voting; primaries use paper",
                "Primaries are only for presidential elections"
            ],
            correct: 1,
            explanation: "Primaries are state-administered elections with secret ballots, while caucuses are organized by political parties and involve open discussion and voting."
        },
        {
            id: 4,
            question: "Which state does NOT require voter registration?",
            options: ["Texas", "California", "North Dakota", "Florida"],
            correct: 2,
            explanation: "North Dakota is the only state that does not require voter registration. Voters just need a valid ID."
        },
        {
            id: 5,
            question: "When is Election Day held?",
            options: [
                "The last Monday in October",
                "The first Tuesday after the first Monday in November",
                "November 1st every year",
                "The second Wednesday in November"
            ],
            correct: 1,
            explanation: "Election Day is the first Tuesday after the first Monday in November, established by Congress in 1845."
        },
        {
            id: 6,
            question: "How many total electoral votes exist in the Electoral College?",
            options: ["435", "500", "538", "600"],
            correct: 2,
            explanation: "There are 538 electoral votes total — 435 for House members, 100 for Senators, and 3 for Washington D.C."
        },
        {
            id: 7,
            question: "What event typically occurs in July or August of an election year?",
            options: [
                "Primary elections",
                "National party conventions",
                "Electoral College voting",
                "Inauguration"
            ],
            correct: 1,
            explanation: "National party conventions are held in summer where parties officially nominate their presidential candidates."
        },
        {
            id: 8,
            question: "Who administers the presidential oath of office?",
            options: [
                "The Vice President",
                "The Speaker of the House",
                "The Chief Justice of the Supreme Court",
                "The Secretary of State"
            ],
            correct: 2,
            explanation: "The Chief Justice of the Supreme Court traditionally administers the presidential oath of office."
        },
        {
            id: 9,
            question: "What is 'Super Tuesday'?",
            options: [
                "The day Congress certifies election results",
                "A day when many states hold primaries simultaneously",
                "The last day to register to vote",
                "The day after Election Day"
            ],
            correct: 1,
            explanation: "Super Tuesday is a day early in the primary season when many states hold their primary elections simultaneously, often determining the party nominees."
        },
        {
            id: 10,
            question: "How often are U.S. presidential elections held?",
            options: ["Every 2 years", "Every 3 years", "Every 4 years", "Every 6 years"],
            correct: 2,
            explanation: "U.S. presidential elections are held every four years, in years divisible by four."
        }
    ];

    // ── FAQ DATA ──
    const faqs = [
        {
            id: 1,
            question: "Who is eligible to vote in U.S. elections?",
            answer: "To vote in U.S. elections, you must be a U.S. citizen, be 18 years or older on Election Day, meet your state's residency requirements, and be registered to vote (except in North Dakota). Some states restore voting rights to people with felony convictions after they complete their sentence."
        },
        {
            id: 2,
            question: "What is the Electoral College and why does it exist?",
            answer: "The Electoral College is a body of 538 electors who formally elect the President and Vice President. It was created by the Founding Fathers as a compromise between election by Congress and election by popular vote. Each state gets electors equal to its number of House representatives plus its two Senators. The system was designed to balance the influence of large and small states."
        },
        {
            id: 3,
            question: "Can I vote if I'm living abroad or in the military?",
            answer: "Yes! The Uniformed and Overseas Citizens Absentee Voting Act (UOCAVA) protects the right of U.S. citizens living abroad and military members to vote absentee in federal elections. You can register and request a ballot through the Federal Voting Assistance Program (FVAP)."
        },
        {
            id: 4,
            question: "What is the difference between midterm and presidential elections?",
            answer: "Presidential elections occur every 4 years and include voting for the President, all 435 House seats, about a third of the Senate, and many state/local offices. Midterm elections happen 2 years after a presidential election and include all House seats, about a third of the Senate, and state/local offices, but NOT the presidency."
        },
        {
            id: 5,
            question: "How does early voting and absentee voting work?",
            answer: "Early voting allows you to cast your ballot in person before Election Day during a designated period. Absentee voting lets you vote by mail. Some states require an excuse for absentee voting, while others allow any voter to vote by mail. A few states conduct all elections entirely by mail."
        },
        {
            id: 6,
            question: "What happens if no candidate gets 270 electoral votes?",
            answer: "If no presidential candidate receives 270 electoral votes, the election goes to the House of Representatives (a 'contingent election'). Each state delegation gets one vote, and a candidate needs 26 state votes to win. The Senate chooses the Vice President, with each Senator getting one vote. This has happened twice: in 1800 and 1824."
        },
        {
            id: 7,
            question: "What are swing states and why are they important?",
            answer: "Swing states (or battleground states) are states where both major parties have similar levels of support, meaning the state could be won by either candidate. These states receive disproportionate attention during campaigns because winning them can determine the overall election outcome. Examples have included Pennsylvania, Michigan, Wisconsin, Arizona, and Georgia."
        },
        {
            id: 8,
            question: "How are congressional districts drawn?",
            answer: "Congressional districts are redrawn every 10 years after the census through a process called redistricting. In most states, the state legislature draws the district lines, though some states use independent commissions. Gerrymandering — drawing districts to benefit a particular party — is a contentious issue in this process."
        }
    ];

    // ── CHATBOT KNOWLEDGE BASE ──
    const chatbotKnowledge = {
        "electoral college": "The Electoral College consists of 538 electors. When you vote for a presidential candidate, you're actually voting for a slate of electors pledged to that candidate. Each state gets electors equal to its Congressional representation (House + Senate). Most states award all electoral votes to the popular vote winner (winner-take-all). A candidate needs 270 electoral votes to win. If no one reaches 270, the House of Representatives decides the election.",
        "register": "You can register to vote online (in most states), by mail, or in person at your local election office or DMV. Requirements include being a U.S. citizen, meeting state residency requirements, and being 18 by Election Day. Registration deadlines vary by state — typically 15-30 days before an election. Some states offer same-day registration. North Dakota is the only state that doesn't require registration.",
        "primary": "Primary elections are state-run elections where party members vote by secret ballot to choose their party's candidates. There are several types: closed primaries (only registered party members), open primaries (any registered voter), and semi-closed/semi-open variations. Primaries run from February through June.",
        "caucus": "A caucus is a local gathering of registered party members who openly discuss and vote for their preferred candidates. Unlike the secret-ballot primary, caucuses involve public participation and can last several hours. They typically have lower turnout than primaries but encourage deep civic engagement.",
        "debate": "Presidential debates are organized events where major candidates discuss policy issues and respond to questions. The Commission on Presidential Debates has organized them since 1987. There are typically 3 presidential debates and 1 vice-presidential debate during the general election campaign. These debates can significantly influence undecided voters.",
        "inauguration": "Inauguration Day is January 20th following a presidential election, as established by the 20th Amendment (1933). The ceremony takes place on the steps of the U.S. Capitol. The Chief Justice of the Supreme Court administers the oath of office. The new President delivers an inaugural address outlining their vision. A parade and inaugural balls follow.",
        "election day": "Election Day is the first Tuesday after the first Monday in November. This date was established by Congress in 1845. Polls are open for specific hours set by each state. Voters can cast ballots for President, Congress, and local offices. Many states also offer early voting and absentee voting options before Election Day.",
        "swing state": "Swing states (battleground states) are states where the outcome could go to either major party. They receive outsized attention from campaigns because winning them can determine the election. Examples include Pennsylvania, Michigan, Wisconsin, Arizona, Georgia, and Nevada. These states can change over time as demographics shift.",
        "absentee": "Absentee voting allows you to cast a ballot by mail if you can't vote in person. Some states require a valid excuse (like travel or illness), while others allow any voter to request an absentee ballot. A few states (Oregon, Washington, Colorado, etc.) conduct all elections entirely by mail. The process involves requesting a ballot, filling it out, and returning it by the deadline.",
        "convention": "National party conventions are held in the summer before the presidential election. Delegates who were chosen during primaries and caucuses formally nominate the party's presidential candidate. The VP pick is announced, the party platform is adopted, and key speeches aim to unify the party and energize voters.",
        "campaign finance": "Campaign finance in the U.S. is regulated by the Federal Election Commission (FEC). Key rules include contribution limits for individuals and PACs, disclosure requirements, and restrictions on corporate/union contributions. The Supreme Court's Citizens United decision (2010) allowed unlimited independent political spending by corporations and unions through Super PACs.",
        "gerrymandering": "Gerrymandering is the manipulation of electoral district boundaries to favor a particular party. After each census, districts are redrawn (redistricting). Techniques include 'packing' (concentrating opposition voters) and 'cracking' (spreading them across districts). Some states use independent commissions to combat partisan gerrymandering.",
        "faithless elector": "A faithless elector is a member of the Electoral College who does not vote for the candidate they pledged to support. While rare, it has occurred throughout history. As of 2020, 33 states and D.C. have laws against faithless electors. The Supreme Court ruled in 2020 (Chiafalo v. Washington) that states can enforce these laws.",
        "amendment": "Several Constitutional amendments relate to voting rights: the 15th (race), 19th (women's suffrage), 24th (abolishing poll taxes), and 26th (lowering voting age to 18). The 12th Amendment revised Electoral College procedures, and the 20th Amendment set Inauguration Day as January 20th.",
        "midterm": "Midterm elections occur two years after a presidential election. All 435 House seats, roughly one-third of Senate seats, and many state and local positions are on the ballot. Historically, the president's party tends to lose seats in midterms. Voter turnout is typically lower than in presidential election years.",
        "popular vote": "The popular vote is the total number of votes cast by citizens across the country. While important, the President is technically elected through the Electoral College, not the popular vote. There have been five instances where a candidate won the presidency while losing the popular vote, most recently in 2016."
    };

    // ── GEMINI API CONFIGURATION ──
    // Replace with your actual Gemini API key. Set to null to use offline fallback.
    // Get a free key at: https://aistudio.google.com/
    const GEMINI_API_KEY = (typeof window !== 'undefined' && window.GEMINI_API_KEY) || null;
    // Only construct endpoint if a real key is available
    const GEMINI_ENDPOINT = GEMINI_API_KEY
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`
        : null;

    /**
     * Call the real Google Gemini API for a conversational response.
     * @param {string} userMessage - The user's question.
     * @returns {Promise<string>} The AI's response text.
     */
    const _callGeminiAPI = async (userMessage) => {
        const systemPrompt = `You are ElectBot, a highly advanced, expert AI political analyst for the ElectEd platform.
Your mission is to provide deeply informative, professional, and precise educational insights about the U.S. election process.

Scope of Expertise:
- Voter registration nuances, deadlines, and state-specific laws.
- Deep historical and practical knowledge of Primaries, Caucuses, and National Conventions.
- Expert analysis of the Electoral College, its math, and its impact on strategy.
- Insightful explanation of Swing States, Gerrymandering, and Redistricting.
- Clear breakdowns of Campaign Finance, FEC rules, and Super PACs.
- Non-partisan analysis of Election Day logistics and voting rights.

Response Guidelines:
- Be concise (2-5 sentences) but dense with value.
- Maintain absolute non-partisanship and professional neutrality.
- If asked about non-election topics, politely refocus on civic education.
- Use a helpful, authoritative, and sophisticated tone.`;

        const body = {
            contents: [
                {
                    role: "user",
                    parts: [{ text: `[SYSTEM]: ${systemPrompt}\n\n[USER QUESTION]: ${userMessage}` }]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 512
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
        };

        const res = await fetch(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err?.error?.message || `Gemini API error: ${res.status}`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response from Gemini API');
        return text.trim();
    };

    /**
     * Fallback: local knowledge-base keyword matching (used when no API key is set).
     * @param {string} message - The user's message.
     * @returns {string} A matched or generic response.
     */
    const _localChatFallback = (message) => {
        const lower = message.toLowerCase();
        let bestMatch = null;
        let bestScore = 0;
        for (const [key, response] of Object.entries(chatbotKnowledge)) {
            const keywords = key.split(" ");
            let score = 0;
            for (const kw of keywords) {
                if (lower.includes(kw)) score += 1;
            }
            if (lower.includes(key)) score += 3;
            if (score > bestScore) {
                bestScore = score;
                bestMatch = response;
            }
        }
        if (bestMatch && bestScore >= 1) return bestMatch;
        return "That's a great question! While I don't have a specific answer for that, I can help with topics like voter registration, primaries & caucuses, the Electoral College, debates, Election Day, inauguration, campaign finance, swing states, gerrymandering, and constitutional amendments related to voting. Try asking about one of these topics!";
    };

    // ── API METHODS ──
    return {
        /**
         * Fetches the list of election steps.
         * @async
         * @returns {Promise<{success: boolean, data: Array, count: number}>}
         */
        async getSteps() {
            await _delay(150);
            return { success: true, data: steps, count: steps.length };
        },
        /**
         * Fetches a specific election step by ID.
         * @async
         * @param {number} id - The step ID.
         * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
         */
        async getStepById(id) {
            await _delay(100);
            const step = steps.find(s => s.id === id);
            return step ? { success: true, data: step } : { success: false, error: "Step not found" };
        },
        /**
         * Fetches the timeline data for a given election type.
         * @async
         * @param {string} [type="presidential"] - The election type ("presidential" or "midterm").
         * @returns {Promise<{success: boolean, data: Array, type: string}>}
         */
        async getTimeline(type = "presidential") {
            await _delay(150);
            const data = type === "midterm" ? midtermTimeline : presidentialTimeline;
            return { success: true, data, type };
        },
        /**
         * Fetches the list of quiz questions.
         * @async
         * @returns {Promise<{success: boolean, data: Array, total: number}>}
         */
        async getQuizQuestions() {
            await _delay(100);
            return { success: true, data: quizQuestions, total: quizQuestions.length };
        },
        /**
         * Checks the answer for a quiz question.
         * @async
         * @param {number} questionId - The ID of the question.
         * @param {number} answerIndex - The index of the user's selected answer.
         * @returns {Promise<{success: boolean, correct: boolean, explanation: string, correctIndex: number}>}
         */
        async checkAnswer(questionId, answerIndex) {
            await _delay(80);
            const q = quizQuestions.find(qu => qu.id === questionId);
            if (!q) return { success: false, error: "Question not found" };
            const correct = q.correct === answerIndex;
            return { success: true, correct, explanation: q.explanation, correctIndex: q.correct };
        },
        /**
         * Fetches the list of FAQs.
         * @async
         * @returns {Promise<{success: boolean, data: Array, count: number}>}
         */
        async getFAQs() {
            await _delay(100);
            return { success: true, data: faqs, count: faqs.length };
        },
        /**
         * Searches for FAQs matching a query.
         * @async
         * @param {string} query - The search query.
         * @returns {Promise<{success: boolean, data: Array, count: number}>}
         */
        async searchFAQ(query) {
            await _delay(100);
            const lower = query.toLowerCase();
            const results = faqs.filter(f => f.question.toLowerCase().includes(lower) || f.answer.toLowerCase().includes(lower));
            return { success: true, data: results, count: results.length };
        },
        /**
         * Send a message to ElectBot — powered by Google Gemini API.
         * Falls back to local keyword matching if no API key is configured.
         * @param {string} message - The user's question.
         * @returns {Promise<{success: boolean, response: string, source: string}>}
         */
        async chat(message) {
            if (!message || typeof message !== 'string' || !message.trim()) {
                return { success: true, response: 'Please ask me a question about the election process!', source: 'local' };
            }

            // Client-side XSS sanitisation: strip HTML tags before sending
            const sanitised = String(message).replace(/<[^>]+>/g, '').trim().slice(0, 500);

            // ── STRATEGY 1: Python backend /api/chat (Gemini with system instructions) ──
            // Only attempts when running on localhost (same-origin server)
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                try {
                    const res = await fetch('/api/chat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: sanitised }),
                        signal: AbortSignal.timeout(8000)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.response) {
                            return { success: true, response: data.response, source: data.source || 'backend' };
                        }
                    }
                } catch (_) {
                    // Server unreachable — fall through to next strategy
                }
            }

            // ── STRATEGY 2: Direct Gemini API (if key is set in config.js) ──
            if (GEMINI_API_KEY && GEMINI_ENDPOINT) {
                try {
                    const response = await _callGeminiAPI(sanitised);
                    return { success: true, response, source: 'gemini' };
                } catch (err) {
                    console.warn('[ElectionAPI] Gemini API error, using local fallback:', err.message);
                }
            }

            // ── STRATEGY 3: Local knowledge base fallback (always works offline) ──
            await _delay(300 + Math.random() * 300);
            return { success: true, response: _localChatFallback(sanitised), source: 'local' };
        },
        /**
         * Fetches general platform statistics.
         * @async
         * @returns {Promise<{success: boolean, data: Object}>}
         */
        async getStats() {
            await _delay(50);
            return {
                success: true,
                data: {
                    totalSteps: steps.length,
                    totalQuizQuestions: quizQuestions.length,
                    totalFAQs: faqs.length,
                    totalTimelineEvents: presidentialTimeline.length,
                    electionCycleMonths: 18
                }
            };
        },
        /**
         * Fetches electoral data for a specific state.
         * @async
         * @param {string} stateName - The name of the state.
         * @returns {Promise<{success: boolean, data: Object}>}
         */
        async getStateElectoralData(stateName) {
            await _delay(50);
            const data = {
                "Alabama":        { ev: 9,  deadline: "Oct 21",      idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Alaska":         { ev: 3,  deadline: "Oct 6",       idReq: "ID required",           rules: ["Online registration", "No-excuse absentee", "Same-day reg"] },
                "Arizona":        { ev: 11, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "Permanent early voting list", "Automatic voter reg"] },
                "Arkansas":       { ev: 6,  deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Mail/in-person reg", "No-excuse absentee", "Early voting"] },
                "California":     { ev: 54, deadline: "Oct 21",      idReq: "No ID",                 rules: ["All-mail voting state", "Same-day registration", "Automatic voter reg"] },
                "Colorado":       { ev: 10, deadline: "Election Day", idReq: "ID required",          rules: ["All-mail voting state", "Same-day registration", "Automatic voter reg"] },
                "Connecticut":    { ev: 7,  deadline: "Oct 31",      idReq: "No ID (first time)",    rules: ["Online registration", "No-excuse absentee", "Same-day reg"] },
                "Delaware":       { ev: 3,  deadline: "Oct 11",      idReq: "No ID",                 rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Florida":        { ev: 30, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Georgia":        { ev: 16, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "Automatic voter reg", "No-excuse absentee"] },
                "Hawaii":         { ev: 4,  deadline: "Election Day", idReq: "No ID",                rules: ["All-mail voting state", "Same-day registration", "Automatic voter reg"] },
                "Idaho":          { ev: 4,  deadline: "Election Day", idReq: "ID required",          rules: ["Online registration", "No-excuse absentee", "Same-day reg"] },
                "Illinois":       { ev: 19, deadline: "Election Day", idReq: "No ID",                rules: ["Online registration", "No-excuse absentee", "Automatic voter reg"] },
                "Indiana":        { ev: 11, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "Excuse required for absentee", "Early voting"] },
                "Iowa":           { ev: 6,  deadline: "Oct 23",      idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Kansas":         { ev: 6,  deadline: "Oct 18",      idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Kentucky":       { ev: 8,  deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Louisiana":      { ev: 8,  deadline: "Oct 14",      idReq: "Photo ID",              rules: ["Online registration", "Excuse required for absentee", "Early voting"] },
                "Maine":          { ev: 4,  deadline: "Election Day", idReq: "No ID",                rules: ["Congressional district method", "Same-day registration", "All-mail option"] },
                "Maryland":       { ev: 10, deadline: "Oct 22",      idReq: "No ID",                 rules: ["Online registration", "No-excuse absentee", "Automatic voter reg"] },
                "Massachusetts":  { ev: 11, deadline: "Oct 26",      idReq: "No ID",                 rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Michigan":       { ev: 15, deadline: "Election Day", idReq: "ID required",          rules: ["Same-day registration", "No-excuse absentee", "Automatic voter reg"] },
                "Minnesota":      { ev: 10, deadline: "Election Day", idReq: "ID required",          rules: ["Same-day registration", "No-excuse absentee", "Online registration"] },
                "Mississippi":    { ev: 6,  deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "Limited absentee voting", "Early voting"] },
                "Missouri":       { ev: 10, deadline: "Oct 9",       idReq: "Photo ID",              rules: ["Online registration", "Excuse required for absentee", "Early voting"] },
                "Montana":        { ev: 4,  deadline: "Election Day", idReq: "ID required",          rules: ["Online registration", "No-excuse absentee", "Same-day reg"] },
                "Nebraska":       { ev: 5,  deadline: "Oct 25",      idReq: "Photo ID",              rules: ["Congressional district method", "No-excuse absentee", "Early voting"] },
                "Nevada":         { ev: 6,  deadline: "Oct 8",       idReq: "No ID",                 rules: ["All-mail voting state", "Same-day registration", "Automatic voter reg"] },
                "New Hampshire":  { ev: 4,  deadline: "Election Day", idReq: "Photo ID",             rules: ["Same-day registration", "No-excuse absentee", "First primary state"] },
                "New Jersey":     { ev: 14, deadline: "Oct 14",      idReq: "No ID",                 rules: ["Online registration", "No-excuse absentee", "Automatic voter reg"] },
                "New Mexico":     { ev: 5,  deadline: "Oct 8",       idReq: "No ID",                 rules: ["Online registration", "No-excuse absentee", "Automatic voter reg"] },
                "New York":       { ev: 28, deadline: "Oct 26",      idReq: "No ID",                 rules: ["Online registration", "Early voting available", "Automatic voter reg"] },
                "North Carolina": { ev: 16, deadline: "Oct 11",      idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "North Dakota":   { ev: 3,  deadline: "N/A",         idReq: "ID required",           rules: ["No registration required", "No-excuse absentee", "Early voting"] },
                "Ohio":           { ev: 17, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Oklahoma":       { ev: 7,  deadline: "Oct 11",      idReq: "Photo ID",              rules: ["Online registration", "Excuse required for absentee", "Early voting"] },
                "Oregon":         { ev: 8,  deadline: "Oct 15",      idReq: "No ID",                 rules: ["All-mail voting state", "Same-day registration", "Automatic voter reg"] },
                "Pennsylvania":   { ev: 19, deadline: "Oct 21",      idReq: "No ID (first time)",    rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Rhode Island":   { ev: 4,  deadline: "Oct 6",       idReq: "No ID",                 rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "South Carolina": { ev: 9,  deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "Excuse required for absentee", "Early voting"] },
                "South Dakota":   { ev: 3,  deadline: "Oct 21",      idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Tennessee":      { ev: 11, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Online registration", "Excuse required for absentee", "Early voting"] },
                "Texas":          { ev: 40, deadline: "Oct 7",       idReq: "Photo ID",              rules: ["Mail/in-person reg", "Limited absentee voting", "Early voting"] },
                "Utah":           { ev: 6,  deadline: "Oct 28",      idReq: "ID required",           rules: ["All-mail voting state", "Online registration", "Same-day reg"] },
                "Vermont":        { ev: 3,  deadline: "Election Day", idReq: "No ID",                rules: ["Same-day registration", "No-excuse absentee", "All-mail option"] },
                "Virginia":       { ev: 13, deadline: "Oct 14",      idReq: "Photo ID",              rules: ["Online registration", "No-excuse absentee", "Automatic voter reg"] },
                "Washington":     { ev: 12, deadline: "Oct 28",      idReq: "No ID",                 rules: ["All-mail voting state", "Same-day registration", "Automatic voter reg"] },
                "West Virginia":  { ev: 4,  deadline: "Oct 14",      idReq: "ID required",           rules: ["Online registration", "No-excuse absentee", "Early voting"] },
                "Wisconsin":      { ev: 10, deadline: "Election Day", idReq: "Photo ID",             rules: ["Same-day registration", "No-excuse absentee", "Online registration"] },
                "Wyoming":        { ev: 3,  deadline: "Election Day", idReq: "ID required",          rules: ["Same-day registration", "No-excuse absentee", "Online registration"] },
                "District of Columbia": { ev: 3, deadline: "Oct 18", idReq: "No ID",                rules: ["Online registration", "All-mail option", "Automatic voter reg"] }
            };
            // Default for others
            return { success: true, data: data[stateName] || { ev: "Varies", deadline: "See local board", idReq: "Varies", rules: ["Check your local election office for specific rules."] } };
        }
    };
})();
