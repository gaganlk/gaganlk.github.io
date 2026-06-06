document.addEventListener('DOMContentLoaded', () => {

    // ── 1. THEME TOGGLE ──────────────────────────────────
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const saved = localStorage.getItem('theme');
    html.setAttribute('data-theme', saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));

    themeToggle.addEventListener('click', () => {
        const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        showToast(`Switched to ${next.toUpperCase()} mode`, 'info');
    });

    // ── 2. NAVBAR SCROLL + PROGRESS ──────────────────────
    const navbar        = document.getElementById('navbar');
    const scrollBar     = document.getElementById('scroll-progress');

    window.addEventListener('scroll', () => {
        const h       = document.documentElement;
        const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
        scrollBar.style.width = scrolled + '%';
        navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // ── 3. ACTIVE NAV HIGHLIGHT ───────────────────────────
    const sections  = document.querySelectorAll('section[id]');
    const navLinks  = document.querySelectorAll('.nav-link');

    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(l => {
                    l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { threshold: 0.4 });

    sections.forEach(s => sectionObserver.observe(s));

    // ── 4. MOBILE MENU ────────────────────────────────────
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu      = document.getElementById('nav-menu');

    mobileToggle.addEventListener('click', () => {
        mobileToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    navLinks.forEach(link => link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
    }));

    // ── 5. SCROLL REVEAL ──────────────────────────────────
    const reveals = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    reveals.forEach(el => revealObserver.observe(el));

    // ── 6. SKILL BARS ANIMATION ───────────────────────────
    const skillFills = document.querySelectorAll('.sl-fill');
    const skillObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                skillFills.forEach(bar => {
                    const target = bar.style.width;
                    bar.style.width = '0';
                    setTimeout(() => { bar.style.width = target; }, 150);
                });
                skillObserver.disconnect();
            }
        });
    }, { threshold: 0.2 });

    const skillsSection = document.querySelector('.skills');
    if (skillsSection) skillObserver.observe(skillsSection);

    // ── 7. CONTACT FORM → FORMSPREE ───────────────────────
    const FORMSPREE_URL = 'https://formspree.io/f/xbdedqjd';
    const contactForm   = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', async e => {
            e.preventDefault();

            const nameEl    = document.getElementById('name');
            const emailEl   = document.getElementById('email');
            const subjectEl = document.getElementById('subject');
            const messageEl = document.getElementById('message');
            const hiddenReply = document.getElementById('hidden-reply');
            const btn       = document.getElementById('btn-submit-form');

            const name    = nameEl.value.trim();
            const email   = emailEl.value.trim();
            const subject = subjectEl.value.trim();
            const message = messageEl.value.trim();

            // Basic validation
            if (!name || !email || !subject || !message) {
                showToast('Please fill in all fields.', 'error');
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showToast('Please enter a valid email address.', 'error');
                return;
            }

            // Mirror email into _replyto so you can reply directly
            if (hiddenReply) hiddenReply.value = email;

            // Disable button & show loading state
            btn.disabled = true;
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                     style="width:18px;height:18px;animation:spin 1s linear infinite">
                    <circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="10"/>
                </svg>
                Sending…`;

            try {
                const res = await fetch(FORMSPREE_URL, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' },
                    body: new FormData(contactForm)
                });

                if (res.ok) {
                    showToast(`✓ Message sent! I'll reply to ${email} soon.`, 'success');
                    contactForm.reset();
                } else {
                    const data = await res.json().catch(() => ({}));
                    const errMsg = data.errors?.map(e => e.message).join(', ') || 'Submission failed.';
                    showToast(errMsg, 'error');
                }
            } catch (err) {
                showToast('Network error — check your connection and try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = `Send Message
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                         style="width:18px;height:18px">
                        <line x1="22" y1="2" x2="11" y2="13"/>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>`;
            }
        });
    }

    // ── 8. TOAST ──────────────────────────────────────────
    const toastContainer = document.getElementById('toast-container');

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';

        const colors = { success: 'var(--accent)', info: 'var(--cyan)', error: '#ef4444' };
        toast.style.borderLeftColor = colors[type] || colors.success;

        const icons = { success: '✓', info: 'ℹ', error: '✕' };
        toast.innerHTML = `<span>${icons[type] || '✓'}</span> <span>${message}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        }, 3500);
    }

    // ══════════════════════════════════════════════════════
    // ── DEVELOPER CONSOLE ─────────────────────────────────
    // ══════════════════════════════════════════════════════

    const termOutput  = document.getElementById('term-output');
    const termInput   = document.getElementById('term-input');
    const termRunBtn  = document.getElementById('term-run-btn');

    if (!termOutput || !termInput) {
        window.showToast = showToast;
        return;
    }

    // ── Portfolio data ────────────────────────────────────
    const portfolio = {
        name:     'Gagan L K',
        role:     'Cloud & Backend Engineering Student',
        college:  'Dayananda Sagar College of Engineering (DSCE)',
        cgpa:     '8.05',
        year:     '2nd Year, B.E. CSE (2023–2027)',
        location: 'Kolar, Karnataka, India',
        email:    'gaganlkklr2006@gmail.com',
        phone:    '+91 8431104221',
        github:   'https://github.com/gaganlk',
        linkedin: 'https://linkedin.com/in/gagan-l-k-b6b27129a',
        skills: {
            'Languages':       ['Python (90%)', 'Java (80%)', 'C & C++ (75%)', 'SQL (85%)', 'JavaScript (70%)'],
            'Cloud & DevOps':  ['Google Cloud Platform (80%)', 'Docker (85%)', 'Kubernetes Basics (65%)', 'Linux / Unix (80%)'],
            'Backend & Tools': ['Git & GitHub (90%)', 'FastAPI & WebSockets (85%)', 'PostgreSQL & Redis (80%)', 'Kafka (75%)', 'AI / ML Fundamentals (70%)'],
        },
        projects: [
            {
                name:  'Multi-Cloud AIOps Platform',
                tag:   'Cloud & Observability',
                desc:  'Cloud-integrated monitoring and observability platform with real-time alerting and auto-healing workflows.',
                stack: ['FastAPI', 'PostgreSQL', 'Redis', 'Kafka', 'WebSockets', 'Docker', 'GCP'],
                url:   'https://github.com/gaganlk/Multi-Cloud-AIOps-Platform',
            },
            {
                name:  'Digital Forensic Analyzer',
                tag:   'Security & Forensics',
                desc:  'Forensic analysis system to detect suspicious and malicious activities within digital files.',
                stack: ['Python', 'File Analysis', 'Anomaly Detection', 'Forensic Tools'],
                url:   'https://github.com/gaganlk/digital-forensics-analyzer',
            },
        ],
        certifications: [
            { name: 'Python Fundamentals',                   issuer: 'Coursera',              year: '2024' },
            { name: 'Google Cloud Career Launchpad Program', issuer: 'Google Cloud',           year: '2024' },
            { name: 'Software Engineering Job Simulation',   issuer: 'J.P. Morgan · Forage',  year: 'Oct 2025' },
            { name: 'Solutions Architecture Job Simulation', issuer: 'AWS · Forage',           year: 'Oct 2025' },
        ],
    };

    // ── Command history (↑/↓ arrows) ─────────────────────
    const cmdHistory = [];
    let histIdx = -1;

    // ── Output builder helpers ────────────────────────────
    function el(tag, cls, html) {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html !== undefined) e.innerHTML = html;
        return e;
    }

    function appendBlock(children) {
        const block = el('div', 'term-block');
        children.forEach(c => block.appendChild(typeof c === 'string' ? (() => { const s = el('div'); s.innerHTML = c; return s; })() : c));
        termOutput.appendChild(block);
        termOutput.scrollTop = termOutput.scrollHeight;
    }

    function echoLine(cmd) {
        return el('div', 'term-echo-line', escHtml(cmd));
    }
    function sec(label) {
        return el('div', 'term-sec', label);
    }
    function row(key, val) {
        return el('div', 'term-row', `<span class="term-k">${escHtml(key)}</span><span class="term-v">${val}</span>`);
    }
    function bullet(text) {
        return el('div', 'term-bullet', escHtml(text));
    }
    function badge(text) {
        return `<span class="term-badge-inline">${escHtml(text)}</span>`;
    }
    function linkEl(text, href) {
        return el('div', 'term-link', `<a href="${href}" target="_blank" rel="noopener noreferrer">${escHtml(text)}</a>`);
    }
    function errEl(msg) {
        return el('div', 'term-err', `✕  ${escHtml(msg)}`);
    }
    function okEl(msg) {
        return el('div', 'term-ok', `✓  ${escHtml(msg)}`);
    }
    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    // ── COMMAND HANDLERS ──────────────────────────────────

    function cmdHelp() {
        const cmds = [
            ['help',         'Show this help menu'],
            ['whoami',       'About Gagan — name, role, CGPA'],
            ['skills',       'List all technical skills by category'],
            ['projects',     'View all projects with tech stack'],
            ['education',    'Education background and degree details'],
            ['certs',        'All certifications and credentials'],
            ['contact',      'Contact details — email, phone, location'],
            ['social',       'Social & professional profiles'],
            ['date',         'Current date and time (IST)'],
            ['clear',        'Clear the terminal output'],
            ['ls',           'Alias for help'],
            ['pwd',          'Print working directory'],
        ];
        const grid = el('div', 'term-help-grid');
        cmds.forEach(([cmd, desc]) => {
            const r = el('div', 'term-help-row');
            r.innerHTML = `<span class="term-help-cmd">${cmd}</span><span class="term-help-desc">${desc}</span>`;
            grid.appendChild(r);
        });
        appendBlock([
            echoLine('help'),
            sec('Available Commands'),
            grid,
            el('div', 'term-ok', '✓  Tip: Use ↑ / ↓ arrow keys to cycle command history'),
        ]);
    }

    function cmdWhoami() {
        appendBlock([
            echoLine('whoami'),
            sec('Profile'),
            row('Name',     portfolio.name),
            row('Role',     portfolio.role),
            row('College',  portfolio.college),
            row('Year',     portfolio.year),
            row('CGPA',     portfolio.cgpa + ' / 10.0'),
            row('Location', portfolio.location),
        ]);
    }

    function cmdSkills() {
        const nodes = [echoLine('skills'), sec('Technical Skills')];
        Object.entries(portfolio.skills).forEach(([cat, list]) => {
            nodes.push(el('div', 'term-sec', cat));
            list.forEach(s => nodes.push(bullet(s)));
        });
        appendBlock(nodes);
    }

    function cmdProjects() {
        const nodes = [echoLine('projects'), sec('Projects')];
        portfolio.projects.forEach((p, i) => {
            nodes.push(el('div', 'term-sec', `Project ${i + 1} — ${p.name}`));
            nodes.push(row('Tag',   p.tag));
            nodes.push(row('Desc',  p.desc));
            nodes.push(el('div', 'term-row',
                `<span class="term-k">Stack</span><span class="term-v">${p.stack.map(badge).join('')}</span>`
            ));
            nodes.push(linkEl('View on GitHub →', p.url));
        });
        appendBlock(nodes);
    }

    function cmdEducation() {
        appendBlock([
            echoLine('education'),
            sec('Education'),
            row('Degree',   'B.E. Computer Science & Engineering'),
            row('College',  portfolio.college),
            row('Period',   '2023 – 2027'),
            row('CGPA',     portfolio.cgpa + ' / 10.0'),
            row('Location', 'Bengaluru, Karnataka'),
            okEl('Eligible for 2027 graduation batch'),
        ]);
    }

    function cmdCerts() {
        const nodes = [echoLine('certs'), sec('Certifications & Credentials')];
        portfolio.certifications.forEach((c, i) => {
            nodes.push(row(`[${i + 1}] ${c.name}`, `${c.issuer}  ·  ${c.year}`));
        });
        nodes.push(okEl('4 certifications total'));
        appendBlock(nodes);
    }

    function cmdContact() {
        appendBlock([
            echoLine('contact'),
            sec('Contact Information'),
            row('Email',    portfolio.email),
            row('Phone',    portfolio.phone),
            row('Location', portfolio.location),
            okEl('Replies within 24 hours · Available Mon–Fri 9am–6pm IST'),
        ]);
    }

    function cmdSocial() {
        appendBlock([
            echoLine('social'),
            sec('Social & Professional Profiles'),
            linkEl('GitHub  →  ' + portfolio.github,   portfolio.github),
            linkEl('LinkedIn  →  ' + portfolio.linkedin, portfolio.linkedin),
            linkEl('Email  →  mailto:' + portfolio.email, 'mailto:' + portfolio.email),
        ]);
    }

    function cmdDate() {
        const now = new Date();
        const ist = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
        appendBlock([
            echoLine('date'),
            row('Date / Time (IST)', ist),
            okEl('Timezone: Asia/Kolkata (UTC+05:30)'),
        ]);
    }

    function cmdPwd() {
        appendBlock([
            echoLine('pwd'),
            el('div', 'term-v', '/home/gagan/portfolio'),
        ]);
    }

    function cmdClear() {
        while (termOutput.firstChild) termOutput.removeChild(termOutput.firstChild);
        const w = el('div', 'term-welcome');
        w.innerHTML = `<span class="term-welcome-line big">■ Gagan L K — <span class="tw-hl">Developer Console</span> v2.0</span>
                       <span class="term-welcome-line">Terminal cleared. Type <span class="tw-cmd">help</span> for commands.</span>`;
        termOutput.appendChild(w);
    }

    // ── Command registry ──────────────────────────────────
    const CMDS = {
        help:          cmdHelp,
        ls:            cmdHelp,
        whoami:        cmdWhoami,
        skills:        cmdSkills,
        projects:      cmdProjects,
        education:     cmdEducation,
        certs:         cmdCerts,
        certifications:cmdCerts,
        contact:       cmdContact,
        social:        cmdSocial,
        date:          cmdDate,
        pwd:           cmdPwd,
        clear:         cmdClear,
    };

    // ── Execute ───────────────────────────────────────────
    function execute(raw) {
        const cmd = raw.trim();
        if (!cmd) return;

        // Save to history
        if (cmdHistory[cmdHistory.length - 1] !== cmd) cmdHistory.push(cmd);
        histIdx = cmdHistory.length;

        const name = cmd.toLowerCase().split(/\s+/)[0];

        if (CMDS[name]) {
            CMDS[name]();
        } else {
            appendBlock([
                echoLine(cmd),
                errEl(`command not found: "${name}"`),
                el('div', 'term-ok', `✓  Type <span class="tw-cmd">help</span> to see available commands.`),
            ]);
        }
    }

    // ── Input events ──────────────────────────────────────
    termRunBtn.addEventListener('click', () => {
        const v = termInput.value;
        termInput.value = '';
        execute(v);
        termInput.focus();
    });

    termInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const v = termInput.value;
            termInput.value = '';
            execute(v);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (histIdx > 0) { histIdx--; termInput.value = cmdHistory[histIdx]; }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (histIdx < cmdHistory.length - 1) { histIdx++; termInput.value = cmdHistory[histIdx]; }
            else { histIdx = cmdHistory.length; termInput.value = ''; }
        }
    });

    // ── Quick-action buttons ──────────────────────────────
    const quickBtns = {
        'btn-cmd-help':     'help',
        'btn-cmd-whoami':   'whoami',
        'btn-cmd-skills':   'skills',
        'btn-cmd-projects': 'projects',
        'btn-cmd-certs':    'certs',
        'btn-cmd-clear':    'clear',
    };
    Object.entries(quickBtns).forEach(([id, cmd]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', () => { execute(cmd); termInput.focus(); });
    });

    // Expose for external use
    window.showToast = showToast;
});
