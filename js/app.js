/**
 * ElectEd — Election Process Education App
 * Main application controller with modular architecture.
 */
document.addEventListener('DOMContentLoaded', () => {
    // ── HEADER & NAV ──
    const header = document.getElementById('site-header');
    const mobileToggle = document.getElementById('mobile-toggle');
    const mainNav = document.getElementById('main-nav');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });

    mobileToggle.addEventListener('click', () => {
        const expanded = mobileToggle.getAttribute('aria-expanded') === 'true';
        mobileToggle.setAttribute('aria-expanded', !expanded);
        mainNav.classList.toggle('open');
    });

    // Active nav tracking on scroll
    const sections = document.querySelectorAll('.section, .hero');
    const observerNav = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id.replace('-section', '');
                navLinks.forEach(l => l.classList.remove('active'));
                const match = document.querySelector(`.nav-link[href="#${id}"]`);
                if (match) match.classList.add('active');
            }
        });
    }, { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' });
    sections.forEach(s => observerNav.observe(s));

    // Close mobile nav on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('open');
            mobileToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // ── STAT COUNTER ANIMATION ──
    const animateCounters = () => {
        document.querySelectorAll('.stat-number[data-count]').forEach(el => {
            const target = parseInt(el.dataset.count);
            const duration = 1500;
            const start = performance.now();
            const animate = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                el.textContent = Math.round(target * eased);
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
        });
    };
    const heroObs = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) { animateCounters(); heroObs.disconnect(); }
    }, { threshold: 0.5 });
    const heroSection = document.getElementById('hero-section');
    if (heroSection) heroObs.observe(heroSection);

    // ── SCROLL REVEAL ──
    const revealObs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    document.querySelectorAll('.overview-card, .section-header').forEach(el => { el.classList.add('reveal'); revealObs.observe(el); });

    // ── TIMELINE ──
    initTimeline();

    // ── STEPS ──
    initSteps();

    // ── QUIZ ──
    initQuiz();

    // ── FAQ ──
    initFAQ();

    // ── CHATBOT ──
    initChat();

    // ── CANDIDATES ──
    initCandidates();

    // ── VOTER REGISTRATION ──
    initRegistration();

    // ── POLLING BOOTH MAP ──
    initPollingMap();

    // ── ELECTORAL COLLEGE MAP ──
    initElectoralMap();

    // ── PREMIUM ENHANCEMENTS ──
    initSplashScreen();
    initScrollProgress();
    initThemeToggle();
    initBackToTop();
    initParticles();
    initRippleEffect();
    initEnhancedReveals();
    initFAQSearch();
});

