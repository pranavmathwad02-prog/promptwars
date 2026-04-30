/**
 * ElectEd — Election Process Education App
 * Main application controller with modular architecture.
 */
'use strict';

// Global Google Maps callback to prevent console errors
window.initMap = () => console.info("Google Maps Ready");

document.addEventListener('DOMContentLoaded', () => {
    // ── SAFETY: FORCE DISMISS SPLASH ──
    const splash = document.getElementById('splash-screen');
    const dismissSplash = () => {
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => { if (splash.parentNode) splash.remove(); }, 600);
        }
    };
    // Failsafe: Hide splash and enable scroll after 2.5s no matter what
    setTimeout(() => {
        dismissSplash();
        document.body.classList.remove('no-scroll');
    }, 2500);

    try {
        // ── HEADER & NAV ──
        const header = document.getElementById('site-header');
        const mobileToggle = document.getElementById('mobile-toggle');
        const mainNav = document.getElementById('main-nav');
        const navLinks = document.querySelectorAll('.nav-link');

        if (header) {
            window.addEventListener('scroll', () => {
                header.classList.toggle('scrolled', window.scrollY > 50);
            }, { passive: true });
        }

        if (mobileToggle && mainNav) {
            mobileToggle.addEventListener('click', () => {
                const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
                mobileToggle.setAttribute('aria-expanded', !expanded);
                mainNav.classList.toggle('open');
                document.body.classList.toggle('no-scroll', !expanded);
            });
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('open');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                    document.body.classList.remove('no-scroll');
                });
            });
        }

        // ── CORE MODULES (Protected Calls) ──
        const safeInit = (fn, name) => {
            try { fn(); } catch (e) { console.warn(`${name} failed:`, e); }
        };

        safeInit(() => initTimeline(), "Timeline");
        safeInit(() => initSteps(), "Steps");
        safeInit(() => initQuiz(), "Quiz");
        safeInit(() => initFAQ(), "FAQ");
        safeInit(() => initChat(), "Chat");
        safeInit(() => initCandidates(), "Candidates");
        safeInit(() => initRegistration(), "Registration");
        safeInit(() => initPollingMap(), "Polling Map");
        safeInit(() => initScrollProgress(), "ScrollProgress");
        safeInit(() => initThemeToggle(), "Theme");
        safeInit(() => initBackToTop(), "BackToTop");
        safeInit(() => initParticles(), "Particles");
        safeInit(() => initRippleEffect(), "Ripple");
        safeInit(() => initEnhancedReveals(), "Reveals");
        safeInit(() => initFAQSearch(), "FAQSearch");
        safeInit(() => initVerification(), "Verification");
        safeInit(() => initInterLink(), "InterLink");
        safeInit(() => initSharing(), "Sharing");
        safeInit(() => initCountdown(), "Countdown");
        safeInit(() => initVoice(), "Voice");
        safeInit(() => initScrollReveal(), "ScrollReveal");
        safeInit(() => initCursor(), "Cursor");
        safeInit(() => initPWA(), "PWA");
        safeInit(() => initAnalytics(), "Analytics");

        if (window.VanillaTilt) {
            VanillaTilt.init(document.querySelectorAll(".overview-card, .candidate-card, .reg-stat-card"), {
                max: 10, speed: 400, glare: true, "max-glare": 0.2, scale: 1.02
            });
        }

        // Dismiss splash when all safe-inits are done
        dismissSplash();

    } catch (criticalError) {
        console.error("Critical Platform Exception:", criticalError);
        dismissSplash();
    }
});

// ══════════════════════════════════════
// TIMELINE MODULE
// ══════════════════════════════════════
/**
 * Initializes the interactive election timeline.
 * Fetches timeline data from the ElectionAPI and renders timeline items.
 * @async
 * @returns {Promise<void>}
 */
async function initTimeline() {
    const wrapper = document.getElementById('timeline-wrapper');
    const filters = document.querySelectorAll('.timeline-filter');
    
    const loadTimeline = async (type) => {
        const res = await ElectionAPI.getTimeline(type);
        if (!res.success) return;
        // Keep the line element
        wrapper.querySelectorAll('.timeline-item').forEach(el => el.remove());
        res.data.forEach((item, i) => {
            const div = document.createElement('div');
            div.className = 'timeline-item';
            div.style.animationDelay = `${i * 0.1}s`;
            const isOdd = i % 2 === 0;
            div.innerHTML = `
                ${isOdd ? `<div class="timeline-content" tabindex="0" role="button" aria-label="${item.title}">
                    <div class="timeline-icon">${item.icon}</div>
                    <div class="timeline-month">${item.month}</div>
                    <div class="timeline-title">${item.title}</div>
                    <div class="timeline-desc">${item.desc}</div>
                </div><div class="timeline-spacer"></div>` :
                `<div class="timeline-spacer"></div><div class="timeline-content" tabindex="0" role="button" aria-label="${item.title}">
                    <div class="timeline-icon">${item.icon}</div>
                    <div class="timeline-month">${item.month}</div>
                    <div class="timeline-title">${item.title}</div>
                    <div class="timeline-desc">${item.desc}</div>
                </div>`}
                <div class="timeline-dot" style="border-color: ${item.color}"></div>
            `;
            wrapper.appendChild(div);
        });
        // Animate dots on scroll
        const dots = wrapper.querySelectorAll('.timeline-dot');
        const dotObs = new IntersectionObserver((entries) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('active'); } });
        }, { threshold: 0.5 });
        dots.forEach(d => dotObs.observe(d));
    };

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(f => { f.classList.remove('active'); f.setAttribute('aria-selected', 'false'); });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            loadTimeline(btn.dataset.filter);
        });
    });

    await loadTimeline('presidential');
}

// ══════════════════════════════════════
// STEPS MODULE
// ══════════════════════════════════════
/**
 * Initializes the step-by-step election guide.
 * Builds navigation tabs and dynamically updates content and progress.
 * @async
 * @returns {Promise<void>}
 */
