// ---------- Mobile menu ----------
const toggle = document.querySelector('.nav__toggle');
const menu = document.getElementById('menu');

function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}

toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

// ---------- Highlight the nav link of the section on screen ----------
const links = [...menu.querySelectorAll('a[href^="#"]')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);

if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
}

// ---------- Comic sound effects (synthesized, no audio files needed) ----------
let audioCtx;
let muted = false;

function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}

// Burst of noise = the "crack" of a punch / impact
function noiseBurst(c, t, dur, vol, freq) {
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t);
}

// Falling tone = the "thump" of a punch
function thump(c, t, from, to, dur, vol, type = 'sine') {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + dur);
}

const sounds = {
    // heavy impact: POW! BAM! WHAM! BOOM!
    pow(c) {
        const t = c.currentTime;
        noiseBurst(c, t, 0.18, 0.9, 1800);
        thump(c, t, 180, 40, 0.28, 1);
    },
    // laser: ZAP!
    zap(c) {
        const t = c.currentTime;
        thump(c, t, 1400, 120, 0.22, 0.35, 'sawtooth');
        noiseBurst(c, t, 0.08, 0.3, 4000);
    },
    // small pop for buttons and links
    pop(c) {
        const t = c.currentTime;
        thump(c, t, 520, 220, 0.09, 0.4, 'square');
    },
    // cartoon spring: BOING!
    boing(c) {
        const t = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.08);
        osc.frequency.exponentialRampToValueAtTime(260, t + 0.3);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain).connect(c.destination);
        osc.start(t);
        osc.stop(t + 0.3);
    }
};

function play(name) {
    if (muted) return;
    try { sounds[name](ctx()); } catch (e) { /* audio not supported, ignore */ }
}

// ---------- Click the photo: comic word + matching sound ----------
const photo = document.querySelector('.photo');
const words = ['POW!', 'BAM!', 'ZAP!', 'WHAM!', 'BOOM!'];
const colors = ['sfx--pink', 'sfx--cyan', 'sfx--yellow'];

photo.addEventListener('click', (e) => {
    const box = photo.getBoundingClientRect();
    const word = words[Math.floor(Math.random() * words.length)];
    const fx = document.createElement('span');
    fx.className = 'sfx pow ' + colors[Math.floor(Math.random() * colors.length)];
    fx.textContent = word;
    fx.style.left = (e.clientX - box.left) + 'px';
    fx.style.top = (e.clientY - box.top) + 'px';
    fx.setAttribute('aria-hidden', 'true');
    photo.appendChild(fx);
    play(word === 'ZAP!' ? 'zap' : 'pow');
    setTimeout(() => fx.remove(), 900);
});

// ---------- Every press anywhere on the page makes a sound ----------
document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.photo')) return;          // photo has its own sound
    if (e.target.closest('.sound-toggle')) return;   // mute button handles itself

    if (e.target.closest('a, button')) {
        play('pop');                                 // links and buttons
    } else if (e.target.closest('.shot, .card')) {
        play('boing');                               // project images and cards
    } else if (e.target.closest('.panel, li')) {
        play('pow');                                 // panels, skill icons
    } else {
        play('pop');                                 // anything else, even empty space
    }
});

// ---------- Mute button (created here, no HTML changes needed) ----------
const muteBtn = document.createElement('button');
muteBtn.type = 'button';
muteBtn.className = 'sound-toggle';
muteBtn.setAttribute('aria-label', 'Mute sound effects');
muteBtn.setAttribute('aria-pressed', 'false');
muteBtn.textContent = '🔊';
Object.assign(muteBtn.style, {
    position: 'fixed',
    right: '18px',
    bottom: '18px',
    zIndex: '999',
    width: '48px',
    height: '48px',
    fontSize: '22px',
    cursor: 'pointer',
    background: 'var(--yellow, #ffd23f)',
    border: '3px solid var(--ink, #16131f)',
    boxShadow: '4px 4px 0 var(--ink, #16131f)'
});

muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
    play('pop');                                    
});
document.body.appendChild(muteBtn);