// ══════════════════════════════════════
// TIMELINE MODULE
// ══════════════════════════════════════
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
function initChat() {
    const messages = document.getElementById('chat-messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const suggestions = document.querySelectorAll('.suggestion-chip');

    const addMessage = (text, type) => {
        const div = document.createElement('div');
        div.className = `chat-message ${type}`;
        div.innerHTML = `
            <div class="message-avatar">${type === 'bot' ? '🗳️' : '👤'}</div>
            <div class="message-content"><p>${text}</p></div>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
        return div;
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

    const sendMessage = async (text) => {
        if (!text.trim()) return;
        addMessage(text, 'user');
        input.value = '';
        input.disabled = true;
        addTyping();
        try {
            const res = await ElectionAPI.chat(text);
            removeTyping();
            addMessage(res.response, 'bot');
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
            sendMessage(chip.dataset.question);
        });
    });
}

// ══════════════════════════════════════
// CANDIDATES MODULE
// ══════════════════════════════════════
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
function initParticles() {
    const canvas = document.getElementById('hero-particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animId;
    let w, h;

    const resize = () => {
        const hero = canvas.parentElement;
        w = canvas.width = hero.offsetWidth;
        h = canvas.height = hero.offsetHeight;
    };

    const createParticles = () => {
        particles = [];
        const count = Math.min(Math.floor((w * h) / 12000), 80);
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * w,
                y: Math.random() * h,
                r: Math.random() * 2 + 0.5,
                dx: (Math.random() - 0.5) * 0.4,
                dy: (Math.random() - 0.5) * 0.4,
                alpha: Math.random() * 0.5 + 0.1
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
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        animId = requestAnimationFrame(draw);
    };

    // Only animate when hero is visible
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
function initPollingMap() {
    const mapEl = document.getElementById('polling-map');
    if (!mapEl || typeof L === 'undefined') return;

    let map = null;
    let markers = [];
    let initialized = false;

    // Lazy init: only create map when section is scrolled into view
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !initialized) {
            initialized = true;
            observer.disconnect();
            setupMap();
        }
    }, { threshold: 0.1 });
    observer.observe(mapEl.closest('.pollmap-section'));

    async function setupMap() {
        // Create map centered on the US
        map = L.map('polling-map', {
            center: [39.8283, -98.5795],
            zoom: 4,
            scrollWheelZoom: true,
            zoomControl: true
        });

        // Use high-detail OpenStreetMap tiles for the polling map
        const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        const tileLayer = L.tileLayer(tileUrl, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        // Remove theme-based tile switching for polling map to keep it "original" and detailed

        // Populate state filter dropdown
        const stateSelect = document.getElementById('pollmap-state-select');
        const states = RegistrationAPI.getStates();
        states.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            stateSelect.appendChild(opt);
        });

        // Load and render booths
        await loadBooths();

        // Search handler
        const searchInput = document.getElementById('pollmap-search-input');
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => loadBooths(), 300);
        });

        // State filter handler
        stateSelect.addEventListener('change', () => loadBooths());

        // Locate me button
        document.getElementById('btn-locate-me').addEventListener('click', () => {
            if (!navigator.geolocation) {
                showToast('\u26a0\ufe0f', 'Geolocation not supported', 'Your browser does not support location services.', 'error');
                return;
            }
            showToast('\ud83d\udccd', 'Finding your location...', '', 'info');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords;
                    map.setView([latitude, longitude], 10);
                    // Add user marker
                    L.circleMarker([latitude, longitude], {
                        radius: 10, fillColor: '#6366f1', fillOpacity: 0.8,
                        color: '#fff', weight: 2
                    }).addTo(map).bindPopup('<strong>Your Location</strong>').openPopup();
                    showToast('\u2705', 'Location found!', 'Map centered on your position.', 'success');
                },
                () => {
                    showToast('\u274c', 'Location access denied', 'Please enable location permissions.', 'error');
                }
            );
        });
    }

    // Create custom colored marker icon
    function createMarkerIcon(status) {
        const colors = { open: '#10b981', limited: '#f59e0b', closed: '#ef4444' };
        const color = colors[status] || '#6b7280';
        return L.divIcon({
            className: 'custom-poll-marker',
            html: '<div style="width:14px;height:14px;border-radius:50%;background:' + color + ';border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10]
        });
    }

    async function loadBooths() {
        if (!map) return;
        const search = document.getElementById('pollmap-search-input').value;
        const state = document.getElementById('pollmap-state-select').value;
        const filter = {};
        if (search) filter.search = search;
        if (state !== 'all') filter.state = state;

        const res = await RegistrationAPI.getPollingBooths(filter);
        if (!res.success) return;

        // Clear existing markers
        markers.forEach(m => map.removeLayer(m));
        markers = [];

        const booths = res.data;
        const listEl = document.getElementById('pollmap-list');

        if (booths.length === 0) {
            listEl.innerHTML = '<div class="pollmap-empty">No polling booths found. Try a different search.</div>';
            return;
        }

        // Add markers
        booths.forEach(b => {
            const marker = L.marker([b.lat, b.lng], { icon: createMarkerIcon(b.status) }).addTo(map);
            const gMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.address} ${b.city} ${b.state}`)}`;
            const popupContent = '<div class="poll-popup-name">' + b.name + '</div>' +
                '<div class="poll-popup-address">' + b.address + ', ' + b.city + ', ' + b.state + '</div>' +
                '<div class="poll-popup-hours">\ud83d\udd52 ' + b.hours + '</div>' +
                '<span class="poll-popup-status ' + b.status + '">' + b.status + '</span>' +
                (b.accessible ? ' <span style="font-size:0.75rem;color:var(--text-dim);">\u267f Accessible</span>' : '') +
                '<div style="margin-top:10px;"><a href="' + gMapsUrl + '" target="_blank" style="color:var(--accent-primary);font-size:0.8rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;">\ud83d\uddfa\ufe0f Open in Google Maps</a></div>';
            marker.bindPopup(popupContent, { maxWidth: 280 });
            marker._boothId = b.id;
            markers.push(marker);
        });

        // Fit bounds if filtered
        if (booths.length > 0 && (filter.search || filter.state)) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.3));
        }

        // Render sidebar list
        listEl.innerHTML = booths.map(b => {
            const statusClass = b.status;
            return '<div class="pollmap-booth-item" data-booth-id="' + b.id + '" data-lat="' + b.lat + '" data-lng="' + b.lng + '">' +
                '<div class="booth-item-name">' + b.name + '</div>' +
                '<div class="booth-item-address">' + b.address + ', ' + b.city + '</div>' +
                '<div class="booth-item-meta">' +
                '<span class="booth-item-status ' + statusClass + '">' + b.status + '</span>' +
                '<span class="booth-item-distance">' + b.type + '</span>' +
                (b.accessible ? '<span>\u267f</span>' : '') +
                '</div></div>';
        }).join('');

        // Sidebar item click -> fly to marker
        listEl.querySelectorAll('.pollmap-booth-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const id = parseInt(item.dataset.boothId);
                map.flyTo([lat, lng], 13, { duration: 1 });

                // Highlight sidebar item
                listEl.querySelectorAll('.pollmap-booth-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');

                // Open marker popup
                const marker = markers.find(m => m._boothId === id);
                if (marker) setTimeout(() => marker.openPopup(), 500);
            });
        });
    }
}

// ══════════════════════════════════════
// ELECTORAL COLLEGE MAP MODULE
// ══════════════════════════════════════
function initElectoralMap() {
    const mapEl = document.getElementById('electoral-leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    let map = null;
    let geoJsonLayer = null;
    let initialized = false;

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !initialized) {
            initialized = true;
            setupElectoralMap();
        }
    }, { threshold: 0.1 });
    observer.observe(mapEl);

    async function setupElectoralMap() {
        map = L.map('electoral-leaflet-map', {
            center: [37.8, -96],
            zoom: 4,
            zoomControl: true,
            dragging: !L.Browser.mobile,
            scrollWheelZoom: false
        });

        // Add a reset view button
        const resetControl = L.control({position: 'topleft'});
        resetControl.onAdd = function () {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            div.innerHTML = '<a href="#" title="Reset View" style="font-size:16px;display:flex;align-items:center;justify-content:center;text-decoration:none;padding:4px;">🏠</a>';
            div.onclick = function(e) {
                e.preventDefault();
                map.setView([37.8, -96], 4);
                showStateInfo(null);
            };
            return div;
        };
        resetControl.addTo(map);

        // Use a clearer base layer
        const tileUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        L.tileLayer(tileUrl, { maxZoom: 19, opacity: 0.8 }).addTo(map);

        try {
            // Fetch US States GeoJSON
            const response = await fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json');
            const statesData = await response.json();

            geoJsonLayer = L.geoJson(statesData, {
                style: (feature) => ({
                    fillColor: '#6366f1',
                    weight: 1,
                    opacity: 1,
                    color: '#fff',
                    fillOpacity: 0.3
                }),
                onEachFeature: (feature, layer) => {
                    layer.on({
                        mouseover: (e) => {
                            const l = e.target;
                            l.setStyle({
                                weight: 2,
                                color: '#fff',
                                fillOpacity: 0.6,
                                fillColor: '#6366f1'
                            });
                        },
                        mouseout: (e) => {
                            geoJsonLayer.resetStyle(e.target);
                        },
                        click: async (e) => {
                            const stateName = feature.properties.name;
                            showStateInfo(stateName);
                            map.fitBounds(e.target.getBounds(), { padding: [40, 40] });
                        }
                    });
                }
            }).addTo(map);

        } catch (err) {
            console.error("Failed to load map data:", err);
            mapEl.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-dim);">Failed to load interactive map. Please check your connection.</div>';
        }
    }

    async function showStateInfo(stateName) {
        const placeholder = document.getElementById('map-info-placeholder');
        const content = document.getElementById('state-info-content');
        const nameEl = document.getElementById('state-name');
        const evEl = document.getElementById('state-ev');
        const deadlineEl = document.getElementById('state-deadline');
        const idReqEl = document.getElementById('state-id-req');
        const rulesEl = document.getElementById('state-rules');

        placeholder.classList.add('hidden');
        content.classList.remove('hidden');
        content.style.animation = 'none';
        content.offsetHeight; // trigger reflow
        content.style.animation = 'slideInRight 0.4s ease-out';

        nameEl.textContent = stateName || "State Information";
        
        if (!stateName) {
            evEl.textContent = `0 Electoral Votes`;
            deadlineEl.textContent = "-";
            idReqEl.textContent = "-";
            rulesEl.innerHTML = "";
            return;
        }

        const res = await ElectionAPI.getStateElectoralData(stateName);
        if (res.success) {
            const data = res.data;
            evEl.textContent = `${data.ev} Electoral Votes`;
            deadlineEl.textContent = data.deadline;
            idReqEl.textContent = data.idReq;
            rulesEl.innerHTML = data.rules.map(rule => `
                <li class="state-rule-item">
                    <span class="state-rule-icon">✓</span>
                    <span>${rule}</span>
                </li>
            `).join('');
        }
    }
}