async function initSteps() {
    const nav = document.getElementById('steps-nav');
    const content = document.getElementById('steps-content');
    const progressFill = document.getElementById('progress-fill');
    const progressLabel = document.getElementById('progress-label');

    const res = await ElectionAPI.getSteps();
    if (!res.success) return;
    const steps = res.data;
    let currentStep = 0;

    // Build nav tabs
    steps.forEach((step, i) => {
        const btn = document.createElement('button');
        btn.className = `step-tab${i === 0 ? ' active' : ''}`;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
        btn.id = `step-tab-${step.id}`;
        btn.innerHTML = `<span class="step-tab-num">${step.id}</span><span>${step.title}</span>`;
        btn.addEventListener('click', () => showStep(i));
        nav.appendChild(btn);
    });

    const showStep = (index) => {
        currentStep = index;
        const step = steps[index];
        // Update tabs
        nav.querySelectorAll('.step-tab').forEach((t, i) => {
            t.classList.toggle('active', i === index);
            t.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
        // Animate content
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px)';
        setTimeout(() => {
            content.innerHTML = `
                <div class="step-header">
                    <span class="step-emoji">${step.icon}</span>
                    <h3 class="step-content-title">${step.title}</h3>
                </div>
                <p class="step-full-desc">${step.fullDesc}</p>
                <div class="step-key-points">
                    <h4>Key Points</h4>
                    <ul>${step.keyPoints.map(p => `<li>${p}</li>`).join('')}</ul>
                </div>
                <div class="step-meta">
                    <div class="step-meta-item">
                        <div class="step-meta-label">Timeline</div>
                        <div class="step-meta-value">📅 ${step.timeline}</div>
                    </div>
                    <div class="step-meta-item">
                        <div class="step-meta-label">Fun Fact</div>
                        <div class="step-meta-value">💡 ${step.funFact}</div>
                    </div>
                </div>
            `;
            content.style.opacity = '1';
            content.style.transform = 'translateY(0)';
        }, 200);
        // Update progress
        const pct = ((index + 1) / steps.length) * 100;
        progressFill.style.width = `${pct}%`;
        progressFill.setAttribute('aria-valuenow', Math.round(pct));
        progressLabel.textContent = `Step ${index + 1} of ${steps.length}`;
    };

    showStep(0);
    content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
}

// ══════════════════════════════════════
// QUIZ MODULE
// ══════════════════════════════════════
/**
 * Initializes the interactive quiz module.
 * Manages quiz state, rendering questions, checking answers, and displaying results.
 * @async
 * @returns {Promise<void>}
 */
async function initQuiz() {
    const startScreen = document.getElementById('quiz-start');
    const activeScreen = document.getElementById('quiz-active');
    const resultsScreen = document.getElementById('quiz-results');
    const startBtn = document.getElementById('btn-start-quiz');
    const nextBtn = document.getElementById('btn-next-question');
    const retakeBtn = document.getElementById('btn-retake-quiz');
    const questionText = document.getElementById('quiz-question-text');
    const optionsDiv = document.getElementById('quiz-options');
    const questionNum = document.getElementById('quiz-question-num');
    const scoreDisplay = document.getElementById('quiz-score-display');
    const progressFill = document.getElementById('quiz-progress-fill');
    const feedbackDiv = document.getElementById('quiz-feedback');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackText = document.getElementById('feedback-text');

    let questions = [];
    let current = 0;
    let score = 0;

    const startQuiz = async () => {
        const res = await ElectionAPI.getQuizQuestions();
        if (!res.success) return;
        questions = res.data;
        current = 0;
        score = 0;
        startScreen.classList.add('hidden');
        resultsScreen.classList.add('hidden');
        activeScreen.classList.remove('hidden');
        showQuestion();
    };

    const showQuestion = () => {
        const q = questions[current];
        questionText.textContent = q.question;
        questionNum.textContent = `Question ${current + 1} of ${questions.length}`;
        scoreDisplay.textContent = `Score: ${score}`;
        progressFill.style.width = `${((current) / questions.length) * 100}%`;
        feedbackDiv.classList.add('hidden');
        nextBtn.classList.add('hidden');
        optionsDiv.innerHTML = '';
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.setAttribute('role', 'radio');
            btn.setAttribute('aria-checked', 'false');
            btn.id = `quiz-opt-${current}-${i}`;
            btn.addEventListener('click', () => selectAnswer(i, btn));
            optionsDiv.appendChild(btn);
        });
    };

    const selectAnswer = async (answerIndex, btn) => {
        const allBtns = optionsDiv.querySelectorAll('.quiz-option');
        allBtns.forEach(b => { b.disabled = true; });
        btn.classList.add('selected');
        const res = await ElectionAPI.checkAnswer(questions[current].id, answerIndex);
        if (!res.success) return;
        if (res.correct) {
            btn.classList.add('correct');
            score++;
            feedbackDiv.className = 'quiz-feedback correct-feedback';
            feedbackIcon.textContent = '✅';
            feedbackText.textContent = res.explanation;
        } else {
            btn.classList.add('wrong');
            allBtns[res.correctIndex].classList.add('correct');
            feedbackDiv.className = 'quiz-feedback wrong-feedback';
            feedbackIcon.textContent = '❌';
            feedbackText.textContent = res.explanation;
        }
        feedbackDiv.classList.remove('hidden');
        scoreDisplay.textContent = `Score: ${score}`;
        if (current < questions.length - 1) {
            nextBtn.classList.remove('hidden');
            nextBtn.querySelector('span').textContent = 'Next Question';
        } else {
            nextBtn.classList.remove('hidden');
            nextBtn.querySelector('span').textContent = 'See Results';
        }
    };

    nextBtn.addEventListener('click', () => {
        current++;
        if (current < questions.length) {
            showQuestion();
        } else {
            showResults();
        }
    });

    const showResults = () => {
        activeScreen.classList.add('hidden');
        resultsScreen.classList.remove('hidden');
        const pct = Math.round((score / questions.length) * 100);
        const resultsIcon = document.getElementById('results-icon');
        const resultsTitle = document.getElementById('results-title');
        const resultsMsg = document.getElementById('results-message');
        const scoreText = document.getElementById('score-text');
        const scoreFill = document.getElementById('score-fill');

        if (pct >= 80) { resultsIcon.textContent = '🏆'; resultsTitle.textContent = 'Excellent!'; resultsMsg.textContent = "You have a strong understanding of the election process!"; }
        else if (pct >= 60) { resultsIcon.textContent = '👏'; resultsTitle.textContent = 'Good Job!'; resultsMsg.textContent = "You know the basics well. Review the steps section to learn more."; }
        else { resultsIcon.textContent = '📚'; resultsTitle.textContent = 'Keep Learning!'; resultsMsg.textContent = "Explore the timeline and steps sections to improve your knowledge."; }

        scoreText.textContent = `${pct}%`;
        // Animate circle
        const circumference = 2 * Math.PI * 54;
        const offset = circumference - (pct / 100) * circumference;
        // Add SVG gradient def if not exists
        if (!document.getElementById('scoreGradient')) {
            const svg = scoreFill.closest('svg');
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            defs.innerHTML = `<linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#a855f7"/></linearGradient>`;
            svg.prepend(defs);
        }
        setTimeout(() => { scoreFill.style.strokeDashoffset = offset; }, 100);
    };

    startBtn.addEventListener('click', startQuiz);
    retakeBtn.addEventListener('click', startQuiz);
}

