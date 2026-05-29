/**
 * nav-script.js — M361 App
 * ─────────────────────────────────────────────────
 * Una sola riga in ogni pagina (fine del <body>):
 *   <script src="../../scripts/nav-script.js"></script>
 * Per index.html (root):
 *   <script src="scripts/nav-script.js"></script>
 * ─────────────────────────────────────────────────
 */
(function () {
  'use strict';
  if (window.__m361NavLoaded) return;
  window.__m361NavLoaded = true;

  /* ═══════════════════════════════════════
     SUPABASE CLIENT (lazy)
  ═══════════════════════════════════════ */
  const SUPA_URL = 'https://hsalynvxazxqtmsvjrzc.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWx5bnZ4YXp4cXRtc3ZqcnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjQ3MjcsImV4cCI6MjA5MzMwMDcyN30.JW4nsMrrfuI8BTg4bn2v74seVJ-_prfxZ1PQp5T18a8';

  function getSupabase() {
    if (window._supabase) return window._supabase;
    if (window.supabase && window.supabase.createClient) {
      window._supabase = window.supabase.createClient(SUPA_URL, SUPA_KEY);
      return window._supabase;
    }
    return null;
  }

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
    const p = window.location.pathname.replace(/\\/g, '/');
    const d = p.split('/').filter(Boolean).length - 1;
    return d <= 0 ? './' : Array(d).fill('..').join('/') + '/';
  }
  const BASE = getBase();

  /* ═══════════════════════════════════════
     SESSIONE UTENTE
  ═══════════════════════════════════════ */
  function getUserProfile() {
    try { return JSON.parse(localStorage.getItem('m361_user') || 'null'); } catch { return null; }
  }
  function getUserSections() {
    const p = getUserProfile();
    if (!p) return [];
    const s = p.sezioni;
    if (Array.isArray(s)) return s;
    if (typeof s === 'string') { try { return JSON.parse(s); } catch {} }
    return [];
  }

  function isPublicPage() {
    return window.location.pathname.toLowerCase().includes('login.html');
  }

  /* Logout */
  async function doLogout() {
    const db = getSupabase();
    if (db) { try { await db.auth.signOut(); } catch {} }
    localStorage.removeItem('m361_user');
    window.location.href = BASE + 'login.html';
  }
  window.__m361Logout = doLogout;

  /* Guard sessione NON-BLOCCANTE (in background dopo il rendering) */
  function guardSessionAsync() {
    if (isPublicPage()) return;
    setTimeout(async () => {
      const db = getSupabase();
      if (!db) return;
      try {
        const { data: { session } } = await db.auth.getSession();
        if (!session) {
          localStorage.removeItem('m361_user');
          window.location.href = BASE + 'login.html';
        }
      } catch { /* ignora errori di rete */ }
    }, 500);
  }

  /* ═══════════════════════════════════════
     VOCI DI NAVIGAZIONE
  ═══════════════════════════════════════ */
  const NAV = [
    { group: null, items: [
      { id: 'home', label: 'Home', icon: 'fa-house', href: 'index.html', section: null, active: true },
    ]},
    { group: 'Clienti', items: [
      { id: 'ordini',       label: 'Ordini',       icon: 'fa-bag-shopping',   href: 'pages/ordini/ordini.html',               section: 'ordini',  active: true  },
      { id: 'prenotazioni', label: 'Prenotazioni', icon: 'fa-calendar-check', href: 'pages/prenotazioni/prenotazioni.html',   section: null,      active: true  },
      { id: 'tessere',      label: 'Tessere',      icon: 'fa-id-card',        href: 'pages/tessere/index.html',               section: null,      active: false },
      { id: 'info',         label: 'Info',         icon: 'fa-message',        href: 'pages/info/info.html',            section: null,      active: true  },
    ]},
    { group: 'Negozio', items: [
      { id: 'turni',        label: 'Turni',        icon: 'fa-users',          href: 'pages/turni/turni.html',        section: 'turni',   active: true  },
      { id: 'cassa',        label: 'Cassa',        icon: 'fa-cash-register',  href: 'pages/cassa/cassa.html',        section: 'cassa',   active: true  },
      { id: 'calendario',   label: 'Calendario',   icon: 'fa-calendar-days',  href: 'pages/calendario/index.html',   section: null,      active: false },
      { id: 'rifornimento', label: 'Rifornimento', icon: 'fa-boxes-stacked',  href: 'pages/rifornimento/index.html', section: null,      active: false },
      { id: 'prezzi',       label: 'Prezzi',       icon: 'fa-tag',            href: 'pages/prezzi/prezzi.html',          section: null,      active: true  },
      { id: 'preordini',   label: 'Preordini',   icon: 'fa-clipboard-list', href: 'pages/gestione/preordini.html',     section: null,      active: true  },
    ]},
    { group: null, items: [
      { id: 'logout', label: 'Esci', icon: 'fa-right-from-bracket', href: '#', section: null, active: true, isLogout: true },
    ]},
  ];
  const ALL_ITEMS = NAV.flatMap(s => s.items);

  /* ═══════════════════════════════════════
     DIPENDENZE
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
    const st = document.createElement('style');
    st.id = 'm361-styles';
    st.textContent = `
*, *::before, *::after { box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; padding-top: 56px; padding-bottom: 68px; }
#m361-header { position:fixed;top:0;left:0;right:0;height:56px;background:#fff;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;padding:0 18px;z-index:9000;box-shadow:0 1px 4px rgba(0,0,0,.05);gap:12px; }
#m361-header .hd-left { display:flex;align-items:center;gap:0;text-decoration:none;flex:1;min-width:0; }
#m361-header .hd-logo { height:28px;object-fit:contain;flex-shrink:0; }
#m361-header .hd-logo-fb { font-weight:900;font-size:15px;color:#B5453A;letter-spacing:.08em;flex-shrink:0;display:none; }
#m361-header .hd-sep { width:1px;height:22px;background:#e5e7eb;margin:0 12px;flex-shrink:0; }
#m361-header #header-title { font-size:14px;font-weight:700;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:220px; }
#m361-header .hd-right { display:flex;align-items:center;gap:8px;flex-shrink:0; }
#back-btn { display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#64748b;background:none;border:none;cursor:pointer;font-family:'Inter',sans-serif;transition:color .15s; }
#back-btn:hover { color:#B5453A; }
#back-btn.hidden { display:none; }
@media(max-width:480px) { #m361-header #header-title { font-size:12px;max-width:120px; } }
#m361-nav { position:fixed;bottom:0;left:0;right:0;height:60px;background:#B5453A;border-top:2px solid #9e3f3f;z-index:9000;display:flex;align-items:stretch;justify-content:flex-start;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:none;box-shadow:0 -2px 10px rgba(0,0,0,.15);padding-bottom:env(safe-area-inset-bottom,0px); }
#m361-nav::-webkit-scrollbar { display:none; }
@supports(padding-bottom:env(safe-area-inset-bottom)) { #m361-nav { height:calc(60px + env(safe-area-inset-bottom)); } }
.mn-sep { width:1px;background:rgba(255,255,255,.18);margin:12px 0;flex-shrink:0; }
.mn-item { display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:0 10px;min-width:52px;text-decoration:none;cursor:pointer;transition:all .12s;border:none;background:transparent;flex-shrink:0;font-family:'Inter',sans-serif;-webkit-tap-highlight-color:transparent;min-height:44px; }
.mn-item i { font-size:15px;color:rgba(255,255,255,.6);transition:color .12s;line-height:1; }
.mn-item span { font-size:8px;font-weight:800;text-transform:uppercase;letter-spacing:.03em;color:rgba(255,255,255,.6);white-space:nowrap;transition:color .12s; }
.mn-item.mn-current { background:rgba(255,255,255,.22);border-radius:10px;margin:7px 2px;padding:0 9px; }
.mn-item.mn-current i,.mn-item.mn-current span { color:#fff; }
.mn-item.mn-active:not(.mn-current):hover { background:rgba(255,255,255,.12); }
.mn-item.mn-active:hover i,.mn-item.mn-active:hover span { color:#fff; }
.mn-item.mn-wip { opacity:.3;cursor:not-allowed;pointer-events:none; }
.mn-item.mn-logout { opacity:.7; }
.mn-item.mn-logout:hover { opacity:1;background:rgba(255,255,255,.12); }
.mn-item.mn-logout:hover i,.mn-item.mn-logout:hover span { color:#fff; }
@media(max-width:480px) {
  #m361-nav { height:54px; }
  .mn-item { padding:0 7px;min-width:44px;gap:1px; }
  .mn-item i { font-size:14px; }
  .mn-item span { font-size:7px;letter-spacing:0; }
  .mn-item.mn-current { margin:6px 1px;padding:0 7px;border-radius:8px; }
  .mn-sep { margin:14px 0; }
}
    `;
    document.head.insertBefore(st, document.head.firstChild);
  }

  /* ═══════════════════════════════════════
     PWA — meta tags, manifest, SW, install
  ═══════════════════════════════════════ */
  function injectPWA() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const l = document.createElement('link');
      l.rel = 'manifest'; l.href = BASE + 'manifest.json';
      document.head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const m = document.createElement('meta');
      m.name = 'theme-color'; m.content = '#B5453A';
      document.head.appendChild(m);
    }
    [
      ['apple-mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-status-bar-style', 'default'],
      ['apple-mobile-web-app-title', 'M361'],
    ].forEach(([n, v]) => {
      if (!document.querySelector(`meta[name="${n}"]`)) {
        const m = document.createElement('meta'); m.name = n; m.content = v;
        document.head.appendChild(m);
      }
    });
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(BASE + 'service-worker.js').catch(() => {});
    }
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window.__m361_installPrompt = e;
      const btn = document.getElementById('m361-install-btn');
      if (btn) btn.style.display = 'flex';
    });
    window.__m361InstallApp = async function () {
      const p = window.__m361_installPrompt;
      if (!p) return;
      p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === 'accepted') {
        window.__m361_installPrompt = null;
        const btn = document.getElementById('m361-install-btn');
        if (btn) btn.style.display = 'none';
      }
    };
    window.addEventListener('appinstalled', () => {
      window.__m361_installPrompt = null;
      const btn = document.getElementById('m361-install-btn');
      if (btn) btn.style.display = 'none';
    });
  }

  /* ═══════════════════════════════════════
     RESPONSIVE CSS
  ═══════════════════════════════════════ */
  function injectResponsiveCSS() {
    if (document.getElementById('m361-responsive-css')) return;
    const l = document.createElement('link');
    l.id = 'm361-responsive-css'; l.rel = 'stylesheet';
    l.href = BASE + 'assets/style/responsive.css';
    document.head.appendChild(l);
  }

  /* ═══════════════════════════════════════
     GUIDE SYSTEM
  ═══════════════════════════════════════ */
  function injectGuide() {
    if (!window.PAGE_SECTION) {
      const id = getCurrentId();
      const map = {
        ordini: 'ordini', cassa: 'cassa', turni: 'turni',
        preordini: 'preordini', info: 'info', prenotazioni: 'prenotazioni',
      };
      if (map[id]) window.PAGE_SECTION = map[id];
    }
    if (!window.PAGE_SECTION) return;
    if (!document.getElementById('m361-guide-script')) {
      const s = document.createElement('script');
      s.id = 'm361-guide-script';
      s.src = BASE + 'scripts/guide.js';
      document.body.appendChild(s);
    }
    const hdRight = document.querySelector('#m361-header .hd-right');
    if (hdRight && !document.getElementById('m361-guide-btn')) {
      const btn = document.createElement('button');
      btn.id = 'm361-guide-btn';
      btn.title = 'Guida pagina';
      btn.innerHTML = '<i class="fas fa-circle-question"></i>';
      btn.style.cssText = 'background:none;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;color:#94a3b8;font-size:13px;padding:5px 8px;transition:all .15s;font-family:Inter,sans-serif;line-height:1;display:flex;align-items:center;min-height:32px;flex-shrink:0';
      btn.onmouseenter = () => { btn.style.color = '#B5453A'; btn.style.borderColor = '#B5453A'; };
      btn.onmouseleave = () => { btn.style.color = '#94a3b8'; btn.style.borderColor = '#e2e8f0'; };
      btn.onclick = () => { if (typeof window.__m361ToggleGuida === 'function') window.__m361ToggleGuida(); };
      hdRight.insertBefore(btn, hdRight.firstChild);
    }
  }

  /* ═══════════════════════════════════════
     PAGINA CORRENTE
  ═══════════════════════════════════════ */
  function getCurrentId() {
    const path = window.location.pathname.replace(/\\/g, '/').toLowerCase();
    const pathParts = path.split('/').filter(Boolean);
    if (path === '/' || pathParts.length === 0) return 'home';
    if (pathParts.length <= 1 && pathParts[0] === 'index.html') return 'home';

    const SKIP = new Set(['pages','assets','scripts','style','images','js','css','index']);
    const currentSegs = pathParts
      .map(p => p.replace('.html','').replace('.js','').replace('.css',''))
      .filter(s => s.length > 2 && !SKIP.has(s));

    for (const item of ALL_ITEMS) {
      if (item.id === 'home' || item.id === 'logout') continue;
      const itemSegs = item.href.split('/').filter(Boolean)
        .map(p => p.replace('.html',''))
        .filter(s => s.length > 2 && !SKIP.has(s));
      const matched = itemSegs.some(iSeg =>
        currentSegs.some(cSeg => cSeg === iSeg || cSeg.startsWith(iSeg + '_') || cSeg.startsWith(iSeg + '-'))
      );
      if (matched) return item.id;
    }
    return null;
  }

  /* ═══════════════════════════════════════
     BUILD HEADER
  ═══════════════════════════════════════ */
  function buildHeader() {
    document.querySelectorAll('header:not(#m361-header)').forEach(h => h.remove());
    if (document.getElementById('m361-header')) return;

    const pageTitle = document.title.replace(/^M361\s*[-–]\s*/i, '').trim() || 'App';
    const logoSrc = BASE + 'assets/images/logom361_rosso.jpg';
    const isHome = getCurrentId() === 'home';
    const profile = getUserProfile();
    const nomeBreve = profile ? (profile.nome || '').split(' ')[0] : '';

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
        <button id="m361-install-btn" onclick="window.__m361InstallApp&&window.__m361InstallApp()" style="display:none;align-items:center;gap:4px;font-size:10px;font-weight:700;background:#B5453A;color:#fff;border:none;border-radius:8px;padding:5px 10px;cursor:pointer;font-family:'Inter',sans-serif;flex-shrink:0;line-height:1"><i class="fas fa-download"></i> Installa</button>
        ${nomeBreve ? '<span style="font-size:11px;font-weight:700;color:#94a3b8;white-space:nowrap">'+nomeBreve+'</span>' : ''}
        <button id="back-btn" ${isHome ? 'class="hidden"' : ''} onclick="history.back()">
          <i class="fas fa-arrow-left"></i> Indietro
        </button>
      </div>
    `;
    document.body.insertBefore(hdr, document.body.firstChild);
  }

  /* ═══════════════════════════════════════
     BUILD BOTTOM NAV
  ═══════════════════════════════════════ */
function buildNav() {
  // Rimuove eventuali nav esistenti
  document.querySelectorAll('#m361-nav, nav.bottom-nav, .bottom-nav').forEach(n => n.remove());
  
  const currentId = typeof getCurrentId === 'function' ? getCurrentId() : '';
  const userSections = typeof getUserSections === 'function' ? getUserSections() : [];
  const user = JSON.parse(localStorage.getItem('m361_user'));

  const nav = document.createElement('nav');
  nav.id = 'm361-nav';
  nav.setAttribute('role', 'navigation');

  // Funzione per creare i singoli link (mn-item)
  const renderItem = (item) => {
    const isCurrent = item.id === currentId || window.location.pathname.includes(item.href);
    const a = document.createElement('a');
    a.className = 'mn-item' 
      + (item.active   ? ' mn-active'  : ' mn-wip')
      + (isCurrent     ? ' mn-current' : '')
      + (item.isLogout ? ' mn-logout'  : '');
    
    a.href = item.isLogout ? '#' : (item.active ? BASE + item.href : '#');
    
    if (item.isLogout) {
      a.addEventListener('click', e => {
        e.preventDefault();
        if (confirm('Vuoi uscire?')) doLogout();
      });
    }
    
    a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
    return a;
  };

  // Carica le voci dal tuo array NAV esistente
  if (typeof NAV !== 'undefined') {
    NAV.forEach((section, si) => {
      if (si > 0) {
        const sep = document.createElement('div');
        sep.className = 'mn-sep';
        nav.appendChild(sep);
      }
      section.items.forEach(item => {
        // Filtro permessi sezioni
        if (item.section && userSections.length > 0 && !userSections.includes(item.section)) return;
        nav.appendChild(renderItem(item));
      });
    });
  }

  // AGGIUNTA MANUALE TASTO ADMIN (Solo per te)
  if (user && user.email === 'e.mazzolari@meridiano361.it') {
    const sep = document.createElement('div');
    sep.className = 'mn-sep';
    nav.appendChild(sep);

    const adminBtn = {
      id: 'impostazioni',
      label: 'Admin',
      icon: 'fa-gear',
      href: 'impostazioni.html',
      active: true
    };
    nav.appendChild(renderItem(adminBtn));
  }

  document.body.appendChild(nav);
}

  /* ═══════════════════════════════════════
     INIT — SINCRONO, MAI BLOCCA
  ═══════════════════════════════════════ */
  async function init() {
    // 1. Se siamo sulla pagina di login, non facciamo nulla e permettiamo l'accesso
    if (typeof isPublicPage === 'function' && isPublicPage()) return;
    if (window.location.pathname.includes('login.html')) return;

    // 2. Recupero utente dal localStorage
    const user = JSON.parse(localStorage.getItem('m361_user'));

    // 3. PROTEZIONE: Se l'utente non esiste, spediscilo al login immediatamente
    if (!user || !user.email) {
      console.warn("Accesso non autorizzato. Reindirizzamento...");
      window.location.href = getBase() + 'login.html';
      return; // Blocca l'esecuzione del resto dello script
    }

    // 4. Caricamento Interfaccia (Eseguito solo se loggati)
    injectDeps();
    injectStyles();
    injectPWA();
    injectResponsiveCSS();
    buildHeader();
    buildNav();
    injectGuide();

    // 5. Controllo Sola Lettura (Async)
    await checkPermissionsAndApply(user);
  }

  /**
   * Applica le restrizioni SOLA LETTURA — versione completa
   * Copre tutti i bottoni e form dell'intera app M361
   */
  async function checkPermissionsAndApply(user) {
    const _supabase = getSupabase();
    if (!_supabase) return;

    const { data: dbUser } = await _supabase
      .from('user_permissions')
      .select('is_readonly')
      .eq('email', user.email)
      .maybeSingle();

    if (!dbUser || !dbUser.is_readonly) return; // Niente da fare

    // Salva stato nel localStorage per uso rapido
    try {
      const profile = JSON.parse(localStorage.getItem('m361_user') || '{}');
      profile.is_readonly = true;
      localStorage.setItem('m361_user', JSON.stringify(profile));
    } catch {}

    applyReadonlyMode();
  }

  function applyReadonlyMode() {
    // Inietta CSS che nasconde/blocca tutti gli elementi di modifica
    if (document.getElementById('m361-readonly-styles')) return;
    const style = document.createElement('style');
    style.id = 'm361-readonly-styles';
    style.textContent = `
      /* ══ SOLA LETTURA — nasconde tutti i bottoni di azione ══ */

      /* Bottoni submit / salva / aggiungi */
      button[type="submit"],
      input[type="submit"],
      button[onclick*="salva"],
      button[onclick*="save"],
      button[onclick*="submit"],
      button[onclick*="add"],
      button[onclick*="aggiungi"],
      button[onclick*="Add"],
      button[onclick*="nuov"],
      button[onclick*="Nuov"],
      button[onclick*="create"],
      button[onclick*="insert"],
      #submit-btn,
      #btn-new,
      .btn-save, .btn-add, .btn-create, .btn-submit,
      .admin-only,

      /* Bottoni SALVA ORDINE in basso */
      button.btn-dark,
      [style*="SALVA"],

      /* Bottoni modifica / elimina / archivia */
      .btn-action,
      button[onclick*="edit"],
      button[onclick*="delete"],
      button[onclick*="remove"],
      button[onclick*="archive"],
      button[onclick*="complete"],
      button[onclick*="modifica"],
      button[onclick*="elimina"],
      button[onclick*="archivia"],

      /* Bottoni specifici per pagina */
      button[onclick*="addRow"],
      button[onclick*="addGroup"],
      button[onclick*="addProduct"],
      button[onclick*="addItem"],
      button[onclick*="submitRequest"],
      button[onclick*="sendResponse"],
      button[onclick*="archiveRequest"],
      button[onclick*="deleteRequest"],
      button[onclick*="deleteOrder"],
      button[onclick*="bulkDelete"],
      button[onclick*="completeOrder"],
      button[onclick*="toggleDone"],
      button[onclick*="removeItem"],
      button[onclick*="removeProduct"],
      button[onclick*="removeRow"],
      button[onclick*="saveAll"],
      button[onclick*="salvaGiornata"],
      button[onclick*="salvaDati"],

      /* Pulsanti con icone specifiche (trash, edit, etc.) */
      button:has(i.fa-trash),
      button:has(i.fa-pen),
      button:has(i.fa-plus),
      button:has(i.fa-save),
      button:has(i.fa-paper-plane),
      button:has(i.fa-archive),
      button:has(i.fa-check),
      a[onclick*="addRow"],
      a[onclick*="edit"],

      /* "RITIRATO/SPEDITO" e simili */
      [class*="btn-complete"],
      button[style*="background:#1e293b"],
      button[style*="background: #1e293b"],

      /* Bottone flottante salva */
      #save-btn-float,
      button:has(i.fa-floppy-disk) {
        display: none !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }

      /* Disabilita tutti gli input / form */
      input:not([type="checkbox"]):not([type="radio"]):not([type="search"]):not(#search-input),
      select,
      textarea {
        pointer-events: none !important;
        background: #f8fafc !important;
        color: #94a3b8 !important;
        cursor: not-allowed !important;
        border-color: #e2e8f0 !important;
      }

      /* Disabilita checkbox interattivi (non quelli di sola visualizzazione) */
      input[type="checkbox"].pz-check,
      input[type="checkbox"].cb,
      input[type="checkbox"].order-checkbox,
      input[type="checkbox"].readonly-toggle {
        pointer-events: none !important;
        opacity: 0.5 !important;
      }

      /* Badge SOLA LETTURA nell'header */
      #m361-header .hd-right::before {
        content: "👁 SOLA LETTURA";
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .06em;
        background: #fef9c3;
        color: #92400e;
        border: 1px solid #fde68a;
        padding: 3px 8px;
        border-radius: 6px;
        margin-right: 4px;
        white-space: nowrap;
      }

      /* Nascondi quick-nav bar "Vai a: Nuovo/In Corso/Archiviati"
         solo i link di "Nuovo Ordine" */
      a[href*="ordini_nuovi"] { display: none !important; }
    `;
    document.head.appendChild(style);

    // Blocca anche i submit via JavaScript
    document.addEventListener('submit', e => e.preventDefault(), true);

    // Rendi i form non-interattivi a livello JS
    window.__m361_readonly = true;
  }

  // Espone la funzione per uso in altre pagine
  window.__m361ApplyReadonly = applyReadonlyMode;

  // Lancio dello script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
