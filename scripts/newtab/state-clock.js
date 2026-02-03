let commandHistory = [];
let historyIndex = -1;
let currentTerminalPath = "browser";
let currentTerminalPathDisplay = "browser";

let inputQueue = [];
let isAwaitingInput = false;

let isLiveTimeRunning = false;
let liveTimeTimerId = null;
let liveTimeKeydownHandler = null;

let clockUiEl = null;
let clockUiTimerId = null;
let clockUiDragging = false;
let clockUiDragOffsetX = 0;
let clockUiDragOffsetY = 0;

function getStoredClockFace() {
    try {
        const v = localStorage.getItem('clockFace') || 'lcd';
        if (v === 'led' || v === 'matrix') return 'lcd';
        return v;
    } catch (_) {
        return 'lcd';
    }
}

function setStoredClockFace(face) {
    try { localStorage.setItem('clockFace', face); } catch (_) { }
}

function setClockUiOpenState(isOpen) {
    try { localStorage.setItem('clockUiOpen', isOpen ? '1' : '0'); } catch (_) { }
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ clockUiOpen: !!isOpen });
        }
    } catch (_) { }
}

function getStoredClockPosition() {
    try {
        const raw = localStorage.getItem('clockUiPosition');
        return raw ? JSON.parse(raw) : { left: 20, top: 60 };
    } catch (_) {
        return { left: 20, top: 60 };
    }
}

function setStoredClockPosition(pos) {
    try { localStorage.setItem('clockUiPosition', JSON.stringify(pos)); } catch (_) { }
    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ clockUiPosition: pos });
        }
    } catch (_) { }
}