// ══════════════════════════════════════
// FAQ MODULE
// ══════════════════════════════════════
/**
 * Initializes the FAQ accordion section.
 * Fetches FAQ data and handles expand/collapse interactions.
 * @async
 * @returns {Promise<void>}
 */
async function initFAQ() {
    const container = document.getElementById('faq-container');
    const res = await ElectionAPI.getFAQs();
    if (!res.success) return;

    res.data.forEach((faq, i) => {
        const item = document.createElement('div');
        item.className = 'faq-item';
        item.setAttribute('role', 'listitem');
        item.id = `faq-item-${faq.id}`;
        item.innerHTML = `
            <button class="faq-question-btn" aria-expanded="false" aria-controls="faq-answer-${faq.id}" id="faq-btn-${faq.id}">
                <span>${faq.question}</span>
                <svg class="faq-chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M5 7.5l5 5 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
            <div class="faq-answer" id="faq-answer-${faq.id}" role="region" aria-labelledby="faq-btn-${faq.id}">
                <div class="faq-answer-inner">${faq.answer}</div>
            </div>
        `;
        const btn = item.querySelector('.faq-question-btn');
        const answer = item.querySelector('.faq-answer');
        btn.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            // Close all others
            container.querySelectorAll('.faq-item.open').forEach(openItem => {
                openItem.classList.remove('open');
                openItem.querySelector('.faq-question-btn').setAttribute('aria-expanded', 'false');
                openItem.querySelector('.faq-answer').style.maxHeight = '0';
            });
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
        container.appendChild(item);
    });
}

// ══════════════════════════════════════
// CHATBOT MODULE
// ══════════════════════════════════════
/**
 * Initializes the AI Chatbot interface.
 * Handles user input, displays typing indicators, and communicates with the ElectionAPI.
 * @returns {void}
 */
function initChat() {
    const messages = document.getElementById('chat-messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const suggestions = document.querySelectorAll('.suggestion-chip');

    const HISTORY_KEY = 'elected_chat_history';

    const addMessage = (text, type, shouldSave = true) => {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        div.innerHTML = `
            <div class="message-avatar">${type === 'bot' ? '🗳️' : '👤'}</div>
            <div class="message-content"><p>${text}</p></div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;

        if (shouldSave) {
            const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
            history.push({ text, type });
            localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        }
        return div;
    };

    const loadHistory = () => {
        const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        if (history.length > 0) {
            const welcome = document.getElementById('chat-welcome');
            if (welcome) welcome.remove();
            history.forEach(msg => addMessage(msg.text, msg.type, false));
        }
    };

    const clearHistory = () => {
        localStorage.removeItem(HISTORY_KEY);
        messages.innerHTML = `
            <div class="chat-message bot" id="chat-welcome">
                <div class="message-avatar" aria-hidden="true">🗳️</div>
                <div class="message-content">
                    <p>Chat cleared. How can I help you today?</p>
                </div>
            </div>
        `;
    };

    const addTyping = () => {
        const div = document.createElement('div');
        div.className = 'chat-message bot';
        div.id = 'typing-msg';
        div.innerHTML = `
            <div class="message-avatar">🗳️</div>
            <div class="message-content">
                <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
            </div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    };

    const removeTyping = () => {
        const t = document.getElementById('typing-msg');
        if (t) t.remove();
    };

    const sendMessage = async (rawText) => {
        // XSS: strip all HTML tags from user input before processing
        const text = String(rawText).replace(/<[^>]+>/g, '').trim();
        if (!text) return;
        addMessage(text, 'user');
        input.value = '';
        input.disabled = true;
        addTyping();
        try {
            const res = await ElectionAPI.chat(text);
            removeTyping();
            addMessage(res.response, 'bot');
            
            // ── GOOGLE ANALYTICS (Deep Integration) ──
            if (typeof gtag === 'function') {
                gtag('event', 'ai_chat_interaction', {
                    'event_category': 'AI Engagement',
                    'event_label': text.substring(0, 50)
                });
            }
            
            // ── TEXT-TO-SPEECH (Advanced) ──
            if (window.speechSynthesis) {
                // Cancel any ongoing speech
                window.speechSynthesis.cancel();
                // Strip emoji and basic html for speaking
                const cleanText = res.response.replace(/<[^>]*>?/gm, '').replace(/[^\x00-\x7F]/g, "");
                const utterance = new SpeechSynthesisUtterance(cleanText);
                utterance.lang = 'en-US';
                utterance.rate = 1.05;
                utterance.pitch = 1.0;
                window.speechSynthesis.speak(utterance);
            }
        } catch (err) {
            removeTyping();
            addMessage("Sorry, something went wrong. Please try again.", 'bot');
        }
        input.disabled = false;
        input.focus();
    };

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        sendMessage(input.value);
    });

    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            if (!chip.dataset.question) return; // Skip clear-chat and other non-question chips
            sendMessage(chip.dataset.question);
        });
    });

    // Load history on start
    loadHistory();

    // Add clear button listener if it exists
    const clearBtn = document.getElementById('btn-clear-chat');
    if (clearBtn) clearBtn.addEventListener('click', clearHistory);
}

// ══════════════════════════════════════
// CANDIDATES MODULE
// ══════════════════════════════════════
/**
 * Initializes the candidates grid and filtering system.
 * Fetches candidate data, renders cards, and handles modal interactions.
 * @async
 * @returns {Promise<void>}
 */
