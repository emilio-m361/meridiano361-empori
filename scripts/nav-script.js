/**
 * nav-script.js — M361 App
 * ─────────────────────────────────────────────────
 * Una sola riga in ogni pagina (fine del <body>):
 *   <script src="../../scripts/nav-script.js"></script>
 * Per index.html (root):
 *   <script src="scripts/nav-script.js"></script>
 * ─────────────────────────────────────────────────
 * IDs esposti per compatibilità con le pagine esistenti:
 *   #header-title  — titolo nell'header (modificabile via JS)
 *   #back-btn      — bottone indietro nell'header (hidden di default)
 */
(function () {
  'use strict';

  /* ── Esegui una sola volta ── */
  if (window.__m361NavLoaded) return;
  window.__m361NavLoaded = true;

  /* ═══════════════════════════════════════
     PERCORSO BASE
  ═══════════════════════════════════════ */
  function getBase() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src && s.src.includes('nav-script.js')) {
        return s.src.replace(/scripts\/nav-script\.js.*$/, '');
      }
    }
    const path = window.location.pathname.replace(/\\/g, '/');
    const depth = path.split('/').filter(Boolean).length - 1;
    if (depth <= 0) return './';
    return Array(depth).fill('..').join('/') + '/';
  }
  const BASE = getBase();

  /* ═══════════════════════════════════════
     VOCI DI NAVIGAZIONE
  ═══════════════════════════════════════ */
  const NAV = [
    { group: null, items: [
      { id: 'home', label: 'Home', icon: 'fa-house', href: 'index.html', active: true },
    ]},
    { group: 'Clienti', items: [
      { id: 'ordini',       label: 'Ordini',       icon: 'fa-bag-shopping',   href: 'pages/ordini/ordini.html',         active: true  },
      { id: 'prenotazioni', label: 'Prenotazioni', icon: 'fa-calendar-check', href: 'pages/prenotazioni/index.html',    active: false },
      { id: 'tessere',      label: 'Tessere',      icon: 'fa-id-card',        href: 'pages/tessere/index.html',         active: false },
      { id: 'info',         label: 'Info',         icon: 'fa-message',        href: 'pages/info/index.html',            active: false },
    ]},
    { group: 'Negozio', items: [
      { id: 'turni',        label: 'Turni',        icon: 'fa-users',          href: 'pages/turni/turni.html',           active: true  },
      { id: 'cassa',        label: 'Cassa',        icon: 'fa-cash-register',  href: 'pages/cassa/cassa.html',           active: true  },
      { id: 'calendario',   label: 'Calendario',   icon: 'fa-calendar-days',  href: 'pages/calendario/index.html',      active: false },
      { id: 'rifornimento', label: 'Rifornimento', icon: 'fa-boxes-stacked',  href: 'pages/rifornimento/index.html',    active: false },
      { id: 'prezzi',       label: 'Prezzi',       icon: 'fa-tag',            href: 'pages/prezzi/index.html',          active: false },
    ]},
    { group: null, items: [
      { id: 'logout', label: 'Esci', icon: 'fa-right-from-bracket', href: '#', active: true, isLogout: true },
    ]},
  ];
  const ALL_ITEMS = NAV.flatMap(s => s.items);

  /* ═══════════════════════════════════════
     DIPENDENZE (Font Awesome + Google Fonts)
  ═══════════════════════════════════════ */
  function injectDeps() {
    if (!document.getElementById('m361-fa')) {
      const fa = document.createElement('link');
      fa.id = 'm361-fa'; fa.rel = 'stylesheet';
      fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
      document.head.appendChild(fa);
    }
    if (!document.getElementById('m361-fonts')) {
      const f = document.createElement('link');
      f.id = 'm361-fonts'; f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap';
      document.head.appendChild(f);
    }
  }

  /* ═══════════════════════════════════════
     STILI
  ═══════════════════════════════════════ */
  function injectStyles() {
    if (document.getElementById('m361-styles')) return;
    const css = `
/* ── M361 base ── */
*, *::before, *::after { box-sizing: border-box; }
body {
  font-family: 'Inter', sans-serif;
  padding-top: 56px;
  padding-bottom: 68px;
}

/* ── HEADER ── */
#m361-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  z-index: 9000;
  box-shadow: 0 1px 4px rgba(0,0,0,.05);
  gap: 12px;
}
#m361-header .hd-left {
  display: flex; align-items: center;
  gap: 0; text-decoration: none; flex: 1; min-width: 0;
}
#m361-header .hd-logo { height: 28px; object-fit: contain; flex-shrink: 0; }
#m361-header .hd-logo-fb {
  font-weight: 900; font-size: 15px; color: #b75252;
  letter-spacing: .08em; flex-shrink: 0; display: none;
}
#m361-header .hd-sep {
  width: 1px; height: 22px; background: #e5e7eb;
  margin: 0 12px; flex-shrink: 0;
}
#m361-header #header-title {
  font-size: 14px; font-weight: 700; color: #334155;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 220px;
}
#m361-header .hd-right {
  display: flex; align-items: center; gap: 8px; flex-shrink: 0;
}
/* back-btn — compatibilità pagine esistenti */
#back-btn {
  display: none; /* hidden di default, le pagine lo mostrano via JS */
  align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #64748b;
  background: none; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif; transition: color .15s;
}
#back-btn:not(.hidden) { display: flex; }
#back-btn:hover { color: #b75252; }
/* logout */
#m361-logout-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 10px;
  border: 1.5px solid #b75252; background: transparent;
  color: #b75252; font-size: 11px; font-weight: 800;
  text-transform: uppercase; letter-spacing: .08em;
  cursor: pointer; font-family: 'Inter', sans-serif;
  transition: background .15s; white-space: nowrap;
}
#m361-logout-btn:hover { background: #fff1f1; }
.hd-logout-txt { display: inline; }
@media(max-width:480px) {
  .hd-logout-txt { display: none; }
  #m361-header #header-title { font-size: 12px; max-width: 120px; }
}

/* ── BOTTOM NAV ── */
#m361-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0; height: 60px;
  background: #b75252;
  border-top: 2px solid #9e3f3f;
  z-index: 9000;
  display: flex; align-items: stretch;
  overflow-x: auto; overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  box-shadow: 0 -2px 10px rgba(0,0,0,.15);
}
#m361-nav::-webkit-scrollbar { display: none; }
.mn-sep {
  width: 1px; background: rgba(255,255,255,.2);
  margin: 10px 0; flex-shrink: 0;
}
.mn-item {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 3px; padding: 0 13px; min-width: 58px;
  text-decoration: none; cursor: pointer;
  transition: background .12s; border: none;
  background: transparent; flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.mn-item i { font-size: 16px; color: rgba(255,255,255,.65); transition: color .12s; line-height: 1; }
.mn-item span { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: rgba(255,255,255,.65); white-space: nowrap; transition: color .12s; }
.mn-item.mn-current { background: rgba(255,255,255,.22); border-radius: 12px; margin: 7px 3px; padding: 0 11px; }
.mn-item.mn-current i, .mn-item.mn-current span { color: #fff; }
.mn-item.mn-active:not(.mn-current):hover { background: rgba(255,255,255,.12); }
.mn-item.mn-active:hover i, .mn-item.mn-active:hover span { color: #fff; }
.mn-item.mn-wip { opacity: .35; cursor: not-allowed; pointer-events: none; }
.mn-item.mn-logout { opacity: .75; }
.mn-item.mn-logout:hover { opacity: 1; background: rgba(255,255,255,.12); }
.mn-item.mn-logout:hover i, .mn-item.mn-logout:hover span { color: #fff; }
    `;
    const st = document.createElement('style');
    st.id = 'm361-styles';
    st.textContent = css;
    document.head.insertBefore(st, document.head.firstChild);
  }

  /* ═══════════════════════════════════════
     PAGINA CORRENTE
  ═══════════════════════════════════════ */
  function getCurrentId() {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (path === '/' || (path.endsWith('index.html') && path.split('/').filter(Boolean).length <= 1)) return 'home';
    for (const item of ALL_ITEMS) {
      if (item.id === 'home' || item.id === 'logout') continue;
      const parts = item.href.split('/').filter(Boolean);
      if (parts.some(p => { const seg = p.replace('.html','').toLowerCase(); return seg.length > 2 && path.includes('/' + seg); })) return item.id;
    }
    return null;
  }

  /* ═══════════════════════════════════════
     BUILD HEADER
     Espone per compatibilità:
       #header-title  (aggiornabile via JS dalle pagine)
       #back-btn      (mostrabile via classList.remove('hidden'))
       #m361-logout-btn
  ═══════════════════════════════════════ */
  function buildHeader() {
    /* rimuovi header statici preesistenti */
    document.querySelectorAll('header:not(#m361-header)').forEach(h => h.remove());
    if (document.getElementById('m361-header')) return;

    const pageTitle = document.title.replace(/^M361\s*[-–]\s*/i, '').trim() || 'App';
    const logoSrc   = BASE + 'assets/images/logom361_rosso.jpg';

    const hdr = document.createElement('header');
    hdr.id = 'm361-header';
    hdr.innerHTML = `
      <a href="${BASE}index.html" class="hd-left" title="Home">
        <img src="${logoSrc}" alt="M361" class="hd-logo"
             onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="hd-logo-fb">M361</span>
        <span class="hd-sep"></span>
        <span id="header-title">${pageTitle}</span>
      </a>
      <div class="hd-right">
        <button id="back-btn" class="hidden" onclick="history.back()">
          <i class="fas fa-arrow-left"></i> Indietro
        </button>
        <button id="m361-logout-btn">
          <i class="fas fa-right-from-bracket"></i>
          <span class="hd-logout-txt">Esci</span>
        </button>
      </div>
    `;
    document.body.insertBefore(hdr, document.body.firstChild);

    document.getElementById('m361-logout-btn').addEventListener('click', () => {
      if (confirm('Vuoi uscire dall\'applicazione?')) window.location.href = BASE + 'index.html';
    });
  }

  /* ═══════════════════════════════════════
     BUILD BOTTOM NAV
  ═══════════════════════════════════════ */
  function buildNav() {
    document.querySelectorAll('#m361-nav, nav.bottom-nav, .bottom-nav').forEach(n => n.remove());
    const currentId = getCurrentId();
    const nav = document.createElement('nav');
    nav.id = 'm361-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navigazione principale');

    NAV.forEach((section, si) => {
      if (si > 0) { const sep = document.createElement('div'); sep.className = 'mn-sep'; nav.appendChild(sep); }
      section.items.forEach(item => {
        const isCurrent = item.id === currentId;
        const a = document.createElement('a');
        a.className = 'mn-item'
          + (item.active  ? ' mn-active'  : ' mn-wip')
          + (isCurrent    ? ' mn-current' : '')
          + (item.isLogout? ' mn-logout'  : '');
        a.href = item.isLogout ? '#' : (item.active ? BASE + item.href : '#');
        if (!item.active) { a.setAttribute('aria-disabled','true'); a.setAttribute('tabindex','-1'); }
        if (isCurrent) a.setAttribute('aria-current','page');
        if (item.isLogout) {
          a.addEventListener('click', e => {
            e.preventDefault();
            if (confirm('Vuoi uscire dall\'applicazione?')) window.location.href = BASE + 'index.html';
          });
        }
        a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
        nav.appendChild(a);
      });
    });

    document.body.appendChild(nav);
    requestAnimationFrame(() => {
      const cur = nav.querySelector('.mn-current');
      if (cur) cur.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    });
  }

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  function init() {
    injectDeps();
    injectStyles();
    buildHeader();
    buildNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
