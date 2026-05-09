/**
 * nav-script.js — M361 shared header + bottom navigation
 * Include questo file in ogni pagina dell'app.
 * Non aggiungere header o bottom-nav statici nelle singole pagine.
 *
 * Font utilizzati in tutta l'app (max 3):
 *   1. Inter        — testo generale, UI
 *   2. DM Mono      — numeri, codici, valori monetari
 *   (nessun terzo font necessario)
 *
 * Struttura directory attesa:
 *   /index.html
 *   /pages/turni/turni.html
 *   /pages/cassa/cassa.html
 *   /pages/ordini/ordini.html
 *   /scripts/nav-script.js
 *   /assets/style/nav-style.css
 *   /assets/images/logom361_rosso.jpg
 */

(function () {

  /* ─────────────────────────────────────────────────
     RILEVAMENTO PERCORSO BASE
     Funziona sia con file:// sia con http(s)://
  ───────────────────────────────────────────────── */
  function getBase() {
    const path = window.location.pathname.replace(/\\/g, '/');
    // conta le directory sopra il file corrente
    const depth = (path.split('/').filter(Boolean).length) - 1;
    if (depth <= 0) return './';
    return Array(depth).fill('..').join('/') + '/';
  }
  const BASE = getBase();

  /* ─────────────────────────────────────────────────
     DEFINIZIONE VOCI DI NAVIGAZIONE
  ───────────────────────────────────────────────── */
  const SECTIONS = [
    {
      group: null,
      items: [
        { id: 'home',    label: 'Home',    icon: 'fa-house',       href: 'index.html',              active: true  },
      ]
    },
    {
      group: 'Clienti',
      items: [
        { id: 'ordini',       label: 'Ordini',       icon: 'fa-bag-shopping',      href: 'pages/ordini/ordini.html',      active: true  },
        { id: 'prenotazioni', label: 'Prenotazioni', icon: 'fa-calendar-check',    href: 'pages/prenotazioni/index.html', active: false },
        { id: 'tessere',      label: 'Tessere',      icon: 'fa-id-card',           href: 'pages/tessere/index.html',      active: false },
        { id: 'info',         label: 'Info',         icon: 'fa-message',           href: 'pages/info/index.html',         active: false },
      ]
    },
    {
      group: 'Negozio',
      items: [
        { id: 'turni',      label: 'Turni',      icon: 'fa-users',           href: 'pages/turni/turni.html',   active: true  },
        { id: 'cassa',      label: 'Cassa',      icon: 'fa-cash-register',   href: 'pages/cassa/cassa.html',   active: true  },
        { id: 'calendario', label: 'Calendario', icon: 'fa-calendar-days',   href: 'pages/calendario/index.html', active: false },
        { id: 'rifornimento',label:'Rifornimento',icon:'fa-boxes-stacked',   href: 'pages/rifornimento/index.html', active: false },
        { id: 'prezzi',     label: 'Prezzi',     icon: 'fa-tag',             href: 'pages/prezzi/index.html',  active: false },
      ]
    },
    {
      group: null,
      items: [
        { id: 'logout', label: 'Esci', icon: 'fa-right-from-bracket', href: '#', active: true, isLogout: true },
      ]
    }
  ];

  const ALL_ITEMS = SECTIONS.flatMap(s => s.items);

  /* ─────────────────────────────────────────────────
     FONT LOADER (iniettato una sola volta)
  ───────────────────────────────────────────────── */
  function ensureFonts() {
    if (document.getElementById('m361-fonts')) return;
    const link = document.createElement('link');
    link.id   = 'm361-fonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap';
    document.head.appendChild(link);
  }

  /* ─────────────────────────────────────────────────
     CSS GLOBALE (iniettato una sola volta)
  ───────────────────────────────────────────────── */
  function ensureStyles() {
    if (document.getElementById('m361-nav-css')) return;
    const style = document.createElement('style');
    style.id = 'm361-nav-css';
    style.textContent = `
      /* ── Font base ── */
      *, *::before, *::after { box-sizing: border-box; }
      body {
        font-family: 'Inter', sans-serif;
        background: #f0f2f5;
        color: #1e293b;
        padding-top: 56px;
        padding-bottom: 68px;
        margin: 0;
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
        padding: 0 20px;
        z-index: 500;
        box-shadow: 0 1px 4px rgba(0,0,0,.05);
      }
      #m361-header .hd-left {
        display: flex;
        align-items: center;
        gap: 0;
        text-decoration: none;
      }
      #m361-header .hd-logo {
        height: 28px;
        object-fit: contain;
        display: block;
      }
      #m361-header .hd-logo-fallback {
        font-weight: 900;
        font-size: 16px;
        color: #b75252;
        letter-spacing: .08em;
      }
      #m361-header .hd-divider {
        width: 1px;
        height: 22px;
        background: #e5e7eb;
        margin: 0 14px;
        flex-shrink: 0;
      }
      #m361-header .hd-title {
        font-size: 15px;
        font-weight: 700;
        color: #334155;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 200px;
      }
      #m361-header .hd-right {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .hd-logout-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 10px;
        border: 1.5px solid #b75252;
        background: transparent;
        color: #b75252;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .08em;
        cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: all .15s;
        text-decoration: none;
      }
      .hd-logout-btn:hover { background: #fff1f1; }
      .hd-logout-btn i { font-size: 13px; }
      @media(max-width:480px) {
        .hd-logout-text { display: none; }
        #m361-header .hd-title { max-width: 130px; font-size: 13px; }
      }

      /* ── BOTTOM NAV ── */
      #m361-nav {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        height: 60px;
        background: #b75252;
        border-top: 2px solid #9e3f3f;
        z-index: 500;
        display: flex;
        align-items: stretch;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
        box-shadow: 0 -2px 10px rgba(0,0,0,.12);
      }
      #m361-nav::-webkit-scrollbar { display: none; }

      .m361-nav-sep {
        width: 1px;
        background: rgba(255,255,255,.15);
        margin: 10px 0;
        flex-shrink: 0;
      }

      .m361-nav-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 0 14px;
        min-width: 60px;
        text-decoration: none;
        cursor: pointer;
        transition: background .12s;
        border: none;
        background: transparent;
        flex-shrink: 0;
        position: relative;
        font-family: 'Inter', sans-serif;
      }
      .m361-nav-item i {
        font-size: 17px;
        color: rgba(255,255,255,.75);
        transition: color .12s;
      }
      .m361-nav-item span {
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: .06em;
        color: rgba(255,255,255,.7);
        white-space: nowrap;
        transition: color .12s;
      }

      /* attivo (pagina corrente) */
      .m361-nav-item.is-current {
        background: rgba(255,255,255,.18);
        border-radius: 12px;
        margin: 6px 4px;
        padding: 0 12px;
      }
      .m361-nav-item.is-current i,
      .m361-nav-item.is-current span { color: #fff; }

      /* hover */
      .m361-nav-item.nav-active:not(.is-current):hover {
        background: rgba(255,255,255,.1);
      }
      .m361-nav-item.nav-active:hover i,
      .m361-nav-item.nav-active:hover span { color: #fff; }

      /* WIP / inattivo */
      .m361-nav-item.nav-wip {
        opacity: .40;
        cursor: not-allowed;
        pointer-events: none;
      }

      /* logout — leggermente diverso */
      .m361-nav-item.nav-logout i,
      .m361-nav-item.nav-logout span { color: rgba(255,255,255,.6); }
      .m361-nav-item.nav-logout:hover i,
      .m361-nav-item.nav-logout:hover span { color: #fff; }

      /* ── Tooltip WIP (opzionale, su desktop) ── */
      .m361-nav-item.nav-wip::after {
        content: 'In costruzione';
        position: absolute;
        bottom: 66px;
        left: 50%;
        transform: translateX(-50%);
        background: #1e293b;
        color: #fff;
        font-size: 10px;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 6px;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: opacity .2s;
        font-family: 'Inter', sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  /* ─────────────────────────────────────────────────
     RILEVAMENTO PAGINA CORRENTE
  ───────────────────────────────────────────────── */
  function getCurrentId() {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    if (path === '/' || path.endsWith('index.html') && !path.includes('/pages/')) return 'home';
    for (const item of ALL_ITEMS) {
      if (item.id === 'home') continue;
      const seg = item.href.split('/').pop().replace('.html','').toLowerCase();
      if (path.includes(seg) && seg.length > 2) return item.id;
    }
    return null;
  }

  /* ─────────────────────────────────────────────────
     BUILD HEADER
  ───────────────────────────────────────────────── */
  function buildHeader() {
    // rimuovi header statici esistenti per evitare duplicati
    document.querySelectorAll('header').forEach(h => h.remove());

    const pageTitle = document.title.replace(/^M361\s*[-–]\s*/i, '').trim() || 'App';
    const header = document.createElement('header');
    header.id = 'm361-header';

    const logoSrc = BASE + 'assets/images/logom361_rosso.jpg';

    header.innerHTML = `
      <a href="${BASE}index.html" class="hd-left" title="Home">
        <img src="${logoSrc}" alt="M361" class="hd-logo"
             onerror="this.style.display='none';this.nextElementSibling.style.display='inline'">
        <span class="hd-logo-fallback" style="display:none">M361</span>
        <span class="hd-divider"></span>
        <span class="hd-title">${pageTitle}</span>
      </a>
      <div class="hd-right">
        <a href="#" class="hd-logout-btn" onclick="if(confirm('Vuoi uscire?')) window.location.href='${BASE}index.html'; return false;">
          <i class="fas fa-right-from-bracket"></i>
          <span class="hd-logout-text">Esci</span>
        </a>
      </div>
    `;

    // inserisci PRIMA di qualsiasi altro elemento
    document.body.insertBefore(header, document.body.firstChild);
  }

  /* ─────────────────────────────────────────────────
     BUILD BOTTOM NAV
  ───────────────────────────────────────────────── */
  function buildNav() {
    document.querySelectorAll('#m361-nav, .bottom-nav, nav.bottom-nav').forEach(n => n.remove());

    const currentId = getCurrentId();
    const nav = document.createElement('nav');
    nav.id = 'm361-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navigazione principale');

    SECTIONS.forEach((section, si) => {
      // separatore tra sezioni (tranne prima)
      if (si > 0) {
        const sep = document.createElement('div');
        sep.className = 'm361-nav-sep';
        nav.appendChild(sep);
      }

      section.items.forEach(item => {
        const el = document.createElement('a');
        const isCurrent = item.id === currentId;
        const href = item.isLogout ? '#' : BASE + item.href;

        el.href = href;
        el.className = 'm361-nav-item'
          + (item.active ? ' nav-active' : ' nav-wip')
          + (item.isLogout ? ' nav-logout' : '')
          + (isCurrent ? ' is-current' : '');

        el.setAttribute('aria-label', item.label);
        if (!item.active) {
          el.setAttribute('aria-disabled', 'true');
          el.setAttribute('tabindex', '-1');
          el.title = item.label + ' — in costruzione';
        }
        if (isCurrent) el.setAttribute('aria-current', 'page');

        if (item.isLogout) {
          el.addEventListener('click', e => {
            e.preventDefault();
            if (confirm('Vuoi uscire dall\'app?')) window.location.href = BASE + 'index.html';
          });
        }

        el.innerHTML = `
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        `;
        nav.appendChild(el);
      });
    });

    document.body.appendChild(nav);

    // scrolla al tab corrente
    const active = nav.querySelector('.is-current');
    if (active) {
      setTimeout(() => {
        active.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
      }, 50);
    }
  }

  /* ─────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────── */
  function init() {
    ensureFonts();
    ensureStyles();
    buildHeader();
    buildNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