async function initCandidates() {
    const grid = document.getElementById('candidates-grid');
    const filterBtns = document.querySelectorAll('.cand-filter');
    if (!grid) return;

    const renderCandidates = async (position = 'all') => {
        const filter = position === 'all' ? {} : { position };
        const res = await RegistrationAPI.getCandidates(filter);
        if (!res.success) return;

        grid.style.opacity = '0';
        grid.style.transform = 'translateY(12px)';

        setTimeout(() => {
            grid.innerHTML = res.data.length === 0
                ? '<div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--text-secondary);"><p style="font-size:1.1rem;">No candidates found for this filter.</p></div>'
                : res.data.map(c => {
                    const initials = c.name.split(' ').map(w => w[0]).join('');
                    return `
                    <article class="candidate-card" id="candidate-${c.id}" tabindex="0" style="--card-accent:${c.color}">
                        <div class="candidate-avatar" style="background:linear-gradient(135deg, ${c.color}33, ${c.color}11); border: 2px solid ${c.color}44;">
                            <span style="font-size:1.5rem;font-weight:700;color:${c.color};">${initials}</span>
                        </div>
                        <div class="candidate-info">
                            <h3 class="candidate-name">${c.name}</h3>
                            <div class="candidate-meta">
                                <span class="candidate-party" style="color:${c.color}">${c.party}</span>
                                <span class="candidate-divider">•</span>
                                <span class="candidate-position">${c.position}</span>
                            </div>
                            <div class="candidate-state">📍 ${c.state} · Age ${c.age}</div>
                            <div class="candidate-slogan">"${c.slogan}"</div>
                            <div class="candidate-platform">
                                <h4>Key Platform:</h4>
                                <ul>${c.platform.map(p => `<li>${p}</li>`).join('')}</ul>
                            </div>
                        </div>
                    </article>`;
                }).join('');

            grid.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            grid.style.opacity = '1';
            grid.style.transform = 'translateY(0)';

            // Staggered reveal for cards
            grid.querySelectorAll('.candidate-card').forEach((card, i) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, i * 80);
            });

            // Click to open modal
            grid.querySelectorAll('.candidate-card').forEach(card => {
                card.addEventListener('click', async () => {
                    const id = parseInt(card.id.replace('candidate-', ''));
                    openCandidateModal(id);
                });
            });
        }, 150);
    };

    // Modal logic
    const modal = document.getElementById('candidate-modal');
    const modalClose = document.getElementById('modal-close');

    const openCandidateModal = async (id) => {
        const res = await RegistrationAPI.getCandidateById(id);
        if (!res.success) return;
        const c = res.data;
        const initials = c.name.split(' ').map(w => w[0]).join('');

        document.getElementById('modal-avatar').innerHTML = '<span style="font-size:1.8rem;font-weight:800;color:' + c.color + ';">' + initials + '</span>';
        document.getElementById('modal-avatar').style.cssText = 'background:linear-gradient(135deg,' + c.color + '33,' + c.color + '11);border:2px solid ' + c.color + '44;width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin-bottom:16px;';
        document.getElementById('modal-candidate-name').textContent = c.name;
        document.getElementById('modal-meta').innerHTML = '<span class="modal-party-badge" style="background:' + c.color + '22;color:' + c.color + ';">' + c.party + '</span> <span style="color:var(--text-dim);">\u2022</span> <span style="color:var(--text-secondary);">' + c.position + '</span>';
        document.getElementById('modal-body').innerHTML = '<div class="modal-slogan" style="border-color:' + c.color + ';">\u201c' + c.slogan + '\u201d</div>' +
            '<div class="modal-details">' +
            '<div class="modal-detail-item"><div class="modal-detail-label">State</div><div class="modal-detail-value">\ud83d\udccd ' + c.state + '</div></div>' +
            '<div class="modal-detail-item"><div class="modal-detail-label">Age</div><div class="modal-detail-value">' + c.age + ' years old</div></div>' +
            '</div>' +
            '<div class="modal-section-title">Campaign Platform</div>' +
            '<ul class="modal-platform">' + c.platform.map(p => '<li>' + p + '</li>').join('') + '</ul>';
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        modal.classList.remove('visible');
        document.body.style.overflow = '';
    };

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) closeModal();
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            renderCandidates(btn.dataset.filter);
        });
    });

    await renderCandidates('all');
}

// ══════════════════════════════════════
// VOTER REGISTRATION MODULE
// ══════════════════════════════════════
/**
 * Initializes the voter registration form and statistics.
 * Handles form validation, submission to RegistrationAPI, and rendering the voter list.
 * @async
 * @returns {Promise<void>}
 */
