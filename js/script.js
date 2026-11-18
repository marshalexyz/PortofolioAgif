const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 8-bit sound (synthesized, no audio files) ----------
let audioCtx, muted = false;
function ctx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
}
function tone(c, t, freq, dur, vol = 0.12, type = 'square', to) {
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur);
}
const sounds = {
    select(c) { tone(c, c.currentTime, 660, 0.06); },                          // menu blip
    coin(c)   { const t = c.currentTime; tone(c, t, 988, 0.07); tone(c, t + 0.07, 1319, 0.22); },
    hit(c)    { const t = c.currentTime; tone(c, t, 220, 0.14, 0.15, 'sawtooth', 60); },
    levelup(c){ const t = c.currentTime; [523, 659, 784, 1047].forEach((f, i) => tone(c, t + i * 0.09, f, 0.14)); }
};
function play(name) {
    if (muted) return;
    try { sounds[name](ctx()); } catch (e) { /* audio unsupported */ }
}

// ---------- HUD: XP follows scroll, level follows screens visited ----------
const xp = document.getElementById('xp');
const lvl = document.getElementById('lvl');
const toast = document.getElementById('toast');
const links = [...document.querySelectorAll('.hotbar a')];
const seen = new Set(['home']);

function updateXP() {
    const max = document.documentElement.scrollHeight - innerHeight;
    xp.style.width = (max > 0 ? Math.min(100, scrollY / max * 100) : 0) + '%';
}
addEventListener('scroll', updateXP, { passive: true });
addEventListener('resize', updateXP);
updateXP();

function announce(html) {
    toast.innerHTML = html;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
}

if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
            if (!e.isIntersecting) return;
            const id = e.target.id;
            links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
            if (!seen.has(id)) {
                seen.add(id);
                lvl.textContent = seen.size;
                play('levelup');
                announce('LEVEL UP!<br>Lv ' + seen.size + ' · ' + e.target.dataset.lv);
            }
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('.screen').forEach((s) => spy.observe(s));
}

// ---------- Dialogue box: typewriter intro ----------
const intro = document.getElementById('intro');
if (intro && !reduced) {
    const text = intro.dataset.text;
    intro.textContent = '';
    intro.classList.add('typing');
    let i = 0;
    const timer = setInterval(() => {
        intro.textContent = text.slice(0, ++i);
        if (i >= text.length) { clearInterval(timer); intro.classList.remove('typing'); }
    }, 16);
}

// ---------- Tap the portrait: +XP floating number ----------
const portrait = document.getElementById('avatar-box');
const xpGain = [5, 10, 15, 25];
portrait.addEventListener('click', (e) => {
    const box = portrait.getBoundingClientRect();
    const fx = document.createElement('span');
    fx.className = 'float';
    fx.textContent = '+' + xpGain[Math.floor(Math.random() * xpGain.length)] + ' XP';
    fx.style.left = (e.clientX - box.left) + 'px';
    fx.style.top = (e.clientY - box.top) + 'px';
    fx.setAttribute('aria-hidden', 'true');
    portrait.appendChild(fx);
    play('coin');
    setTimeout(() => fx.remove(), 900);
});

// ---------- Menu blips on links, buttons, inventory slots ----------
document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.sound-toggle') || e.target.closest('#avatar-box')) return;
    if (e.target.closest('a, button')) play('select');
    else if (e.target.closest('.slots li, .quest')) play('hit');
});

// ---------- Mute button ----------
const muteBtn = document.createElement('button');
muteBtn.type = 'button';
muteBtn.className = 'sound-toggle';
muteBtn.setAttribute('aria-label', 'Mute sound effects');
muteBtn.setAttribute('aria-pressed', 'false');
muteBtn.textContent = '🔊';
muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
    play('select');
});
document.body.appendChild(muteBtn);
