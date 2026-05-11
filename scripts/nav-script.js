/**
 * nav-script.js — M361 App
 * Integrazione con Sistema Controllo Permessi Dinamico
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
     PERMESSI DINAMICI E SOLA LETTURA
  ═══════════════════════════════════════ */
  async function checkPermissionsAndApply() {
    const user = JSON.parse(localStorage.getItem('m361_user'));
    if (!user) return;

    const _supabase = getSupabase();
    if (!_supabase) return;

    // Recupera lo stato aggiornato dal DB
    const { data: dbUser, error } = await _supabase
        .from('user_permissions')
        .select('is_readonly, visible_sections')
        .eq('email', user.email)
        .single();

    if (error) {
        console.error("Errore recupero permessi:", error);
        return;
    }

    if (dbUser && dbUser.is_readonly) {
        const style = document.createElement('style');
        style.id = 'm361-readonly-style';
        style.innerHTML = `
            /* Blocca azioni di modifica */
            button[type="submit"], .btn-add, .btn-delete, #submit-btn, .admin-only { 
                display: none !important; 
            }
            /* Disabilita input e select */
            input, select, textarea { 
                pointer-events: none !important; 
                opacity: 0.7; 
                background: #f1f5f9 !important; 
            }
            /* Etichetta di stato */
            body::after { 
                content: "SOLA LETTURA ATTIVA"; 
                position: fixed; 
                top: 75px; 
                left: 50%; 
                transform: translateX(-50%); 
                background: #fef9c3; 
                color: #854d0e; 
                padding: 2px 10px; 
                font-size: 9px; 
                font-weight: 800; 
                border-radius: 5px; 
                z-index: 10000; 
                border: 1px solid #facc15; 
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
        `;
        document.head.appendChild(style);
    }
  }

  /* ═══════════════════════════════════════
     UTILITY & NAVIGATION
  ═══════════════════════════════════════ */
  function getBase() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src.includes('nav-script.js')) return s.src.replace('scripts/nav-script.js', '');
    }
    return './';
  }
  const BASE = getBase();

  function buildHeader() {
    if (document.getElementById('m361-header')) return;
    const hdr = document.createElement('header');
    hdr.id = 'm361-header';
    hdr.innerHTML = `<img src="${BASE}assets/img/logo-m361.png" alt="M361" style="height:45px;width:auto;" onerror="this.src='https://via.placeholder.com/150x50?text=M361'">`;
    document.body.prepend(hdr);
  }

  function buildNav() {
    if (document.getElementById('m361-nav')) return;
    const user = JSON.parse(localStorage.getItem('m361_user'));
    const currentPage = window.location.pathname.split("/").pop() || 'index.html';
    const nav = document.createElement('nav');
    nav.id = 'm361-nav';

    const menu = [
      { label: 'Home', icon: 'fa-house', href: 'index.html' },
      { label: 'Cassa', icon: 'fa-cash-register', href: 'cassa.html' },
      { label: 'Turni', icon: 'fa-calendar-check', href: 'turni.html' },
      { label: 'Prezzi', icon: 'fa-tag', href: 'prezzi.html' }
    ];

    // Se è l'admin, aggiungi il tasto impostazioni
    if (user && user.email === 'e.mazzolari@meridiano361.it') {
      menu.push({ label: 'Admin', icon: 'fa-gear', href: 'impostazioni.html' });
    }

    menu.forEach((item, index) => {
      if (index > 0) {
        const sep = document.createElement('div');
        sep.className = 'mn-sep';
        nav.appendChild(sep);
      }
      const a = document.createElement('a');
      a.className = 'mn-item' + (currentPage === item.href ? ' mn-current' : '');
      a.href = BASE + item.href;
      a.innerHTML = `<i class="fas ${item.icon}"></i><span>${item.label}</span>`;
      nav.appendChild(a);
    });

    document.body.appendChild(nav);
  }

  /* ═══════════════════════════════════════
     INIT
  ═══════════════════════════════════════ */
  async function init() {
    // Evita l'esecuzione sulla pagina di login
    if (window.location.pathname.includes('login.html')) return;

    const user = JSON.parse(localStorage.getItem('m361_user'));
    if (!user) {
        window.location.href = BASE + 'login.html';
        return;
    }

    buildHeader();
    buildNav();
    
    // Applica i permessi dinamici
    await checkPermissionsAndApply();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