async function initRegistration() {
    const form = document.getElementById('registration-form');
    const stateSelect = document.getElementById('reg-state');
    const successDiv = document.getElementById('reg-success');
    const successText = document.getElementById('reg-success-text');
    const totalCount = document.getElementById('reg-total-count');
    const votersListInner = document.getElementById('voters-list-inner');
    if (!form) return;

    // Populate states dropdown
    const states = RegistrationAPI.getStates();
    states.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        stateSelect.appendChild(opt);
    });

    // Helper: show field error
    const showError = (fieldId, msg) => {
        const errorDiv = document.getElementById(`${fieldId}-error`);
        const input = document.getElementById(fieldId);
        if (errorDiv) { errorDiv.textContent = msg; errorDiv.style.display = 'block'; }
        if (input) input.classList.add('input-error');
    };

    // Helper: clear all errors
    const clearErrors = () => {
        form.querySelectorAll('.form-error').forEach(e => { e.textContent = ''; e.style.display = 'none'; });
        form.querySelectorAll('.input-error').forEach(e => e.classList.remove('input-error'));
        successDiv.style.display = 'none';
    };

    // Render voter list
    const renderVoters = async () => {
        const res = await RegistrationAPI.getRegisteredVoters();
        if (!res.success) return;
        totalCount.textContent = res.count;

        // Animate counter
        totalCount.style.transform = 'scale(1.2)';
        setTimeout(() => { totalCount.style.transition = 'transform 0.3s ease'; totalCount.style.transform = 'scale(1)'; }, 100);

        if (res.data.length === 0) {
            votersListInner.innerHTML = '<div class="no-voters">No voters registered yet.</div>';
            return;
        }

        votersListInner.innerHTML = res.data.map(v => {
            const date = new Date(v.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const initials = v.fullName.split(' ').map(w => w[0]).join('').toUpperCase();
            return `
            <div class="voter-item" id="voter-${v.id}">
                <div class="voter-avatar">${initials}</div>
                <div class="voter-details">
                    <div class="voter-name">${v.fullName}</div>
                    <div class="voter-meta">${v.state} · ${v.partyAffiliation} · ${date}</div>
                </div>
                <button class="voter-delete" data-id="${v.id}" aria-label="Remove ${v.fullName}" title="Remove registration">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </button>
            </div>`;
        }).join('');

        // Attach delete handlers
        votersListInner.querySelectorAll('.voter-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = parseInt(btn.dataset.id);
                const item = document.getElementById(`voter-${id}`);
                if (item) {
                    item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'translateX(20px)';
                }
                await RegistrationAPI.deleteVoter(id);
                setTimeout(() => renderVoters(), 300);
            });
        });
    };

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const voterData = {
            fullName: document.getElementById('reg-name').value,
            email: document.getElementById('reg-email').value,
            dob: document.getElementById('reg-dob').value,
            state: document.getElementById('reg-state').value,
            partyAffiliation: document.getElementById('reg-party').value
        };

        // Client-side validation
        let hasError = false;
        if (!voterData.fullName || voterData.fullName.trim().length < 2) { showError('reg-name', 'Full name is required (min 2 characters).'); hasError = true; }
        if (!voterData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(voterData.email)) { showError('reg-email', 'Please enter a valid email address.'); hasError = true; }
        if (!voterData.dob) { showError('reg-dob', 'Date of birth is required.'); hasError = true; }
        if (!voterData.state) { showError('reg-state', 'Please select your state.'); hasError = true; }
        if (hasError) return;

        const submitBtn = document.getElementById('btn-register');
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Registering...';

        const res = await RegistrationAPI.registerVoter(voterData);

        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Register Now';

        if (!res.success) {
            if (res.error.includes('name')) showError('reg-name', res.error);
            else if (res.error.includes('email')) showError('reg-email', res.error);
            else if (res.error.includes('state')) showError('reg-state', res.error);
            else if (res.error.includes('18') || res.error.includes('birth')) showError('reg-dob', res.error);
            else showError('reg-name', res.error);
            return;
        }

        // Success!
        successText.textContent = res.message;
        successDiv.style.display = 'flex';
        form.reset();
        await renderVoters();
        await renderPartyChart();
        showToast('\u2705', 'Registration Successful', voterData.fullName + ' has been registered to vote.', 'success');

        // Auto-hide success after 5s
        setTimeout(() => { successDiv.style.display = 'none'; }, 5000);
    });

    // Clear error on input focus
    form.querySelectorAll('.form-input, .form-select').forEach(input => {
        input.addEventListener('focus', () => {
            input.classList.remove('input-error');
            const errorDiv = document.getElementById(`${input.id}-error`);
            if (errorDiv) { errorDiv.textContent = ''; errorDiv.style.display = 'none'; }
        });
    });

    // Initial load
    await renderVoters();
    await renderPartyChart();
}

// ══════════════════════════════════════
// PREMIUM: SPLASH SCREEN
// ══════════════════════════════════════
/**
 * Initializes the splash screen animation.
 * Automatically hides and removes the splash screen after a delay.
 * @returns {void}
 */
function initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;
    setTimeout(() => {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 600);
    }, 2000);
}

// ══════════════════════════════════════
// PREMIUM: SCROLL PROGRESS BAR
// ══════════════════════════════════════
/**
 * Initializes the scroll progress bar at the top of the page.
 * Updates the width of the progress bar based on scroll position.
 * @returns {void}
 */
function initScrollProgress() {
    const fill = document.getElementById('scroll-progress-fill');
    if (!fill) return;
    const update = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        fill.style.width = `${pct}%`;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
}

// ══════════════════════════════════════
// PREMIUM: THEME TOGGLE
// ══════════════════════════════════════
/**
 * Initializes the theme toggle functionality (Light/Dark mode).
 * Persists user preference in localStorage and applies appropriate data attributes.
 * @returns {void}
 */
function initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    const thumb = toggle?.querySelector('.theme-toggle-thumb');
    if (!toggle || !thumb) return;

    // Load saved preference
    const saved = localStorage.getItem('elected_theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        toggle.setAttribute('data-theme', saved);
        thumb.textContent = saved === 'light' ? '☀️' : '🌙';
    }

    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        toggle.setAttribute('data-theme', next);
        thumb.textContent = next === 'light' ? '☀️' : '🌙';
        localStorage.setItem('elected_theme', next);
        showToast(next === 'light' ? '☀️' : '🌙', `${next === 'light' ? 'Light' : 'Dark'} mode activated`, '', 'info');
    });
}

// ══════════════════════════════════════
// PREMIUM: BACK TO TOP
// ══════════════════════════════════════
/**
 * Initializes the "Back to Top" button.
 * Controls visibility based on scroll depth and provides smooth scroll-to-top behavior.
 * @returns {void}
 */
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ══════════════════════════════════════
// PREMIUM: HERO PARTICLE CANVAS
// ══════════════════════════════════════
/**
 * Initializes the interactive hero particle background.
 * Uses Canvas API to render particles that react to mouse movement.
 * @returns {void}
 */
function initParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let w, h;
    let mouse = { x: null, y: null, radius: 150 };

    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', () => {
        mouse.x = null;
        mouse.y = null;
    });

    const resize = () => {
        const hero = canvas.parentElement;
        w = canvas.width = hero.offsetWidth;
        h = canvas.height = hero.offsetHeight;
    };

    const createParticles = () => {
        particles = [];
        const count = Math.min(Math.floor((w * h) / 9000), 120);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 2.5 + 0.5,
                dx: (Math.random() - 0.5) * 0.6,
                dy: (Math.random() - 0.5) * 0.6,
                baseX: Math.random() * w,
                baseY: Math.random() * h,
                alpha: Math.random() * 0.6 + 0.2
            });
        }
    };

    const draw = () => {
        ctx.clearRect(0, 0, w, h);
        particles.forEach(p => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x < 0) p.x = w;
            if (p.x > w) p.x = 0;
            if (p.y < 0) p.y = h;
            if (p.y > h) p.y = 0;
            
            // Mouse interaction
            if (mouse.x != null) {
                let dx = mouse.x - p.x;
                let dy = mouse.y - p.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouse.radius) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouse.radius - distance) / mouse.radius;
                    p.x -= forceDirectionX * force * 5;
                    p.y -= forceDirectionY * force * 5;
                }
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
            ctx.fill();
        });

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 140) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(99,102,241,${0.12 * (1 - dist / 140)})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }
        }
        animId = requestAnimationFrame(draw);
    };

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            if (!animId) draw();
        } else {
            cancelAnimationFrame(animId);
            animId = null;
        }
    }, { threshold: 0.1 });

    resize();
    createParticles();
    observer.observe(canvas.parentElement);

    window.addEventListener('resize', () => {
        resize();
        createParticles();
    });
}

// ══════════════════════════════════════
// PREMIUM: BUTTON RIPPLE EFFECT
// ══════════════════════════════════════
/**
 * Initializes the material-style ripple effect on buttons.
 * Dynamically creates ripple elements on click.
 * @returns {void}
 */
function initRippleEffect() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn, .cand-filter, .timeline-filter');
        if (!btn) return;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 2;
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
}

// ══════════════════════════════════════
// PREMIUM: ENHANCED SCROLL REVEALS
// ══════════════════════════════════════
/**
 * Initializes enhanced scroll reveals for page sections.
 * Uses IntersectionObserver to trigger animations as elements enter the viewport.
 * @returns {void}
 */
function initEnhancedReveals() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('visible');
                observer.unobserve(e.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    // Add reveal classes to sections
    document.querySelectorAll('.section-header').forEach((el, i) => {
        el.classList.add('reveal-up');
        el.style.transitionDelay = `${i * 0.05}s`;
        observer.observe(el);
    });
    document.querySelectorAll('.overview-card').forEach((el, i) => {
        el.classList.add('reveal-scale');
        el.style.transitionDelay = `${i * 0.08}s`;
        observer.observe(el);
    });
    document.querySelectorAll('.steps-interactive, .quiz-container, .chat-container, .register-layout').forEach(el => {
        el.classList.add('reveal-up');
        observer.observe(el);
    });
}

// ══════════════════════════════════════
// PREMIUM: FAQ SEARCH
// ══════════════════════════════════════
/**
 * Initializes the FAQ search filtering logic.
 * Filters FAQ items in real-time based on user input.
 * @returns {void}
 */
function initFAQSearch() {
    const input = document.getElementById('faq-search-input');
    const noResults = document.getElementById('faq-no-results');
    if (!input) return;

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase().trim();
        const items = document.querySelectorAll('.faq-item');
        let visible = 0;

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const match = !query || text.includes(query);
            item.style.display = match ? '' : 'none';
            if (match) visible++;
        });

        noResults.classList.toggle('visible', visible === 0 && query.length > 0);
    });
}

// ══════════════════════════════════════
// PREMIUM: TOAST NOTIFICATIONS
// ══════════════════════════════════════
/**
 * Displays a toast notification to the user.
 * @param {string} icon - Emoji or icon to display.
 * @param {string} title - Main title of the toast.
 * @param {string} message - Description text for the toast.
 * @param {string} [type='info'] - Type of toast (success, error, info, warning).
 * @returns {void}
 */
