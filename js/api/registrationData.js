/**
 * Data Persistence & Registration API Module
 * Handles voter registration, candidate data, and localStorage persistence.
 */
'use strict';
const RegistrationAPI = (() => {
    const STORAGE_KEYS = {
        voters: 'elected_registered_voters',
        quizScores: 'elected_quiz_scores',
        userPrefs: 'elected_user_prefs'
    };

    const _delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

    // Helper to read/write localStorage
    const _get = (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } };
    const _set = (key, data) => { localStorage.setItem(key, JSON.stringify(data)); };
    const _getObj = (key) => { try { return JSON.parse(localStorage.getItem(key)) || {}; } catch { return {}; } };

    // ── CANDIDATE DATA ──
    const candidates = [
        {
            id: 1, name: "Sarah Mitchell", party: "Democratic Party", position: "President",
            state: "California", age: 54, slogan: "Unity Through Progress",
            platform: ["Universal healthcare expansion", "Climate action plan", "Education reform", "Infrastructure investment"],
            photo: null, color: "#3b82f6"
        },
        {
            id: 2, name: "James Crawford", party: "Republican Party", position: "President",
            state: "Texas", age: 61, slogan: "Strength & Prosperity",
            platform: ["Tax reform", "Border security", "Economic growth", "Military strength"],
            photo: null, color: "#ef4444"
        },
        {
            id: 3, name: "Maria Gonzalez", party: "Democratic Party", position: "Senate",
            state: "Florida", age: 47, slogan: "A Voice for Every Family",
            platform: ["Affordable housing", "Immigration reform", "Workers' rights", "Small business support"],
            photo: null, color: "#3b82f6"
        },
        {
            id: 4, name: "Robert Chen", party: "Republican Party", position: "Senate",
            state: "Ohio", age: 52, slogan: "Common Sense Leadership",
            platform: ["Deficit reduction", "Veterans support", "Energy independence", "Law enforcement funding"],
            photo: null, color: "#ef4444"
        },
        {
            id: 5, name: "Dr. Amara Johnson", party: "Independent", position: "President",
            state: "Virginia", age: 49, slogan: "Beyond Party Lines",
            platform: ["Campaign finance reform", "Term limits", "Bipartisan solutions", "Technology innovation"],
            photo: null, color: "#8b5cf6"
        },
        {
            id: 6, name: "Michael Torres", party: "Democratic Party", position: "House",
            state: "New York", age: 38, slogan: "Building Tomorrow Today",
            platform: ["Green energy jobs", "Student debt relief", "Public transit", "Digital rights"],
            photo: null, color: "#3b82f6"
        },
        {
            id: 7, name: "Elizabeth Harper", party: "Republican Party", position: "Governor",
            state: "Georgia", age: 55, slogan: "Georgia First",
            platform: ["State tax cuts", "School choice", "Rural development", "Public safety"],
            photo: null, color: "#ef4444"
        },
        {
            id: 8, name: "David Nakamura", party: "Independent", position: "Senate",
            state: "Washington", age: 44, slogan: "Integrity in Action",
            platform: ["Tech regulation", "Environmental protection", "Healthcare access", "Electoral reform"],
            photo: null, color: "#8b5cf6"
        }
    ];

    return {
        // ── VOTER REGISTRATION ──
        /**
         * Registers a new voter in the system.
         * Communicates with the backend API or falls back to validation.
         * @async
         * @param {Object} voterData - The voter's information.
         * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
         */
        async registerVoter(voterData) {
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

            const payload = {
                fullName: fullName.trim(),
                email: email.trim().toLowerCase(),
                state,
                dob,
                age,
                partyAffiliation: partyAffiliation || "Unaffiliated",
                registeredAt: new Date().toISOString()
            };

            try {
                const res = await fetch('/api/voters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                let data;
                try {
                    data = await res.json();
                } catch {
                    throw new Error('Server returned an invalid response.');
                }
                if (!res.ok || !data.success) {
                    throw new Error(data.error || `Server error: ${res.status}`);
                }
                return data;
            } catch (err) {
                // Surface the real error (validation or network)
                return { success: false, error: err.message };
            }
        },

        /**
         * Fetches the list of all registered voters.
         * @async
         * @returns {Promise<{success: boolean, data: Array, count: number}>}
         */
        async getRegisteredVoters() {
            try {
                const res = await fetch('/api/voters');
                if (!res.ok) throw new Error(`Server error: ${res.status}`);
                const data = await res.json();
                if (!data.success) throw new Error(data.error || 'Failed to fetch voters.');
                return data;
            } catch (err) {
                // Fallback to localStorage if server is unreachable
                console.warn('[RegistrationAPI] Server unavailable, using localStorage fallback:', err.message);
                const voters = _get(STORAGE_KEYS.voters);
                return { success: true, data: voters, count: voters.length };
            }
        },

        /**
         * Calculates registration statistics by party and state.
         * @async
         * @returns {Promise<{success: boolean, data: Object}>}
         */
        async getRegistrationStats() {
            const res = await this.getRegisteredVoters();
            if (!res.success) return { success: false };
            const voters = res.data;
            const byParty = {};
            const byState = {};
            voters.forEach(v => {
                byParty[v.partyAffiliation] = (byParty[v.partyAffiliation] || 0) + 1;
                byState[v.state] = (byState[v.state] || 0) + 1;
            });
            return { success: true, data: { total: voters.length, byParty, byState } };
        },

        /**
         * Deletes a voter registration by ID.
         * @async
         * @param {number} id - The voter ID to delete.
         * @returns {Promise<{success: boolean, message: string}>}
         */
        async deleteVoter(id) {
            try {
                const res = await fetch(`/api/voters/${id}`, { method: 'DELETE' });
                const data = await res.json();
                return data;
            } catch (err) {
                let voters = _get(STORAGE_KEYS.voters);
                voters = voters.filter(v => v.id !== id);
                _set(STORAGE_KEYS.voters, voters);
                return { success: true, message: "Voter registration removed." };
            }
        },

        // ── CANDIDATES ──
        /**
         * Fetches a list of election candidates with optional filtering.
         * @async
         * @param {Object} [filter={}] - Filtering criteria (party, position).
         * @returns {Promise<{success: boolean, data: Array, count: number}>}
         */
        async getCandidates(filter = {}) {
            await _delay(150);
            let result = [...candidates];
            if (filter.party) result = result.filter(c => c.party === filter.party);
            if (filter.position) result = result.filter(c => c.position === filter.position);
            return { success: true, data: result, count: result.length };
        },

        /**
         * Fetches a specific candidate by ID.
         * @async
         * @param {number} id - The candidate ID.
         * @returns {Promise<{success: boolean, data: Object}|{success: boolean, error: string}>}
         */
        async getCandidateById(id) {
            await _delay(100);
            const c = candidates.find(c => c.id === id);
            return c ? { success: true, data: c } : { success: false, error: "Candidate not found." };
        },

        // ── QUIZ SCORE PERSISTENCE ──
        /**
         * Persists a quiz score in localStorage.
         * @async
         * @param {number} score - The number of correct answers.
         * @param {number} total - The total number of questions.
         * @returns {Promise<{success: boolean, data: Object}>}
         */
        async saveQuizScore(score, total) {
            await _delay(50);
            const scores = _get(STORAGE_KEYS.quizScores);
            const entry = { score, total, percentage: Math.round((score / total) * 100), date: new Date().toISOString() };
            scores.push(entry);
            _set(STORAGE_KEYS.quizScores, scores);
            return { success: true, data: entry };
        },

        /**
         * Fetches the user's quiz history from localStorage.
         * @async
         * @returns {Promise<{success: boolean, data: Array, count: number, bestScore: number}>}
         */
        async getQuizHistory() {
            await _delay(50);
            const scores = _get(STORAGE_KEYS.quizScores);
            return { success: true, data: scores, count: scores.length, bestScore: scores.length ? Math.max(...scores.map(s => s.percentage)) : 0 };
        },

        // ── USER PREFERENCES ──
        /**
         * Saves a user preference to localStorage.
         * @async
         * @param {string} key - The preference key.
         * @param {string} value - The preference value.
         * @returns {Promise<{success: boolean}>}
         */
        async savePreference(key, value) {
            const prefs = _getObj(STORAGE_KEYS.userPrefs);
            prefs[key] = value;
            _set(STORAGE_KEYS.userPrefs, prefs);
            return { success: true };
        },

        /**
         * Fetches all user preferences from localStorage.
         * @async
         * @returns {Promise<{success: boolean, data: Object}>}
         */
        async getPreferences() {
            return { success: true, data: _getObj(STORAGE_KEYS.userPrefs) };
        },

        // ── US STATES LIST ──
        /**
         * Returns a list of all U.S. states.
         * @returns {string[]}
         */
        getStates() {
            return ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming","District of Columbia"];
        },

        // ── POLLING BOOTHS ──
        /**
         * Fetches a list of polling booths with optional searching and state filtering.
         * @async
         * @param {Object} [filter={}] - Filtering criteria (search, state).
         * @returns {Promise<{success: boolean, data: Array, count: number}>}
         */
        async getPollingBooths(filter = {}) {
            await _delay(100);
            const booths = [
                { id: 1, name: "Washington Community Center", address: "1234 Constitution Ave NW", city: "Washington", state: "District of Columbia", lat: 38.8977, lng: -77.0365, hours: "6:00 AM - 8:00 PM", status: "open", accessible: true, type: "Community Center" },
                { id: 2, name: "Lincoln High School Gym", address: "500 E 65th St", city: "New York", state: "New York", lat: 40.7614, lng: -73.9776, hours: "6:00 AM - 9:00 PM", status: "open", accessible: true, type: "School" },
                { id: 3, name: "City Hall Annex", address: "200 N Spring St", city: "Los Angeles", state: "California", lat: 34.0522, lng: -118.2437, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Government Building" },
                { id: 4, name: "Riverside Public Library", address: "3581 Mission Inn Ave", city: "Chicago", state: "Illinois", lat: 41.8781, lng: -87.6298, hours: "7:00 AM - 7:00 PM", status: "open", accessible: true, type: "Library" },
                { id: 5, name: "Heritage Baptist Church", address: "1800 Main St", city: "Houston", state: "Texas", lat: 29.7604, lng: -95.3698, hours: "7:00 AM - 7:00 PM", status: "open", accessible: false, type: "Church" },
                { id: 6, name: "Westside Recreation Center", address: "4500 W Broad St", city: "Phoenix", state: "Arizona", lat: 33.4484, lng: -112.0740, hours: "6:00 AM - 7:00 PM", status: "open", accessible: true, type: "Recreation Center" },
                { id: 7, name: "Downtown Fire Station #7", address: "700 2nd Ave", city: "Philadelphia", state: "Pennsylvania", lat: 39.9526, lng: -75.1652, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Fire Station" },
                { id: 8, name: "Bexar County Courthouse", address: "100 Dolorosa", city: "San Antonio", state: "Texas", lat: 29.4241, lng: -98.4936, hours: "8:00 AM - 5:00 PM", status: "limited", accessible: true, type: "Courthouse" },
                { id: 9, name: "Mission Bay Community Hall", address: "1200 4th St", city: "San Diego", state: "California", lat: 32.7157, lng: -117.1611, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Community Center" },
                { id: 10, name: "North Dallas Senior Center", address: "3800 N Belt Line Rd", city: "Dallas", state: "Texas", lat: 32.7767, lng: -96.7970, hours: "Closed for renovation", status: "closed", accessible: false, type: "Senior Center" },
                { id: 11, name: "Fulton County Board Office", address: "130 Peachtree St NW", city: "Atlanta", state: "Georgia", lat: 33.7490, lng: -84.3880, hours: "8:00 AM - 6:00 PM", status: "limited", accessible: true, type: "Government Building" },
                { id: 12, name: "Coconut Grove Library", address: "2875 McFarlane Rd", city: "Miami", state: "Florida", lat: 25.7617, lng: -80.1918, hours: "7:00 AM - 7:00 PM", status: "open", accessible: true, type: "Library" },
                { id: 13, name: "Pioneer Courthouse Square", address: "701 SW 6th Ave", city: "Portland", state: "Oregon", lat: 45.5152, lng: -122.6784, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Public Building" },
                { id: 14, name: "Ballard Community Center", address: "6020 28th Ave NW", city: "Seattle", state: "Washington", lat: 47.6062, lng: -122.3321, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Community Center" },
                { id: 15, name: "Faneuil Hall", address: "4 S Market St", city: "Boston", state: "Massachusetts", lat: 42.3601, lng: -71.0589, hours: "6:00 AM - 8:00 PM", status: "open", accessible: true, type: "Historic Building" },
                { id: 16, name: "Midtown Fire Rescue Station", address: "2812 Hennepin Ave", city: "Minneapolis", state: "Minnesota", lat: 44.9778, lng: -93.2650, hours: "7:00 AM - 8:00 PM", status: "open", accessible: true, type: "Fire Station" },
                { id: 17, name: "Auraria Campus Center", address: "900 Auraria Pkwy", city: "Denver", state: "Colorado", lat: 39.7392, lng: -104.9903, hours: "7:00 AM - 7:00 PM", status: "open", accessible: true, type: "Campus" },
                { id: 18, name: "Bellagio Convention Center", address: "3600 S Las Vegas Blvd", city: "Las Vegas", state: "Nevada", lat: 36.1699, lng: -115.1398, hours: "8:00 AM - 6:00 PM", status: "limited", accessible: true, type: "Convention Center" },
                { id: 19, name: "Music City Convention Hall", address: "201 5th Ave S", city: "Nashville", state: "Tennessee", lat: 36.1627, lng: -86.7816, hours: "7:00 AM - 7:00 PM", status: "open", accessible: true, type: "Convention Center" },
                { id: 20, name: "French Quarter Community Center", address: "1200 Royal St", city: "New Orleans", state: "Louisiana", lat: 29.9511, lng: -90.0715, hours: "7:00 AM - 7:00 PM", status: "open", accessible: false, type: "Community Center" }
            ];

            let result = [...booths];
            if (filter.state && filter.state !== 'all') result = result.filter(b => b.state === filter.state);
            if (filter.search) {
                const q = filter.search.toLowerCase();
                result = result.filter(b =>
                    b.name.toLowerCase().includes(q) ||
                    b.city.toLowerCase().includes(q) ||
                    b.state.toLowerCase().includes(q) ||
                    b.address.toLowerCase().includes(q)
                );
            }
            return { success: true, data: result, count: result.length };
        }
    };
})();
