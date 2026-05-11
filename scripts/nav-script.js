(function () {
  'use strict';
  if (window.__m361NavLoaded) return;
  window.__m361NavLoaded = true;

  const SUPA_URL = 'https://hsalynvxazxqtmsvjrzc.supabase.co';
  const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzYWx5bnZ4YXp4cXRtc3ZqcnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MjQ3MjcsImV4cCI6MjA5MzMwMDcyN30.JW4nsMrrfuI8BTg4bn2v74seVJ-_prfxZ1PQp5T18a8';

  // Client Supabase globale per lo script
  let _supabase = null;
  if (window.supabase && window.supabase.createClient) {
    _supabase = window.supabase.createClient(SUPA_URL, SUPA_KEY);
  }

  /* ═══════════════════════════════════════
     CONTROLLO PERMESSI (Sola Lettura)
  ═══════════════════════════════════════ */
  async function checkPermissionsAndApply() {
    const user = JSON.parse(localStorage.getItem('m361_user'));
    if (!user || !_supabase) return;

    // Recupera lo stato aggiornato dal DB
    const { data: dbUser, error } = await _supabase
        .from('user_permissions')
        .select('is_readonly')
        .eq('email', user.email)
        .single();

    if (error) return;

    if (dbUser && dbUser.is_readonly) {
        const style = document.createElement('style');
        style.id = 'm361-readonly-mode';
        style.innerHTML = `
            /* Nasconde bottoni di azione e invio */
            button[type="submit"], .btn-add, .btn-delete, #submit-btn, 
            .btn-save, .action-btn, .admin-only, [onclick*="save"], [onclick*="delete"] { 
                display: none !important; 
            }
            /* Disabilita interazione con i moduli */
            input, select, textarea { 
                pointer-events: none !important; 
                opacity: 0.7; 
                background-color: #f1f5f9 !important; 
            }
            /* Banner di avviso fisso */
            body::after { 
                content: "⚠️ MODALITÀ SOLA LETTURA ATTIVA"; 
                position: fixed; top: 75px; left: 50%; transform: translateX(-50%); 
                background: #fef9c3; color: #854d0e; padding: 4px 12px; 
                font-size: 10px; font-weight: 800; border-radius: 20px; 
                z-index: 10000; border: 1px solid #facc15; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
    }
  }

  /* ═══════════════════════════════════════
     COSTRUZIONE NAV (con tasto Admin)
  ═══════════════════════════════════════ */
  function buildNav() {
    document.querySelectorAll('#m361-nav, nav.bottom-nav, .bottom-nav').forEach(n => n.remove());
    
    const user = JSON.parse(localStorage.getItem('m361_user'));
    const currentId = typeof getCurrentId === 'function' ? getCurrentId() : '';
    const userSections = typeof getUserSections === 'function' ? getUserSections() : [];

    const nav = document.createElement('nav');
    nav.id = 'm361-nav';

    // Funzione interna per creare i tasti
    const createItem = (item) => {
        const isCurrent = item.id === currentId;
        const a = document.createElement('a');
        a.className = 'mn-item' + (isCurrent ? ' mn-current' : '') + (item.isLogout ? ' mn-logout' : ' mn-active');
        a.href = item.isLogout ? '#' : BASE + item.href;
        if (item.isLogout) {
            a.onclick = (e) => { e.preventDefault(); if(confirm('Esci?')) doLogout(); };
        }
        a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
        return a;
    };

    // Voci standard (dal tuo array NAV se presente, altrimenti fallback)
    if (typeof NAV !== 'undefined') {
        NAV.forEach((section, si) => {
            if (si > 0) nav.appendChild(Object.assign(document.createElement('div'), {className: 'mn-sep'}));
            section.items.forEach(item => {
                if (item.section && userSections.length > 0 && !userSections.includes(item.section)) return;
                nav.appendChild(createItem(item));
            });
        });
    }

    // TASTO ADMIN (Solo per e.mazzolari)
    if (user && user.email === 'e.mazzolari@meridiano361.it') {
        nav.appendChild(Object.assign(document.createElement('div'), {className: 'mn-sep'}));
        nav.appendChild(createItem({ id: 'admin', label: 'Admin', icon: 'fa-gear', href: 'impostazioni.html' }));
    }

    document.body.appendChild(nav);
  }

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  async function init() {
    if (window.location.pathname.includes('login.html')) return;

    const user = JSON.parse(localStorage.getItem('m361_user'));
    if (!user) {
      window.location.href = getBase() + 'login.html';
      return;
    }

    // Definisci BASE qui per le funzioni
    window.BASE = getBase();

    // 1. UI
    buildHeader();
    buildNav();

    // 2. Sicurezza (Async)
    await checkPermissionsAndApply();
  }

  // Funzioni di supporto mancanti o semplificate
  function getBase() {
    const s = document.querySelector('script[src*="nav-script.js"]');
    return s ? s.src.split('scripts/')[0] : './';
  }
  function buildHeader() { /* ... tua buildHeader esistente ... */ }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