function showToast(icon, title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
    `;
    container.appendChild(toast);

    const dismiss = () => {
        toast.classList.add('toast-out');
        setTimeout(() => toast.remove(), 300);
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 4000);
}

// ══════════════════════════════════════
// PREMIUM: REGISTRATION PARTY CHART
// ══════════════════════════════════════
/**
 * Renders the voter registration party breakdown chart.
 * Fetches stats from RegistrationAPI and generates dynamic bar elements.
 * @async
 * @returns {Promise<void>}
 */
async function renderPartyChart() {
    const chartBars = document.getElementById('reg-chart-bars');
    if (!chartBars) return;

    const res = await RegistrationAPI.getRegistrationStats();
    if (!res.success || res.data.total === 0) {
        chartBars.innerHTML = '<div style="font-size:0.82rem;color:var(--text-dim);padding:8px 0;">Register voters to see party breakdown.</div>';
        return;
    }

    const partyColors = {
        'Democratic Party': '#3b82f6',
        'Republican Party': '#ef4444',
        'Independent': '#8b5cf6',
        'Libertarian Party': '#f59e0b',
        'Green Party': '#10b981',
        'Unaffiliated': '#6b7280',
        'Other': '#ec4899'
    };

    const parties = res.data.byParty;
    const maxCount = Math.max(...Object.values(parties));

    chartBars.innerHTML = Object.entries(parties).map(([party, count]) => {
        const pct = (count / maxCount) * 100;
        const color = partyColors[party] || '#6b7280';
        return `
            <div class="reg-chart-bar">
                <div class="reg-chart-label">${party.replace(' Party', '')}</div>
                <div class="reg-chart-track">
                    <div class="reg-chart-fill" style="width:${pct}%;background:${color};"></div>
                </div>
                <div class="reg-chart-count">${count}</div>
            </div>`;
    }).join('');
}

// ══════════════════════════════════════
// POLLING BOOTH MAP MODULE
// ══════════════════════════════════════
/**
 * Initializes the Leaflet map for polling locations.
 * Uses lazy-loading and provides search/filter functionality.
 * @returns {void}
 */
function initPollingMap() {
    const mapEl = document.getElementById('polling-map');
    if (!mapEl || typeof L === 'undefined') return;

    let map = null;
    let markers = [];
    let initialized = false;
    let userMarker = null;

    // Lazy init: only create map when section is scrolled into view
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !initialized) {
            initialized = true;
            observer.disconnect();
            setupMap();
        }
    }, { threshold: 0.1 });
    observer.observe(mapEl.closest('.pollmap-section'));

    function setupMap() {
        // Leaflet map centered on the US — no API key required
        map = L.map('polling-map', {
            center: [39.8283, -98.5795],
            zoom: 4,
            scrollWheelZoom: false,
            zoomControl: true
        });

        // Dark CartoDB tile layer (matches the app's dark theme)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19
        }).addTo(map);

        // Custom green circle icon for polling stations
        const pollingIcon = L.divIcon({
            className: '',
            html: '<div style="width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(16,185,129,0.6);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7]
        });

        // Populate state filter dropdown
        const stateSelect = document.getElementById('pollmap-state-select');
        const states = RegistrationAPI.getStates();
        states.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            stateSelect.appendChild(opt);
        });

        // Load initial booths
        loadBooths(pollingIcon);

        // Search with debounce
        const searchInput = document.getElementById('pollmap-search-input');
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadBooths(pollingIcon), 300);
        });

        stateSelect.addEventListener('change', () => loadBooths(pollingIcon));

        // Locate me — uses browser geolocation
        document.getElementById('btn-locate-me').addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('⚠️', 'Geolocation not supported', 'Your browser does not support location services.', 'error');
                return;
            }
            showToast('📍', 'Finding your location...', '', 'info');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    map.setView([latitude, longitude], 11);
                    if (userMarker) userMarker.remove();
                    userMarker = L.circleMarker([latitude, longitude], {
                        radius: 10,
                        fillColor: '#6366f1',
                        color: '#fff',
                        weight: 2,
                        fillOpacity: 0.9
                    }).addTo(map).bindPopup('<strong>📍 Your Location</strong>').openPopup();
                    showToast('✅', 'Location found!', 'Map centered on your position.', 'success');
                },
                () => {
                    showToast('❌', 'Location access denied', 'Please enable location permissions.', 'error');
                }
            );
        });
    }

    async function loadBooths(pollingIcon) {
        if (!map) return;
        const search = document.getElementById('pollmap-search-input').value;
        const state = document.getElementById('pollmap-state-select').value;
        const filter = {};
        if (search) filter.search = search;
        if (state !== 'all') filter.state = state;

        const res = await RegistrationAPI.getPollingBooths(filter);
        if (!res.success) return;

        // Clear existing markers
        markers.forEach(m => m.remove());
        markers = [];

        const booths = res.data;
        const listEl = document.getElementById('pollmap-list');

        if (booths.length === 0) {
            listEl.innerHTML = '<div class="pollmap-empty">No polling booths found. Try a different search.</div>';
            return;
        }

        const bounds = L.latLngBounds();

        booths.forEach(b => {
            const latlng = [b.lat, b.lng];
            const gMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + ' ' + b.address + ' ' + b.city + ' ' + b.state)}`;

            const popup = L.popup({ maxWidth: 260 }).setContent(
                '<div class="poll-popup-name">' + b.name + '</div>' +
                '<div class="poll-popup-address">' + b.address + ', ' + b.city + ', ' + b.state + '</div>' +
                '<div class="poll-popup-hours">🕒 ' + b.hours + '</div>' +
                '<span class="poll-popup-status ' + b.status + '">' + b.status + '</span>' +
                (b.accessible ? ' <span style="font-size:0.75rem;color:#6b7280;">♿ Accessible</span>' : '') +
                '<div style="margin-top:10px;"><a href="' + gMapsUrl + '" target="_blank" rel="noopener noreferrer" style="color:#6366f1;font-size:0.8rem;font-weight:600;">🗺️ Open in Google Maps</a></div>'
            );

            const fallbackIcon = L.divIcon({
                className: '',
                html: '<div style="width:14px;height:14px;background:#10b981;border:2px solid #fff;border-radius:50%;box-shadow:0 0 6px rgba(16,185,129,0.6);"></div>',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
            });
            const icon = (typeof pollingIcon !== 'undefined') ? pollingIcon : fallbackIcon;

            const marker = L.marker(latlng, { icon }).addTo(map).bindPopup(popup);
            marker._boothId = b.id;
            bounds.extend(latlng);
            markers.push(marker);
        });

        // Fit map to results when filtered
        if (filter.search || filter.state) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }

        // Render sidebar list
        listEl.innerHTML = booths.map(b =>
            '<div class="pollmap-booth-item" data-booth-id="' + b.id + '" data-lat="' + b.lat + '" data-lng="' + b.lng + '">' +
            '<div class="booth-item-name">' + b.name + '</div>' +
            '<div class="booth-item-address">' + b.address + ', ' + b.city + '</div>' +
            '<div class="booth-item-meta">' +
            '<span class="booth-item-status ' + b.status + '">' + b.status + '</span>' +
            '<span class="booth-item-distance">' + b.type + '</span>' +
            (b.accessible ? '<span>♿</span>' : '') +
            '</div></div>'
        ).join('');

        // Sidebar click → fly to marker and open popup
        listEl.querySelectorAll('.pollmap-booth-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const id = parseInt(item.dataset.boothId);
                map.setView([lat, lng], 14, { animate: true });
                listEl.querySelectorAll('.pollmap-booth-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const marker = markers.find(m => m._boothId === id);
                if (marker) marker.openPopup();
            });
        });
    }
}


// ══════════════════════════════════════
// VERIFICATION MODULE
// ══════════════════════════════════════
function initVerification() {
    const verifyForm = document.getElementById('verify-form');
    const verifyResult = document.getElementById('verify-result');
    if (!verifyForm) return;

    verifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('verify-email').value.toLowerCase().trim();
        if (!email) return;

        verifyResult.innerHTML = '<span style="color:var(--text-muted)">Checking database...</span>';
        await new Promise(r => setTimeout(r, 600));

        const res = await RegistrationAPI.getRegisteredVoters();
        const voter = res.data.find(v => v.email === email);

        if (voter) {
            verifyResult.innerHTML = `<div style="padding:10px; background:rgba(34,197,94,0.1); border-radius:8px; border:1px solid rgba(34,197,94,0.2);"><span style="color:var(--success); font-weight:600;">✅ Verified:</span> <span style="color:var(--text-primary)">${voter.fullName} registered in ${voter.state} (${voter.partyAffiliation})</span></div>`;
        } else {
            verifyResult.innerHTML = `<div style="padding:10px; background:rgba(239,68,68,0.1); border-radius:8px; border:1px solid rgba(239,68,68,0.2);"><span style="color:var(--error); font-weight:600;">❌ Not Found:</span> <span style="color:var(--text-primary)">No record matches this email address.</span></div>`;
        }
    });
}

