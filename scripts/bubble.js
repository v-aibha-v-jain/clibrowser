// Injects a draggable floating icon that toggles an iframe loading popup.html
(function () {
  const IFRAME_ID = 'clibrowser-terminal-iframe';
  const BUBBLE_ID = 'clibrowser-terminal-bubble';
  if (window.__clibrowser_bubble_injected) return;
  window.__clibrowser_bubble_injected = true;

  // Inject Font Awesome if not present
  if (!document.querySelector('link[href*="fontawesome"]')) {
    const fa = document.createElement('link');
    fa.rel = 'stylesheet';
    fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
    fa.crossOrigin = 'anonymous';
    document.head.appendChild(fa);
  }

  function makeBubble(container) {
    if (document.getElementById(BUBBLE_ID)) return;

    const bubble = document.createElement('button');
    bubble.id = BUBBLE_ID;
    bubble.setAttribute('aria-label', 'Open terminal');
    bubble.title = 'Open terminal';

    // Minimal collapsed size
    Object.assign(bubble.style, {
      position: 'fixed',
      right: '12px',
      bottom: '12px',
      width: '35px',
      height: '35px',
      borderRadius: '14px',
      border: 'none',
      boxShadow: '0 6px 18px rgba(0,0,0,0.25)',
      background: 'white',
      zIndex: String(2147483647),
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0',
      outline: 'none',
      transition: 'all 180ms cubic-bezier(.2,.9,.2,1)'
    });

    // compact icon (keeps visible on small size)
    bubble.innerHTML = '<i class="fa-solid fa-terminal" style="color:black; font-size:15px;"></i>';

    container.appendChild(bubble);

    function openTerminal() {
      if (document.getElementById(IFRAME_ID)) return;

      // compute numeric positions from bubble (avoid using raw style strings)
      const rightPx = parseInt(bubble.style.right, 10) || 12;
      const bottomPx = parseInt(bubble.style.bottom, 10) || 12;

      // expand bubble visually
      bubble.style.width = '44px';
      bubble.style.height = '44px';
      bubble.style.borderRadius = '10px';

      const iframe = document.createElement('iframe');
      iframe.id = IFRAME_ID;
      iframe.src = chrome.runtime.getURL('popup.html');

      // Match popup.css body width to avoid inner whitespace
      const finalWidth = 352;   // matches styles/popup.css body width
      const finalHeight = 100;  // tuned to your popup content (adjust if needed)

      Object.assign(iframe.style, {
        position: 'fixed',
        right: `${rightPx}px`,
        bottom: `${bottomPx + 56}px`,
        width: `${finalWidth}px`,
        height: '48px',               // start collapsed, animate to finalHeight
        boxSizing: 'border-box',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: '8px',
        boxShadow: '0 18px 50px rgba(0,0,0,0.45)',
        zIndex: String(2147483647),
        background: 'white',
        overflow: 'hidden',
        opacity: '0',
        transition: 'opacity 160ms ease, height 220ms cubic-bezier(.2,.9,.2,1)'
      });

      // sandbox to keep safe but allow extension content
      iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-same-origin allow-modals');

      container.appendChild(iframe);

      // fade in then expand height slightly after
      requestAnimationFrame(() => { iframe.style.opacity = '1'; });
      setTimeout(() => { iframe.style.height = `${finalHeight}px`; }, 60);

      function onDocClick(e) {
        const el = e.target;
        if (el === bubble || el === iframe || iframe.contains(el)) return;
        closeTerminal();
      }
      function onKey(e) { if (e.key === 'Escape') closeTerminal(); }

      document.addEventListener('click', onDocClick, true);
      window.addEventListener('keydown', onKey, true);
      iframe._closeHandlers = { onDocClick, onKey };

      bubble.setAttribute('data-open', '1');
    }

    function closeTerminal() {
      const iframe = document.getElementById(IFRAME_ID);
      if (!iframe) return;
      const h = iframe._closeHandlers || {};
      document.removeEventListener('click', h.onDocClick, true);
      window.removeEventListener('keydown', h.onKey, true);

      // collapse + fade before removing
      iframe.style.opacity = '0';
      iframe.style.height = '48px';

      // restore bubble
      bubble.style.width = '28px';
      bubble.style.height = '28px';
      bubble.style.borderRadius = '14px';
      bubble.removeAttribute('data-open');

      setTimeout(() => { iframe.remove(); }, 180);
    }

    bubble.addEventListener('click', (e) => {
      e.stopPropagation();
      const iframe = document.getElementById(IFRAME_ID);
      if (iframe) closeTerminal(); else openTerminal();
    });

    // draggable with respect to small size and expanded iframe
    (function (node) {
      let dragging = false, startX = 0, startY = 0, startRight = 12, startBottom = 12;
      node.addEventListener('pointerdown', (ev) => {
        dragging = true;
        startX = ev.clientX; startY = ev.clientY;
        startRight = parseInt(node.style.right, 10) || 12;
        startBottom = parseInt(node.style.bottom, 10) || 12;
        try { node.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      });
      window.addEventListener('pointermove', (ev) => {
        if (!dragging) return;
        const dx = ev.clientX - startX, dy = ev.clientY - startY;
        const newRight = Math.max(8, startRight - dx);
        const newBottom = Math.max(8, startBottom - dy);
        node.style.right = `${newRight}px`; node.style.bottom = `${newBottom}px`;
        const iframe = document.getElementById(IFRAME_ID);
        if (iframe) {
          iframe.style.right = `${newRight}px`;
          iframe.style.bottom = `${newBottom + 56}px`;
        }
      });
      window.addEventListener('pointerup', () => { dragging = false; });
    })(bubble);
  }

  // Only inject bubble if enabled in storage
  function shouldShowBubble(cb) {
    if (chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({showTerminalBubble: true}, (data) => {
        cb(!!data.showTerminalBubble);
      });
    } else {
      cb(true); // fallback: always show
    }
  }

  // Listen for changes to show/hide bubble live
  if (chrome && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes.showTerminalBubble) {
        const bubble = document.getElementById('clibrowser-terminal-bubble');
        if (bubble) bubble.style.display = changes.showTerminalBubble.newValue ? '' : 'none';
      }
    });
  }

  // inject after body exists, retry a few times
  let tries = 0;
  function inject() {
    tries++;
    shouldShowBubble((enabled) => {
      if (!enabled) return;
      try {
        const container = document.body || document.documentElement;
        if (!container) throw new Error('no container');
        makeBubble(container);
      } catch (err) {
        if (tries < 6) setTimeout(inject, 300);
        else console.warn('clibrowser bubble injection failed:', err);
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
    setTimeout(inject, 500);
  } else inject();
})();