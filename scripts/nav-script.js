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
      { id: 'rifornimento', label: 'Rifornimento', icon: 'fa-boxes-stacked',  href: 'pages/rifornimento/index.html', section: null,      active: true  },
      { id: 'prezzi',       label: 'Prezzi',       icon: 'fa-tag',            href: 'pages/prezzi/prezzi.html',          section: null,      active: true  },
      { id: 'preordini',   label: 'Preordini',   icon: 'fa-clipboard-list', href: 'pages/gestione/preordini.html',     section: null,      active: true  },
      { id: 'materiali',   label: 'Materiali',   icon: 'fa-folder-open',    href: 'pages/materiali/materiali.html',    section: null,      active: true  },
      { id: 'scadenze',   label: 'Scadenze',    icon: 'fa-clock-rotate-left', href: 'pages/prodotti-scadenza/prodotti-scadenza.html', section: null, active: true },
      { id: 'listino',    label: 'Vetrina',     icon: 'fa-list-ul',           href: 'pages/listino-prezzi/listino-prezzi.html',       section: null, active: true },
    ]},
    { group: null, items: [
      { id: 'guida', label: 'Guida', icon: 'fa-book-open', href: 'pages/guida/guida.html', section: null, active: true },
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
#m361-nav { position:fixed;bottom:0;left:0;right:0;height:60px;background:#B5453A;border-top:2px solid #9e3f3f;z-index:9000;display:flex;align-items:stretch;justify-content:flex-start;overflow:hidden;box-shadow:0 -2px 10px rgba(0,0,0,.15);padding-bottom:env(safe-area-inset-bottom,0px); }
#m361-nav-scroll { flex:1;overflow-x:auto;overflow-y:hidden;display:flex;align-items:stretch;scrollbar-width:none;-webkit-overflow-scrolling:touch; }
#m361-nav-scroll::-webkit-scrollbar { display:none; }
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
@keyframes m361-slide-down {
  from { opacity:0; transform:translateX(-50%) translateY(-12px); }
  to   { opacity:1; transform:translateX(-50%) translateY(0); }
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
      ['mobile-web-app-capable', 'yes'],
      ['apple-mobile-web-app-status-bar-style', 'default'],
      ['apple-mobile-web-app-title', 'M361'],
    ].forEach(([n, v]) => {
      if (!document.querySelector(`meta[name="${n}"]`)) {
        const m = document.createElement('meta'); m.name = n; m.content = v;
        document.head.appendChild(m);
      }
    });
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(BASE + 'service-worker.js', { updateViaCache: 'none' }).catch(() => {});
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
     MODALE CAMBIO PASSWORD
  ═══════════════════════════════════════ */
  function injectChangePasswordModal() {
    if (document.getElementById('m361-chpwd-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'm361-chpwd-overlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px;padding:32px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.2);font-family:'Inter',sans-serif">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:36px;height:36px;background:#fef2f2;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <i class="fas fa-lock" style="color:#B5453A;font-size:14px"></i>
            </div>
            <span style="font-size:15px;font-weight:800;color:#1e293b">Cambia password</span>
          </div>
          <button id="m361-chpwd-close" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:18px;padding:4px;line-height:1" title="Chiudi">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div id="m361-chpwd-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:10px 14px;font-size:12px;font-weight:700;color:#dc2626;margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <i class="fas fa-exclamation-circle"></i>
          <span id="m361-chpwd-error-text"></span>
        </div>
        <div id="m361-chpwd-ok" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:10px 14px;font-size:12px;font-weight:700;color:#16a34a;margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <i class="fas fa-check-circle"></i>
          <span>Password aggiornata con successo!</span>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px">Nuova password</label>
          <input type="password" id="m361-chpwd-new" placeholder="Minimo 6 caratteri" minlength="6"
            style="width:100%;padding:12px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;transition:border-color .15s"
            onfocus="this.style.borderColor='#B5453A'" onblur="this.style.borderColor='#e2e8f0'">
        </div>
        <div style="margin-bottom:24px">
          <label style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:6px">Conferma password</label>
          <input type="password" id="m361-chpwd-conf" placeholder="Ripeti la password" minlength="6"
            style="width:100%;padding:12px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;transition:border-color .15s"
            onfocus="this.style.borderColor='#B5453A'" onblur="this.style.borderColor='#e2e8f0'">
        </div>

        <button id="m361-chpwd-submit"
          style="width:100%;background:#B5453A;color:#fff;font-weight:800;font-size:14px;border:none;border-radius:14px;padding:14px;cursor:pointer;font-family:'Inter',sans-serif;display:flex;align-items:center;justify-content:center;gap:10px;transition:background .15s"
          onmouseenter="this.style.background='#a14545'" onmouseleave="this.style.background='#B5453A'">
          <div id="m361-chpwd-spinner" style="display:none;width:16px;height:16px;border:2.5px solid rgba(255,255,255,.3);border-radius:50%;border-top-color:#fff;animation:spin .8s linear infinite"></div>
          <span id="m361-chpwd-label">Salva nuova password</span>
        </button>

        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #f1f5f9">
          <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:10px">Notifiche Push</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
            <span id="m361-push-modal-status" style="font-size:13px;font-weight:600;color:#475569">—</span>
            <button id="m361-push-modal-btn"
              style="background:#B5453A;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;white-space:nowrap;display:none">
              Abilita
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeModal = () => {
      overlay.style.display = 'none';
      document.getElementById('m361-chpwd-new').value = '';
      document.getElementById('m361-chpwd-conf').value = '';
      document.getElementById('m361-chpwd-error').style.display = 'none';
      document.getElementById('m361-chpwd-ok').style.display = 'none';
    };

    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.getElementById('m361-chpwd-close').addEventListener('click', closeModal);

    document.getElementById('m361-chpwd-conf').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') document.getElementById('m361-chpwd-submit').click();
    });

    document.getElementById('m361-chpwd-submit').addEventListener('click', async () => {
      const pwd = document.getElementById('m361-chpwd-new').value;
      const conf = document.getElementById('m361-chpwd-conf').value;
      const errDiv = document.getElementById('m361-chpwd-error');
      const errText = document.getElementById('m361-chpwd-error-text');
      const okDiv = document.getElementById('m361-chpwd-ok');
      const btn = document.getElementById('m361-chpwd-submit');

      errDiv.style.display = 'none';
      okDiv.style.display = 'none';

      if (pwd.length < 6) {
        errText.textContent = 'La password deve essere di almeno 6 caratteri.';
        errDiv.style.display = 'flex';
        return;
      }
      if (pwd !== conf) {
        errText.textContent = 'Le password non coincidono.';
        errDiv.style.display = 'flex';
        return;
      }

      btn.disabled = true;
      document.getElementById('m361-chpwd-spinner').style.display = 'block';
      document.getElementById('m361-chpwd-label').textContent = 'Salvataggio...';

      const db = getSupabase();
      if (!db) {
        errText.textContent = 'Servizio non disponibile. Riprova.';
        errDiv.style.display = 'flex';
        btn.disabled = false;
        document.getElementById('m361-chpwd-spinner').style.display = 'none';
        document.getElementById('m361-chpwd-label').textContent = 'Salva nuova password';
        return;
      }

      const { error } = await db.auth.updateUser({ password: pwd });

      btn.disabled = false;
      document.getElementById('m361-chpwd-spinner').style.display = 'none';
      document.getElementById('m361-chpwd-label').textContent = 'Salva nuova password';

      if (error) {
        errText.textContent = 'Errore nel salvataggio. Riprova.';
        errDiv.style.display = 'flex';
      } else {
        okDiv.style.display = 'flex';
        document.getElementById('m361-chpwd-new').value = '';
        document.getElementById('m361-chpwd-conf').value = '';
        setTimeout(closeModal, 2000);
      }
    });

    window.__m361OpenChangePwd = () => {
      overlay.style.display = 'flex';
      setTimeout(() => document.getElementById('m361-chpwd-new').focus(), 50);
      _updatePushStatusUI();
    };
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
        <button id="m361-bell-btn" onclick="window.__m361BellClick&&window.__m361BellClick()" title="Notifiche" style="position:relative;background:none;border:none;cursor:pointer;padding:4px 8px;color:#64748b;font-size:18px;display:flex;align-items:center;flex-shrink:0;line-height:1">
          <i class="fas fa-bell"></i>
          <span id="m361-bell-badge" style="display:none;position:absolute;top:-2px;right:-2px;background:#B5453A;color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:8px;align-items:center;justify-content:center;padding:0 4px;line-height:1">0</span>
        </button>
        ${nomeBreve ? '<button id="m361-profile-btn" onclick="window.__m361OpenChangePwd&&window.__m361OpenChangePwd()" title="Cambia password" style="background:none;border:1px solid #e2e8f0;border-radius:8px;cursor:pointer;font-size:11px;font-weight:700;color:#64748b;padding:4px 9px;font-family:Inter,sans-serif;display:flex;align-items:center;gap:5px;flex-shrink:0;line-height:1;transition:all .15s" onmouseenter="this.style.borderColor=\'#B5453A\';this.style.color=\'#B5453A\'" onmouseleave="this.style.borderColor=\'#e2e8f0\';this.style.color=\'#64748b\'"><i class=\'fas fa-user\' style=\'font-size:9px\'></i>'+nomeBreve+'</button>' : ''}
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

  const currentId = typeof getCurrentId === 'function' ? getCurrentId() : '';
  const userSections = typeof getUserSections === 'function' ? getUserSections() : [];
  const user = JSON.parse(localStorage.getItem('m361_user'));

  const nav = document.createElement('nav');
  nav.id = 'm361-nav';
  nav.setAttribute('role', 'navigation');

  // Scroll wrapper for all main items
  const scrollWrap = document.createElement('div');
  scrollWrap.id = 'm361-nav-scroll';

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

  let logoutItem = null;

  if (typeof NAV !== 'undefined') {
    NAV.forEach((section, si) => {
      const visibleNonLogout = section.items.filter(item => {
        if (item.isLogout) return false;
        if (item.section && userSections.length > 0 && !userSections.includes(item.section)) return false;
        return true;
      });
      if (si > 0 && visibleNonLogout.length > 0) {
        const sep = document.createElement('div');
        sep.className = 'mn-sep';
        scrollWrap.appendChild(sep);
      }
      section.items.forEach(item => {
        if (item.section && userSections.length > 0 && !userSections.includes(item.section)) return;
        if (item.isLogout) { logoutItem = item; return; }
        scrollWrap.appendChild(renderItem(item));
      });
    });
  }

  // Tasto Impostazioni nel scroll wrap
  if (user && (user.email === 'e.mazzolari@meridiano361.it' || user.is_resp_personale)) {
    const sep = document.createElement('div');
    sep.className = 'mn-sep';
    scrollWrap.appendChild(sep);
    const isFullAdmin = user.email === 'e.mazzolari@meridiano361.it';
    scrollWrap.appendChild(renderItem({
      id: 'impostazioni',
      label: isFullAdmin ? 'Admin' : 'Personale',
      icon: isFullAdmin ? 'fa-gear' : 'fa-users-gear',
      href: 'impostazioni.html',
      active: true
    }));
  }

  // Profilo personale — per ora solo Emilio (tester iniziale)
  if (user && user.email === 'e.mazzolari@meridiano361.it') {
    const sep = document.createElement('div');
    sep.className = 'mn-sep';
    scrollWrap.appendChild(sep);
    scrollWrap.appendChild(renderItem({
      id: 'profilo',
      label: 'Profilo',
      icon: 'fa-circle-user',
      href: 'pages/profilo/profilo.html',
      active: true
    }));
  }

  nav.appendChild(scrollWrap);

  // ESCI fisso a destra, fuori dallo scroll
  if (logoutItem) {
    const sep = document.createElement('div');
    sep.className = 'mn-sep';
    nav.appendChild(sep);
    nav.appendChild(renderItem(logoutItem));
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
    let user = JSON.parse(localStorage.getItem('m361_user'));

    // 3. PROTEZIONE: Se l'utente non esiste, spediscilo al login immediatamente
    if (!user || !user.email) {
      console.warn("Accesso non autorizzato. Reindirizzamento...");
      window.location.href = getBase() + 'login.html';
      return;
    }

    // 3b. Se l'oggetto utente è incompleto (nome mancante — sessione stale),
    //     tenta di ricaricarlo da DB prima di procedere.
    if (!user.nome) {
      try {
        const _sb = getSupabase();
        if (_sb) {
          const { data: op } = await _sb.from('operatori').select('*').ilike('email', user.email).single();
          if (op?.nome) {
            localStorage.setItem('m361_user', JSON.stringify(op));
            user = op;
          } else {
            localStorage.removeItem('m361_user');
            window.location.href = getBase() + 'login.html';
            return;
          }
        }
      } catch (_) {
        localStorage.removeItem('m361_user');
        window.location.href = getBase() + 'login.html';
        return;
      }
    }

    // 4. Caricamento Interfaccia (Eseguito solo se loggati)
    injectDeps();
    injectStyles();
    injectPWA();
    injectResponsiveCSS();
    buildHeader();
    buildNav();
    injectChangePasswordModal();
    injectGuide();

    // 5a. Check sincrono da sessionStorage (fast path — da pagina precedente)
    const cachedPermessi = sessionStorage.getItem('permessi');
    const cachedRuolo = sessionStorage.getItem('ruolo') || '';
    // Solo per ruoli non-privilegiati (non admin/dipendente) si applicano i permessi cached
    if (cachedPermessi && !['admin', 'dipendente'].includes(cachedRuolo)) {
      try {
        const mappaCached = JSON.parse(cachedPermessi);
        const currentId = typeof getCurrentId === 'function' ? getCurrentId() : '';
        applicaPermessiPagina(mappaCached, currentId);
      } catch {}
    }

    // 5b. Controllo Permessi aggiornato dal DB (Async — aggiorna sessionStorage)
    await checkPermissionsAndApply(user);

    // 5c. Notifiche admin non lette
    checkAndShowNotifiche(user);

    // 5d. Push notifications: registra SW e mostra banner se non ancora chiesto
    initPushNotifications(user);
  }

  /**
   * Applica le restrizioni SOLA LETTURA — versione completa
   * Copre tutti i bottoni e form dell'intera app M361
   */
  async function checkPermissionsAndApply(user) {
    const _supabase = getSupabase();
    if (!_supabase || !user.id) return;

    // Salva ruolo in sessionStorage
    const ruolo = (user.ruolo || '').toLowerCase();
    sessionStorage.setItem('ruolo', ruolo);

    // Admin e dipendenti: bypass del sistema permessi DB (accesso completo).
    // SCU e altri ruoli contrattualizzati passano invece dal controllo permessi.
    // Questo è INTENZIONALE: dipendente = staff fisso con accesso globale.
    if (['admin', 'dipendente'].includes(ruolo)) {
      sessionStorage.removeItem('permessi');
      return;
    }

    const { data: permessi } = await _supabase
      .from('utenti_permessi')
      .select('sezione, può_vedere, può_operare')
      .eq('utente_id', user.id);

    if (!permessi?.length) {
      sessionStorage.removeItem('permessi');
      return; // Nessun limite impostato = accesso completo
    }

    // Costruisce mappa e salva in sessionStorage per uso sincrono sulle pagine
    const mappa = {};
    permessi.forEach(p => {
      mappa[p.sezione] = { vede: p['può_vedere'], opera: p['può_operare'] };
    });
    sessionStorage.setItem('permessi', JSON.stringify(mappa));

    // Nascondi voci di menu per sezioni non visibili
    permessi.filter(p => !p['può_vedere']).forEach(p => {
      document.querySelectorAll(`.mn-item[href*="${p.sezione}"]`)
        .forEach(el => { el.style.display = 'none'; });
    });

    // Applica permessi alla pagina corrente
    const currentId = typeof getCurrentId === 'function' ? getCurrentId() : '';
    applicaPermessiPagina(mappa, currentId);
  }

  function applicaPermessiPagina(mappa, currentId) {
    if (!currentId || !mappa) return;
    const perm = mappa[currentId];
    if (!perm) return;

    // Helper: esegue fn subito se DOM già pronto, altrimenti aspetta DOMContentLoaded
    const whenReady = (fn) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn, { once: true });
      } else {
        fn();
      }
    };

    if (perm.vede === false) {
      // Redirect immediato alla home — più pulito della sostituzione del body
      whenReady(() => { window.location.href = getBase() + 'index.html'; });
      return;
    }

    if (perm.opera === false) {
      whenReady(() => {
        applyReadonlyMode();
        if (!document.getElementById('m361-readonly-banner')) {
          const banner = document.createElement('div');
          banner.id = 'm361-readonly-banner';
          banner.style.cssText =
            'background:#fef3c7;border-bottom:2px solid #f59e0b;padding:10px 20px;' +
            'font-size:14px;font-weight:600;color:#92400e;text-align:center;' +
            'position:sticky;top:56px;z-index:8999';
          banner.textContent = '👁 Modalità sola lettura — non puoi modificare questa sezione';
          document.body.insertBefore(banner,
            document.getElementById('m361-header')?.nextSibling || document.body.firstChild);
        }
      });
    }
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

  // ── NOTIFICHE ───────────────────────────────────────────────────────────
  async function checkAndShowNotifiche(user) {
    const _supabase = getSupabase();
    if (!_supabase || !user?.nome) return;

    const emporio = (user.emporio || '').toLowerCase();
    const nome    = user.nome;

    // Fetch notifiche rilevanti per questo operatore (globali o per il suo emporio)
    const { data } = await _supabase
      .from('notifiche')
      .select('id, titolo, testo, target, letta_da')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!data?.length) return;

    const nonLette = data.filter(n => {
      if (n.target !== 'tutti' && n.target !== emporio) return false;
      return !Array.isArray(n.letta_da) || !n.letta_da.includes(nome);
    });

    // Aggiorna badge campanellina
    whenReady(() => {
      const badge = document.getElementById('m361-bell-badge');
      if (badge) {
        if (nonLette.length > 0) {
          badge.textContent = nonLette.length;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    });

    if (!nonLette.length) return;

    whenReady(() => {
      nonLette.forEach(notif => {
        const bannerId = `m361-notif-${notif.id}`;
        if (document.getElementById(bannerId)) return;

        const banner = document.createElement('div');
        banner.id = bannerId;
        banner.style.cssText =
          'background:#eff6ff;border-bottom:2px solid #3b82f6;padding:12px 20px;' +
          'font-size:14px;color:#1e3a5f;position:sticky;top:56px;z-index:8998;' +
          'display:flex;align-items:flex-start;gap:12px';

        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = 'flex:1';
        msgDiv.innerHTML =
          `<span style="font-weight:700">🔔 ${_escHtml(notif.titolo)}</span>` +
          (notif.testo ? `<span style="margin-left:8px;color:#3b5f8a">${_escHtml(notif.testo)}</span>` : '');

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText =
          'background:none;border:none;cursor:pointer;font-size:16px;' +
          'color:#64748b;padding:0;line-height:1;flex-shrink:0';
        closeBtn.onclick = async () => {
          banner.remove();
          // Decrementa badge
          const badge = document.getElementById('m361-bell-badge');
          if (badge) {
            const cnt = (parseInt(badge.textContent) || 1) - 1;
            if (cnt <= 0) { badge.style.display = 'none'; }
            else { badge.textContent = cnt; }
          }
          // Marca come letta
          const { data: fresh } = await _supabase
            .from('notifiche').select('letta_da').eq('id', notif.id).limit(1);
          const current = fresh?.[0]?.letta_da || [];
          if (!current.includes(nome)) {
            await _supabase.from('notifiche')
              .update({ letta_da: [...current, nome] })
              .eq('id', notif.id);
          }
        };

        banner.appendChild(msgDiv);
        banner.appendChild(closeBtn);

        // Insert after the last stacked notification, or readonly-banner, or header
        const prevNotifs = [...document.querySelectorAll('[id^="m361-notif-"]')];
        const anchor = prevNotifs[prevNotifs.length - 1]
          || document.getElementById('m361-readonly-banner')
          || document.getElementById('m361-header');
        document.body.insertBefore(banner, anchor?.nextSibling || document.body.firstChild);
      });
    });
  }

  // ── PUSH NOTIFICATIONS ──────────────────────────────────────────────────
  const VAPID_PUBLIC_KEY = 'BDp6t_puD0DL_xwGbaZwMQ_zbfd6ZSzWFuJ8Br87NsxuLhLoeoN4SZin10Vg3YqpgIocZzRXwW-WKQ9sZoLC8aw';

  // Bell click: apre il pannello notifiche + push
  window.__m361BellClick = (e) => {
    e && e.stopPropagation();
    _toggleNotifPanel();
  };

  function _toggleNotifPanel() {
    const existing = document.getElementById('m361-notif-panel');
    if (existing) { existing.remove(); return; }

    const panel = document.createElement('div');
    panel.id = 'm361-notif-panel';
    panel.style.cssText =
      'position:fixed;top:60px;right:12px;width:320px;max-height:80vh;' +
      'background:#fff;border:1px solid #e2e8f0;border-radius:16px;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.14);z-index:10000;font-family:Inter,sans-serif;' +
      'display:flex;flex-direction:column;overflow:hidden';
    panel.innerHTML =
      '<div style="padding:14px 16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">' +
        '<span style="font-size:13px;font-weight:800;color:#1e293b">🔔 Notifiche</span>' +
        '<button id="m361-np-close" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:16px;padding:0;line-height:1">✕</button>' +
      '</div>' +
      '<div id="m361-np-list" style="overflow-y:auto;flex:1;padding:8px 0">' +
        '<div style="padding:16px;text-align:center;color:#94a3b8;font-size:13px">Caricamento…</div>' +
      '</div>' +
      '<div style="padding:12px 16px;border-top:1px solid #f1f5f9;flex-shrink:0">' +
        '<div id="m361-pp-status" style="font-size:12px;font-weight:600;color:#475569;margin-bottom:8px;line-height:1.4">—</div>' +
        '<button id="m361-pp-btn" style="display:none;width:100%;padding:8px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">—</button>' +
        '<div id="m361-pp-err" style="display:none;margin-top:6px;font-size:11px;color:#B5453A;line-height:1.4"></div>' +
      '</div>';

    document.body.appendChild(panel);
    document.getElementById('m361-np-close').onclick = () => panel.remove();

    setTimeout(() => {
      document.addEventListener('click', function _close(ev) {
        if (!panel.contains(ev.target) && ev.target !== document.getElementById('m361-bell-btn')) {
          panel.remove();
          document.removeEventListener('click', _close);
        }
      });
    }, 50);

    _loadNotifPanel();
    _refreshPushStatus();
  }

  async function _loadNotifPanel() {
    const listEl = document.getElementById('m361-np-list');
    if (!listEl) return;

    const _supabase = getSupabase();
    const user = JSON.parse(localStorage.getItem('m361_user') || '{}');
    if (!_supabase || !user?.nome) {
      listEl.innerHTML = '<div style="padding:16px;font-size:13px;text-align:center;line-height:1.6;color:#dc2626">⚠️ Sessione non allineata.<br><span style="color:#64748b">Esci e rientra per ripristinare le notifiche.</span></div>';
      return;
    }

    const emporio = (user.emporio || '').toLowerCase();
    const { data, error } = await _supabase
      .from('notifiche')
      .select('id, titolo, testo, target, mittente, created_at, letta_da')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error || !data?.length) {
      listEl.innerHTML = '<div style="padding:16px;color:#94a3b8;font-size:13px;text-align:center">Nessuna notifica</div>';
      return;
    }

    // Filtra solo quelle rilevanti per questo utente
    const mie = data.filter(n => n.target === 'tutti' || n.target === emporio);

    if (!mie.length) {
      listEl.innerHTML = '<div style="padding:16px;color:#94a3b8;font-size:13px;text-align:center">Nessuna notifica per te</div>';
      return;
    }

    listEl.innerHTML = mie.map(n => {
      const letta = Array.isArray(n.letta_da) && n.letta_da.includes(user.nome);
      const dt = new Date(n.created_at);
      const dtStr = dt.toLocaleDateString('it-IT', { day:'2-digit', month:'short' }) + ' ' +
                    dt.toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
      return `<div data-id="${n.id}" style="padding:10px 16px;border-bottom:1px solid #f8fafc;cursor:pointer;background:${letta ? '#fff' : '#eff6ff'}"
                   onmouseenter="this.style.background='#f8fafc'" onmouseleave="this.style.background='${letta ? '#fff' : '#eff6ff'}'">
        <div style="display:flex;align-items:flex-start;gap:8px">
          <span style="width:6px;height:6px;border-radius:50%;background:${letta ? '#e2e8f0' : '#3b82f6'};flex-shrink:0;margin-top:5px"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:${letta ? '500' : '700'};color:#1e293b;margin-bottom:2px">${_escHtml(n.titolo)}</div>
            ${n.testo ? `<div style="font-size:12px;color:#64748b;margin-bottom:4px;line-height:1.4">${_escHtml(n.testo)}</div>` : ''}
            <div style="font-size:10px;color:#94a3b8">${dtStr} · da ${_escHtml(n.mittente || '—')}</div>
          </div>
        </div>
      </div>`;
    }).join('');

    // Click su una notifica → segna come letta
    listEl.querySelectorAll('[data-id]').forEach(el => {
      el.addEventListener('click', async () => {
        const id = parseInt(el.dataset.id);
        const n = mie.find(x => x.id === id);
        if (!n) return;
        const current = Array.isArray(n.letta_da) ? n.letta_da : [];
        if (!current.includes(user.nome)) {
          await _supabase.from('notifiche').update({ letta_da: [...current, user.nome] }).eq('id', id);
          n.letta_da = [...current, user.nome];
          el.style.background = '#fff';
          el.querySelector('span').style.background = '#e2e8f0';
          el.querySelector('div > div > div').style.fontWeight = '500';
          // Aggiorna badge
          const badge = document.getElementById('m361-bell-badge');
          if (badge) {
            const cnt = (parseInt(badge.textContent) || 1) - 1;
            badge.style.display = cnt > 0 ? 'flex' : 'none';
            if (cnt > 0) badge.textContent = cnt;
          }
        }
      });
    });
  }

  async function _refreshPushStatus() {
    const statusEl = document.getElementById('m361-pp-status');
    const btnEl    = document.getElementById('m361-pp-btn');
    const errEl    = document.getElementById('m361-pp-err');
    if (!statusEl) return;

    const user = JSON.parse(localStorage.getItem('m361_user') || '{}');

    // Se la sessione è parziale, mostra errore coerente (non "Push abilitati")
    if (!user?.nome) {
      statusEl.innerHTML = '⚠️ <span style="color:#dc2626">Sessione non allineata — esci e rientra</span>';
      if (btnEl) btnEl.style.display = 'none';
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      statusEl.textContent = 'Push non supportate da questo browser';
      return;
    }
    if (Notification.permission === 'denied') {
      statusEl.innerHTML = '🚫 Notifiche bloccate dal browser';
      return;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        const _supabase = getSupabase();
        if (_supabase) {
          const { data } = await _supabase.from('push_subscriptions').select('id').eq('endpoint', sub.endpoint).limit(1);
          if (!data?.length) await _upsertSubscription(user, sub);
        }
        statusEl.innerHTML = `✅ <span style="color:#16a34a">Push abilitati</span> <span style="color:#94a3b8;font-size:11px">(${_escHtml(user.nome)})</span>`;
        btnEl.textContent = 'Disabilita push';
        btnEl.style.cssText = 'display:block;width:100%;padding:8px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:#f1f5f9;color:#475569';
        btnEl.onclick = async () => {
          btnEl.textContent = 'Disabilitazione…'; btnEl.disabled = true;
          await _pushUnsubscribe(user); _refreshPushStatus();
        };
      } else {
        statusEl.textContent = Notification.permission === 'granted' ? '⚠️ Push non attivi' : '○ Push non abilitati';
        btnEl.textContent = 'Abilita push';
        btnEl.style.cssText = 'display:block;width:100%;padding:8px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;background:#B5453A;color:#fff';
        btnEl.onclick = async () => {
          btnEl.textContent = 'Attivazione…'; btnEl.disabled = true;
          errEl.style.display = 'none';
          const err = await _pushSubscribe(user);
          if (err) {
            errEl.textContent = 'Errore: ' + err; errEl.style.display = 'block';
            btnEl.textContent = 'Riprova'; btnEl.disabled = false;
          } else { _refreshPushStatus(); }
        };
      }
    } catch (e) {
      statusEl.textContent = 'Errore: ' + e.message;
    }
  }

  // Restituisce null se ok, stringa di errore se fallisce
  async function _pushSubscribe(user) {
    try {
      // iOS richiede la modalità standalone (aggiunta alla schermata Home)
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS && window.navigator.standalone !== true) {
        return 'Su iPhone le notifiche funzionano solo dall\'app installata. Vai su Safari → icona Condividi → "Aggiungi a schermata Home", poi riapri l\'app da lì e riattiva le notifiche.';
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return 'Permesso negato dal browser.';

      let reg;
      try {
        reg = await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
        reg = await navigator.serviceWorker.ready;
      } catch (e) { return 'Service Worker: ' + e.message; }

      let sub;
      try {
        // Prima rimuovi eventuale subscription vecchia (chiavi VAPID cambiate)
        const old = await reg.pushManager.getSubscription();
        if (old) await old.unsubscribe();

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: _urlB64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      } catch (e) { return 'Subscription: ' + e.message; }

      try {
        await _upsertSubscription(user, sub);
      } catch (e) { return 'Salvataggio DB: ' + e.message; }

      return null;
    } catch (e) { return e.message; }
  }

  async function _pushUnsubscribe(user) {
    try {
      const _supabase = getSupabase();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        if (_supabase) await _supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      }
    } catch (e) { console.warn('[M361 push] unsubscribe', e); }
  }

  function _detectPlatform() {
    const ua = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua))           return 'android';
    return 'desktop';
  }

  function _getDeviceId() {
    let id = localStorage.getItem('m361_device_id');
    if (!id) {
      id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
      localStorage.setItem('m361_device_id', id);
    }
    return id;
  }

  async function _upsertSubscription(user, sub) {
    const _supabase = getSupabase();
    if (!_supabase || !user?.nome) return;
    const subJson = sub.toJSON ? sub.toJSON() : sub;
    const { error } = await _supabase.from('push_subscriptions').upsert({
      operatore_nome: user.nome,
      operatore_id:   user.id || null,
      emporio:        (user.emporio || '').toLowerCase(),
      endpoint:       subJson.endpoint,
      subscription:   subJson,
      platform:       _detectPlatform(),
      device_id:      _getDeviceId(),
      last_seen_at:   new Date().toISOString(),
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'endpoint' });
    if (error) throw new Error(error.message);
  }

  async function initPushNotifications(user) {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    try { await navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' }); } catch (_) {}

    if (Notification.permission === 'granted') {
      // Resync silenzioso: se la subscription esiste ma non è nel DB, la salva
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await _upsertSubscription(user, sub);
        } else {
          // Subscription persa ma permesso granted: riattiva automaticamente (una volta per sessione)
          if (!sessionStorage.getItem('m361_push_autotried')) {
            sessionStorage.setItem('m361_push_autotried', '1');
            const err = await _pushSubscribe(user);
            if (err) _showPushBanner(user, err);
          }
        }
      } catch (_) {}
    } else if (Notification.permission === 'default') {
      // Richiesta automatica al primo accesso della sessione — nessun banner intermedio
      if (!sessionStorage.getItem('m361_push_autotried')) {
        sessionStorage.setItem('m361_push_autotried', '1');
        const err = await _pushSubscribe(user);
        // Mostra banner solo se c'è un errore reale (es. iOS non standalone)
        // "Permesso negato" non mostra nulla: l'utente ha scelto consapevolmente
        if (err && !err.startsWith('Permesso negato')) _showPushBanner(user, err);
      }
    }
    // permission === 'denied': l'utente ha bloccato — non disturbare
  }

  function _showPushBanner(user, errMsg) {
    if (document.getElementById('m361-push-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'm361-push-banner';
    banner.style.cssText =
      'background:#1e293b;color:#fff;padding:12px 20px;font-size:13px;' +
      'display:flex;align-items:center;gap:12px;flex-wrap:wrap;position:sticky;top:56px;z-index:8997;';
    const anchor = document.getElementById('m361-readonly-banner') || document.getElementById('m361-header');

    if (errMsg) {
      // Errore (es. iOS non standalone): mostra messaggio + pulsante riprova + ✕
      banner.innerHTML =
        `<span style="flex:1;min-width:180px;line-height:1.5">⚠️ ${_escHtml(errMsg)}</span>` +
        `<button id="m361-push-retry" style="background:#B5453A;color:#fff;border:none;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0">Riprova</button>` +
        `<button id="m361-push-banner-close" style="background:transparent;color:#94a3b8;border:none;padding:7px 10px;font-size:18px;cursor:pointer;font-family:inherit;flex-shrink:0">✕</button>`;
      document.body.insertBefore(banner, anchor?.nextSibling || document.body.firstChild);
      document.getElementById('m361-push-retry').onclick = async () => {
        const btn = document.getElementById('m361-push-retry');
        if (btn) { btn.textContent = '…'; btn.disabled = true; }
        const err2 = await _pushSubscribe(user);
        if (!err2) banner.remove();
        else if (btn) { btn.textContent = 'Riprova'; btn.disabled = false; }
      };
      document.getElementById('m361-push-banner-close').onclick = () => banner.remove();
    } else {
      // Fallback (non dovrebbe essere necessario con auto-trigger)
      banner.innerHTML =
        '<span style="flex:1;min-width:180px">Attiva le notifiche per ricevere i promemoria turno</span>' +
        '<button id="m361-push-yes" style="background:#B5453A;color:#fff;border:none;padding:7px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit">Attiva</button>' +
        '<button id="m361-push-banner-close" style="background:transparent;color:#94a3b8;border:none;padding:7px 10px;font-size:18px;cursor:pointer;font-family:inherit">✕</button>';
      document.body.insertBefore(banner, anchor?.nextSibling || document.body.firstChild);
      document.getElementById('m361-push-yes').onclick = async () => {
        const btn = document.getElementById('m361-push-yes');
        if (btn) { btn.textContent = '…'; btn.disabled = true; }
        const err = await _pushSubscribe(user);
        if (!err) banner.remove();
        else if (btn) { btn.textContent = 'Attiva'; btn.disabled = false; }
      };
      document.getElementById('m361-push-banner-close').onclick = () => banner.remove();
    }
  }

  // Aggiorna anche il pannello nel modal profilo se aperto
  async function _updatePushStatusUI() {
    const statusEl = document.getElementById('m361-push-modal-status');
    const btnEl    = document.getElementById('m361-push-modal-btn');
    if (!statusEl || !btnEl) return;
    const user = JSON.parse(localStorage.getItem('m361_user') || '{}');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      const newBtn = btnEl.cloneNode(true);
      btnEl.parentNode.replaceChild(newBtn, btnEl);
      if (sub) {
        statusEl.textContent = '✓ Abilitate'; statusEl.style.color = '#16a34a';
        newBtn.textContent = 'Disabilita';
        newBtn.style.cssText = 'background:#f1f5f9;color:#475569;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;display:block';
        newBtn.onclick = async () => { await _pushUnsubscribe(user); _updatePushStatusUI(); };
      } else {
        statusEl.textContent = 'Non attive'; statusEl.style.color = '#94a3b8';
        newBtn.textContent = 'Abilita';
        newBtn.style.cssText = 'background:#B5453A;color:#fff;border:none;border-radius:10px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:Inter,sans-serif;white-space:nowrap;display:block';
        newBtn.onclick = async () => { await _pushSubscribe(user); _updatePushStatusUI(); };
      }
    } catch (_) {
      if (statusEl) { statusEl.textContent = 'Non supportate'; statusEl.style.color = '#94a3b8'; }
    }
  }

  function _urlB64ToUint8Array(b64) {
    const pad = '='.repeat((4 - b64.length % 4) % 4);
    const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  // Banner in-app per push ricevuti con l'app aperta in foreground
  function _showInAppPushBanner(title, body) {
    document.querySelectorAll('.m361-inapp-push').forEach(el => el.remove());
    const el = document.createElement('div');
    el.className = 'm361-inapp-push';
    el.style.cssText =
      'position:fixed;top:68px;left:50%;transform:translateX(-50%);' +
      'background:#1e293b;color:#fff;padding:14px 20px;border-radius:14px;' +
      'box-shadow:0 8px 28px rgba(0,0,0,.28);z-index:10001;' +
      'min-width:260px;max-width:calc(100vw - 32px);' +
      'font-family:Inter,sans-serif;cursor:pointer;' +
      'animation:m361-slide-down .3s ease';
    el.innerHTML =
      `<div style="font-weight:700;font-size:14px${body ? ';margin-bottom:4px' : ''}">🔔 ${_escHtml(title)}</div>` +
      (body ? `<div style="font-size:12px;color:#94a3b8;line-height:1.4">${_escHtml(body)}</div>` : '');
    el.onclick = () => el.remove();
    document.body.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .4s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 5000);
  }

  // Ascolta i messaggi inviati dal Service Worker (push ricevuti in foreground)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data?.type === 'm361-push') {
        _showInAppPushBanner(event.data.title || 'M361', event.data.body || '');
      }
    });
  }

  function _escHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Lancio dello script
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