// ══════════════════════════════════════
// INTERLINK MODULE
// ══════════════════════════════════════
function initInterLink() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const title = item.querySelector('h3')?.textContent;
            if (!title) return;
            const steps = document.querySelectorAll('.step-card');
            for (let s of steps) {
                const sTitle = s.querySelector('h3')?.textContent;
                if (sTitle && (sTitle.includes(title) || title.includes(sTitle))) {
                    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    s.classList.add('highlight-pulse');
                    setTimeout(() => s.classList.remove('highlight-pulse'), 2000);
                    break;
                }
            }
        });
    });
}

// ══════════════════════════════════════
// SHARING MODULE
// ══════════════════════════════════════
function initSharing() {
    const shareBtn = document.getElementById('btn-share-hero');
    if (!shareBtn) return;
    shareBtn.addEventListener('click', () => {
        const shareData = {
            title: 'ElectEd — Interactive Election Assistant',
            text: 'Master the U.S. election process with this interactive AI toolkit!',
            url: window.location.href
        };
        if (navigator.share) {
            navigator.share(shareData).catch(() => copyToClipboard());
        } else {
            copyToClipboard();
        }
    });
    function copyToClipboard() {
        navigator.clipboard.writeText(window.location.href);
        showToast('🔗', 'Link copied!', 'Share this with your friends.', 'success');
    }
}

// ══════════════════════════════════════
// COUNTDOWN MODULE
// ══════════════════════════════════════
function initCountdown() {
    const target = new Date('November 3, 2026 00:00:00').getTime();
    const pad = n => n.toString().padStart(2, '0');
    const update = () => {
        const diff = target - Date.now();
        if (diff <= 0) return;
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const el = id => document.getElementById(id);
        if (el('days'))    el('days').textContent    = pad(d);
        if (el('hours'))   el('hours').textContent   = pad(h);
        if (el('minutes')) el('minutes').textContent = pad(m);
        if (el('seconds')) el('seconds').textContent = pad(s);
    };
    setInterval(update, 1000);
    update();
}

// ══════════════════════════════════════
// VOICE MODULE
// ══════════════════════════════════════
function initVoice() {
    const voiceBtn = document.getElementById('btn-voice-chat');
    const input = document.getElementById('chat-input');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!voiceBtn || !SpeechRecognition) {
        if (voiceBtn) voiceBtn.style.display = 'none';
        return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    voiceBtn.addEventListener('click', () => {
        if (voiceBtn.classList.contains('listening')) { recognition.stop(); return; }
        voiceBtn.classList.add('listening');
        recognition.start();
    });
    recognition.onresult = (event) => {
        input.value = event.results[0][0].transcript;
        voiceBtn.classList.remove('listening');
        document.getElementById('chat-form')?.dispatchEvent(new Event('submit'));
    };
    recognition.onerror = () => voiceBtn.classList.remove('listening');
    recognition.onend   = () => voiceBtn.classList.remove('listening');
}

// ══════════════════════════════════════
// SCROLL REVEAL MODULE
// ══════════════════════════════════════
function initScrollReveal() {
    const reveal = () => {
        document.querySelectorAll('.section, .overview-card, .step-card, .candidate-card, .timeline-item, .reg-stat-card').forEach(item => {
            if (item.getBoundingClientRect().top < window.innerHeight * 0.9) {
                item.classList.add('reveal-visible');
            }
        });
    };
    window.addEventListener('scroll', reveal, { passive: true });
    setTimeout(reveal, 500);
}

// ══════════════════════════════════════
// CURSOR MODULE
// ══════════════════════════════════════
function initCursor() {
    if (typeof L !== 'undefined' && L.Browser.mobile) return;
    const dot = document.getElementById('cursor-dot');
    const outline = document.getElementById('cursor-outline');
    if (!dot || !outline) return;
    window.addEventListener('mousemove', (e) => {
        dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
        outline.animate({ transform: `translate(${e.clientX}px, ${e.clientY}px)` }, { duration: 400, fill: 'forwards' });
    });
    document.querySelectorAll('a, button, .overview-card, .candidate-card, .suggestion-chip, .faq-question-btn').forEach(el => {
        el.addEventListener('mouseenter', () => outline.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => outline.classList.remove('cursor-hover'));
    });
}

// ══════════════════════════════════════
// ADVANCED MODULES: PWA & ANALYTICS
// ══════════════════════════════════════

/**
 * Initializes the Service Worker for Offline PWA capabilities.
 */
function initPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js').then(registration => {
                console.info('PWA ServiceWorker registered successfully with scope: ', registration.scope);
            }, err => {
                console.warn('PWA ServiceWorker registration failed: ', err);
            });
        });
    }
}

/**
 * Initializes Live Analytics powered by Web Workers and Chart.js.
 */
function initAnalytics() {
    const turnoutCtx = document.getElementById('turnoutChart');
    const issuesCtx = document.getElementById('issuesChart');
    if (!turnoutCtx || !issuesCtx || !window.Chart) return;

    // Turnout Projection Chart (Line)
    const turnoutChart = new Chart(turnoutCtx, {
        type: 'line',
        data: {
            labels: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'],
            datasets: [{
                label: 'Projected Turnout %',
                data: [0, 0, 0, 0, 0, 0], // Replaced by Worker data
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, max: 100 } }
        }
    });

    // Issues Priority Chart (Radar)
    const issuesChart = new Chart(issuesCtx, {
        type: 'radar',
        data: {
            labels: ['Economy', 'Healthcare', 'Environment', 'Education', 'Security'],
            datasets: [{
                label: 'Voter Priority Index',
                data: [0, 0, 0, 0, 0], // Replaced by Worker data
                borderColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.3)',
                borderWidth: 2,
                pointBackgroundColor: '#ec4899'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, max: 100 } }
        }
    });

    // Setup Web Worker for live data stream
    if (window.Worker) {
        const worker = new Worker('js/worker.js');
        worker.onmessage = function(e) {
            if (e.data.type === 'ANALYTICS_UPDATE') {
                turnoutChart.data.datasets[0].data = e.data.data.turnout;
                turnoutChart.update();
                
                issuesChart.data.datasets[0].data = e.data.data.issues;
                issuesChart.update();
            }
        };
    } else {
        console.warn("Web Workers not supported. Live analytics disabled.");
    }
}
