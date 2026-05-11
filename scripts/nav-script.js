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
 *   #back-btn      — bottone indietro nell'header (sempre visibile)
 */
(function () {
  'use strict';

  /* ── Esegui una sola volta ── */
  if (window.__m361NavLoaded) return;
  window.__m361NavLoaded = true;

  /* ═══════════════════════════════════════
     SUPABASE CLIENT
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

  /* ── Percorso base ── */
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
     SESSIONE & PROFILO UTENTE
  ═══════════════════════════════════════ */
  function getUserProfile() {
    try { return JSON.parse(localStorage.getItem('m361_user') || 'null'); }
    catch { return null; }
  }

  function getUserSections() {
    const p = getUserProfile();
    if (!p) return [];
    const s = p.sezioni;
    if (Array.isArray(s)) return s;
    if (typeof s === 'string') { try { return JSON.parse(s); } catch { return []; } }
    return [];
  }

  /* Pagine che non richiedono login */
  const PUBLIC_PATHS = ['login.html'];
  function isPublicPage() {
    const path = window.location.pathname.toLowerCase();
    return PUBLIC_PATHS.some(p => path.endsWith(p));
  }

  /* Controlla sessione — se non loggato reindirizza al login */
  async function guardSession() {
    if (isPublicPage()) return true;

    /* Aspetta che Supabase SDK sia disponibile (max 3s) */
    let db = null;
    for (let i = 0; i < 30; i++) {
      db = getSupabase();
      if (db) break;
      await new Promise(r => setTimeout(r, 100));
    }

    if (!db) {
      // SDK non caricato — controlla solo localStorage come fallback
      if (!getUserProfile()) {
        window.location.href = BASE + 'login.html';
        return false;
      }
      return true;
    }

    const { data: { session } } = await db.auth.getSession();
    if (!session) {
      localStorage.removeItem('m361_user');
      window.location.href = BASE + 'login.html';
      return false;
    }

    // Sessione valida: se manca il profilo locale lo ricarica
    if (!getUserProfile()) {
      const email = session.user.email;
      const { data: perms } = await db.from('user_permissions').select('*').eq('email', email).maybeSingle();
      if (perms) {
        localStorage.setItem('m361_user', JSON.stringify({
          email:   perms.email,
          nome:    perms.nome_cognome,
          ruolo:   perms.ruolo,
          emporio: perms.emporio_riferimento,
          livello: perms.livello_accesso,
          sezioni: perms.allowed_sections || [],
          loginAt: new Date().toISOString()
        }));
      } else {
        await db.auth.signOut();
        window.location.href = BASE + 'login.html';
        return false;
      }
    }
    return true;
  }

  /* Logout */
  async function doLogout() {
    const db = getSupabase();
    if (db) await db.auth.signOut();
    localStorage.removeItem('m361_user');
    window.location.href = BASE + 'login.html';
  }

  /* ═══════════════════════════════════════
     VOCI DI NAVIGAZIONE
     (active = sempre visibili; visibilità
      finale filtrata da allowed_sections)
  ═══════════════════════════════════════ */
  const NAV = [
    { group: null, items: [
      { id: 'home', label: 'Home', icon: 'fa-house', href: 'index.html', section: null, active: true },
    ]},
    { group: 'Clienti', items: [
      { id: 'ordini',       label: 'Ordini',       icon: 'fa-bag-shopping',   href: 'pages/ordini/ordini.html',         section: 'ordini',  active: true  },
      { id: 'prenotazioni', label: 'Prenotazioni', icon: 'fa-calendar-check', href: 'pages/prenotazioni/index.html',    section: null,      active: false },
      { id: 'tessere',      label: 'Tessere',      icon: 'fa-id-card',        href: 'pages/tessere/index.html',         section: null,      active: false },
      { id: 'info',         label: 'Info',         icon: 'fa-message',        href: 'pages/info/index.html',            section: null,      active: false },
    ]},
    { group: 'Negozio', items: [
      { id: 'turni',        label: 'Turni',        icon: 'fa-users',          href: 'pages/turni/turni.html',           section: 'turni',   active: true  },
      { id: 'cassa',        label: 'Cassa',        icon: 'fa-cash-register',  href: 'pages/cassa/cassa.html',           section: 'cassa',   active: true  },
      { id: 'calendario',   label: 'Calendario',   icon: 'fa-calendar-days',  href: 'pages/calendario/index.html',      section: null,      active: false },
      { id: 'rifornimento', label: 'Rifornimento', icon: 'fa-boxes-stacked',  href: 'pages/rifornimento/index.html',    section: null,      active: false },
      { id: 'prezzi',       label: 'Prezzi',       icon: 'fa-tag',            href: 'pages/prezzi/index.html',          section: null,      active: false },
    ]},
    { group: null, items: [
      { id: 'logout', label: 'Esci', icon: 'fa-right-from-bracket', href: '#', section: null, active: true, isLogout: true },
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
/* back-btn — SEMPRE VISIBILE */
#back-btn {
  display: flex;
  align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #64748b;
  background: none; border: none; cursor: pointer;
  font-family: 'Inter', sans-serif; transition: color .15s;
}
#back-btn:hover { color: #b75252; }
#back-btn.hidden { display: none; }

@media(max-width:480px) {
  #m361-header #header-title { font-size: 12px; max-width: 120px; }
}

/* ── BOTTOM NAV ── */
#m361-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0; height: 60px;
  background: #b75252;
  border-top: 2px solid #9e3f3f;
  z-index: 9000;
  display: flex; 
  align-items: stretch;
  justify-content: center; /* CENTRATO */
  overflow-x: auto; 
  overflow-y: hidden;
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
  transition: all .12s; border: none;
  background: transparent; flex-shrink: 0;
  font-family: 'Inter', sans-serif;
  -webkit-tap-highlight-color: transparent;
}
.mn-item i { 
  font-size: 16px; 
  color: rgba(255,255,255,.65); 
  transition: color .12s; 
  line-height: 1; 
}
.mn-item span { 
  font-size: 9px; 
  font-weight: 800; 
  text-transform: uppercase; 
  letter-spacing: .05em; 
  color: rgba(255,255,255,.65); 
  white-space: nowrap; 
  transition: color .12s; 
}

/* CURRENT ITEM - BIANCO ACCESO CON TRASPARENZA */
.mn-item.mn-current { 
  background: rgba(255,255,255,.22); 
  border-radius: 12px; 
  margin: 7px 3px; 
  padding: 0 11px; 
}
.mn-item.mn-current i, 
.mn-item.mn-current span { 
  color: #fff; /* BIANCO ACCESO */
}

.mn-item.mn-active:not(.mn-current):hover { 
  background: rgba(255,255,255,.12); 
}
.mn-item.mn-active:hover i, 
.mn-item.mn-active:hover span { 
  color: #fff; 
}
.mn-item.mn-wip { 
  opacity: .35; 
  cursor: not-allowed; 
  pointer-events: none; 
}
.mn-item.mn-logout { 
  opacity: .75; 
}
.mn-item.mn-logout:hover { 
  opacity: 1; 
  background: rgba(255,255,255,.12); 
}
.mn-item.mn-logout:hover i, 
.mn-item.mn-logout:hover span { 
  color: #fff; 
}
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

    // Home check
    const pathParts = path.split('/').filter(Boolean);
    if (path === '/' || pathParts.length === 0) return 'home';
    if (pathParts.length <= 1 && pathParts[0] === 'index.html') return 'home';

    // Segmenti generici da ignorare nel confronto
    const SKIP = new Set(['pages', 'assets', 'scripts', 'style', 'images', 'js', 'css', 'index']);

    // Segmenti significativi dell'URL corrente (es. 'turni', 'cassa', 'ordini')
    const currentSegs = pathParts
      .map(p => p.replace('.html', '').replace('.js', '').replace('.css', ''))
      .filter(s => s.length > 2 && !SKIP.has(s));

    for (const item of ALL_ITEMS) {
      if (item.id === 'home' || item.id === 'logout') continue;

      // Segmenti significativi dell'href del nav item
      const itemSegs = item.href.split('/').filter(Boolean)
        .map(p => p.replace('.html', ''))
        .filter(s => s.length > 2 && !SKIP.has(s));

      // Match: un segmento significativo dell'item è contenuto
      // in uno dei segmenti significativi della pagina corrente
      // Esempio: item seg 'ordini' matches path seg 'ordini_incorso'
      const matched = itemSegs.some(iSeg =>
        currentSegs.some(cSeg => cSeg === iSeg || cSeg.startsWith(iSeg + '_') || cSeg.startsWith(iSeg + '-'))
      );
      if (matched) return item.id;
    }
    return null;
  }

  /* ═══════════════════════════════════════
     BUILD HEADER
     Espone per compatibilità:
       #header-title  (aggiornabile via JS dalle pagine)
       #back-btn      (sempre visibile, nascondibile via .hidden)
  ═══════════════════════════════════════ */
  function buildHeader() {
    /* rimuovi header statici preesistenti */
    document.querySelectorAll('header:not(#m361-header)').forEach(h => h.remove());
    if (document.getElementById('m361-header')) return;

    const pageTitle = document.title.replace(/^M361\s*[-–]\s*/i, '').trim() || 'App';
    const logoSrc   = BASE + 'assets/images/logom361_rosso.jpg';
    
    // Determina se siamo nella home
    const isHome = getCurrentId() === 'home';

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
    document.querySelectorAll('#m361-nav, nav.bottom-nav, .bottom-nav').forEach(n => n.remove());
    const currentId   = getCurrentId();
    const userSections = getUserSections(); // es. ["cassa","turni","ordini"]

    const nav = document.createElement('nav');
    nav.id = 'm361-nav';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navigazione principale');

    NAV.forEach((section, si) => {
      let sectionHasItems = false;

      section.items.forEach(item => {
        // Filtra per permessi: se l'item ha una section richiesta,
        // l'utente deve averla tra le sue sezioni consentite
        const permitted = !item.section || isPublicPage() || userSections.includes(item.section) || userSections.length === 0;
        if (!permitted) return; // nasconde voce senza permesso

        const isCurrent = item.id === currentId;
        const a = document.createElement('a');
        a.className = 'mn-item'
          + (item.active   ? ' mn-active'  : ' mn-wip')
          + (isCurrent     ? ' mn-current' : '')
          + (item.isLogout ? ' mn-logout'  : '');
        a.href = item.isLogout ? '#' : (item.active ? BASE + item.href : '#');
        if (!item.active) { a.setAttribute('aria-disabled','true'); a.setAttribute('tabindex','-1'); }
        if (isCurrent) a.setAttribute('aria-current','page');

        if (item.isLogout) {
          a.addEventListener('click', e => {
            e.preventDefault();
            if (confirm('Vuoi uscire dall\'applicazione?')) doLogout();
          });
        }

        a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
        nav.appendChild(a);
        sectionHasItems = true;
      });

      // Separatore solo se la sezione aveva voci visibili e non è l'ultima
      if (sectionHasItems && si < NAV.length - 1) {
        const sep = document.createElement('div');
        sep.className = 'mn-sep';
        nav.appendChild(sep);
      }
    });

    document.body.appendChild(nav);
    requestAnimationFrame(() => {
      const cur = nav.querySelector('.mn-current');
      if (cur) cur.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' });
    });
  }

  /* ═══════════════════════════════════════
     BUILD HEADER — aggiunge nome utente
  ═══════════════════════════════════════ */
  function buildHeader() {
    document.querySelectorAll('header:not(#m361-header)').forEach(h => h.remove());
    if (document.getElementById('m361-header')) return;

    const pageTitle = document.title.replace(/^M361\s*[-–]\s*/i, '').trim() || 'App';
    const logoSrc   = BASE + 'assets/images/logom361_rosso.jpg';
    const isHome    = getCurrentId() === 'home';
    const profile   = getUserProfile();
    const nomeBreve = profile ? profile.nome.split(' ')[0] : '';

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
        ${nomeBreve ? `<span style="font-size:11px;font-weight:700;color:#94a3b8;white-space:nowrap">${nomeBreve}</span>` : ''}
        <button id="back-btn" ${isHome ? 'class="hidden"' : ''} onclick="history.back()">
          <i class="fas fa-arrow-left"></i> Indietro
        </button>
      </div>
    `;
    document.body.insertBefore(hdr, document.body.firstChild);
  }

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  async function init() {
    injectDeps();
    injectStyles();

    // Guard sessione (reindirizza a login se non autenticato)
    const ok = await guardSession();
    if (!ok) return;

    buildHeader();
    buildNav();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