function formatClockTime() {
    const now = new Date();
    const pad2 = (n) => String(n).padStart(2, '0');
    return `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
}

function applyClockFaceClass(container, face) {
    container.classList.remove('clock-face-lcd', 'clock-face-lcd-red', 'clock-face-pixel', 'clock-face-matrix', 'clock-face-analog', 'clock-face-led');
    if (face === 'pixel') container.classList.add('clock-face-pixel');
    else if (face === 'matrix') container.classList.add('clock-face-matrix');
    else if (face === 'analog') container.classList.add('clock-face-analog');
    else if (face === 'lcd-red') container.classList.add('clock-face-lcd-red');
    else container.classList.add('clock-face-lcd');
}

function openClockUI() {
    if (clockUiEl) {
        clockUiEl.style.display = 'block';
        clockUiEl.style.zIndex = '9999';
        setClockUiOpenState(true);
        return;
    }

    const pos = getStoredClockPosition();
    const face = getStoredClockFace();

    const container = document.createElement('div');
    container.className = 'floating-clock clock-face-lcd';
    container.style.position = 'fixed';
    container.style.left = `${pos.left}px`;
    container.style.top = `${pos.top}px`;
    container.style.zIndex = '9999';

    try {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get('clockUiPosition', (data) => {
                const saved = data && data.clockUiPosition;
                if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
                    let left = saved.left;
                    let top = saved.top;
                    left = Math.max(0, Math.min(window.innerWidth - container.offsetWidth, left));
                    top = Math.max(0, Math.min(window.innerHeight - container.offsetHeight, top));
                    container.style.left = `${left}px`;
                    container.style.top = `${top}px`;
                }
            });
        }
    } catch (_) { }

    const header = document.createElement('div');
    header.className = 'floating-clock-header';
    header.textContent = 'Clock';

    const actions = document.createElement('div');
    actions.className = 'floating-clock-actions';
    const gearBtn = document.createElement('button');
    gearBtn.className = 'floating-clock-gear';
    gearBtn.title = 'Settings';
    gearBtn.textContent = '⚙';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'floating-clock-close';
    closeBtn.title = 'Close';
    closeBtn.textContent = '×';
    actions.appendChild(gearBtn);
    actions.appendChild(closeBtn);
    header.appendChild(actions);

    const body = document.createElement('div');
    body.className = 'floating-clock-body';
    const timeEl = document.createElement('div');
    timeEl.className = 'floating-clock-time';
    timeEl.textContent = formatClockTime();
    const analogEl = document.createElement('div');
    analogEl.className = 'floating-clock-analog';
    analogEl.style.display = 'none';
    analogEl.innerHTML = `
    <svg viewBox="0 0 100 100" width="180" height="180">
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" stroke-width="2" />
      <g id="ticks">
        ${Array.from({ length: 60 }).map((_, i) => {
        const length = (i % 5 === 0) ? 6 : 3;
        return `<line x1="50" y1="4" x2="50" y2="${4 + length}" stroke="currentColor" stroke-width="${i % 5 === 0 ? 1.5 : 0.8}" transform="rotate(${i * 6} 50 50)" />`;
    }).join('')}
      </g>
      <line id="hourHand" x1="50" y1="50" x2="50" y2="30" stroke="currentColor" stroke-linecap="round" stroke-width="3" />
      <line id="minuteHand" x1="50" y1="50" x2="50" y2="22" stroke="currentColor" stroke-linecap="round" stroke-width="2" />
      <line id="secondHand" x1="50" y1="53" x2="50" y2="16" stroke="currentColor" stroke-linecap="round" stroke-width="1" />
      <circle cx="50" cy="50" r="1.8" fill="currentColor" />
    </svg>`;
    const settingsEl = document.createElement('div');
    settingsEl.className = 'floating-clock-settings';
    settingsEl.style.display = 'none';
    const label = document.createElement('label');
    label.textContent = 'Face: ';
    const select = document.createElement('select');
    select.className = 'floating-clock-select';
    const faces = [
        { value: 'lcd', label: 'LCD Green' },
        { value: 'lcd-red', label: 'LCD Red' },
        { value: 'pixel', label: 'Big Pixel' },
        { value: 'analog', label: 'Analog' },
    ];
    faces.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.value;
        opt.textContent = f.label;
        if (f.value === face) opt.selected = true;
        select.appendChild(opt);
    });
    settingsEl.appendChild(label);
    settingsEl.appendChild(select);

    body.appendChild(timeEl);
    body.appendChild(analogEl);
    body.appendChild(settingsEl);

    container.appendChild(header);
    container.appendChild(body);

    applyClockFaceClass(container, face);
    const updateFaceVisibility = (f) => {
        if (f === 'analog') {
            analogEl.style.display = '';
            timeEl.style.display = 'none';
        } else {
            analogEl.style.display = 'none';
            timeEl.style.display = '';
        }
    };
    updateFaceVisibility(face);

    header.addEventListener('mousedown', (e) => {
        clockUiDragging = true;
        const rect = container.getBoundingClientRect();
        clockUiDragOffsetX = e.clientX - rect.left;
        clockUiDragOffsetY = e.clientY - rect.top;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', (e) => {
        if (!clockUiDragging) return;
        let left = e.clientX - clockUiDragOffsetX;
        let top = e.clientY - clockUiDragOffsetY;
        left = Math.max(0, Math.min(window.innerWidth - container.offsetWidth, left));
        top = Math.max(0, Math.min(window.innerHeight - container.offsetHeight, top));
        container.style.left = `${left}px`;
        container.style.top = `${top}px`;
    });
    document.addEventListener('mouseup', () => {
        if (!clockUiDragging) return;
        clockUiDragging = false;
        document.body.style.userSelect = '';
        const rect = container.getBoundingClientRect();
        setStoredClockPosition({ left: Math.round(rect.left), top: Math.round(rect.top) });
    });

    gearBtn.addEventListener('click', () => {
        settingsEl.style.display = settingsEl.style.display === 'none' ? 'block' : 'none';
    });
    closeBtn.addEventListener('click', () => {
        if (clockUiTimerId) clearInterval(clockUiTimerId);
        clockUiTimerId = null;
        container.remove();
        clockUiEl = null;
        setClockUiOpenState(false);
    });
    select.addEventListener('change', () => {
        const val = select.value;
        setStoredClockFace(val);
        applyClockFaceClass(container, val);
        updateFaceVisibility(val);
        startClockUpdates();
        if (val === 'analog') updateAnalog();
        else timeEl.textContent = formatClockTime();
    });

    const stopClockUpdates = () => {
        if (clockUiTimerId) {
            clearInterval(clockUiTimerId);
            clockUiTimerId = null;
        }
    };

    const updateAnalog = () => {
        const now = new Date();
        const seconds = now.getSeconds();
        const minutes = now.getMinutes();
        const hours = now.getHours() % 12 + minutes / 60;
        const secAngle = seconds * 6;
        const minAngle = (minutes + seconds / 60) * 6;
        const hourAngle = hours * 30;
        const root = analogEl.querySelector('svg');
        if (root) {
            const h = root.querySelector('#hourHand');
            const m = root.querySelector('#minuteHand');
            const s = root.querySelector('#secondHand');
            if (h) h.setAttribute('transform', `rotate(${hourAngle} 50 50)`);
            if (m) m.setAttribute('transform', `rotate(${minAngle} 50 50)`);
            if (s) s.setAttribute('transform', `rotate(${secAngle} 50 50)`);
        }
    };

    const startClockUpdates = () => {
        if (!clockUiTimerId) {
            clockUiTimerId = setInterval(() => {
                if (select.value === 'analog') updateAnalog();
                else timeEl.textContent = formatClockTime();
            }, 1000);
        }
    };
    select.addEventListener('focus', stopClockUpdates);
    select.addEventListener('mousedown', stopClockUpdates);
    select.addEventListener('blur', startClockUpdates);

    if (clockUiTimerId) clearInterval(clockUiTimerId);
    clockUiTimerId = setInterval(() => {
        if (select.value === 'analog') updateAnalog();
        else timeEl.textContent = formatClockTime();
    }, 1000);
    if (select.value === 'analog') updateAnalog();

    document.body.appendChild(container);
    clockUiEl = container;
    setClockUiOpenState(true);
}
