/**
 * nav-script.js — M361 App
 * Rilevamento automatico della pagina attiva e generazione Navbar
 */
(function () {
  'use strict';

  if (window.__m361NavLoaded) return;
  window.__m361NavLoaded = true;

  /* ═══════════════════════════════════════
     1. DETERMINA IL PERCORSO BASE (BASE PATH)
  ═══════════════════════════════════════ */
  function getBase() {
    const scripts = document.querySelectorAll('script[src]');
    for (const s of scripts) {
      if (s.src && s.src.includes('nav-script.js')) {
        return s.src.replace(/scripts\/nav-script\.js.*$/, '');
      }
    }
    return './';
  }
  const BASE = getBase();

  /* ═══════════════════════════════════════
     2. CONFIGURAZIONE NAVIGAZIONE
  ═══════════════════════════════════════ */
  const NAV_DATA = [
    {
      group: 'Principale',
      items: [
        { id: 'home',   label: 'Home',   icon: 'fa-house',          href: 'index.html' },
        { id: 'cassa',  label: 'Cassa',  icon: 'fa-cash-register',  href: 'cassa.html' },
        { id: 'turni',  label: 'Turni',  icon: 'fa-calendar-check', href: 'turni.html' },
        { id: 'ordini', label: 'Ordini', icon: 'fa-cart-shopping',  href: 'ordini.html' }
      ]
    },
    {
      group: 'Sistema',
      items: [
        { id: 'logout', label: 'Esci',   icon: 'fa-right-from-bracket', href: '#', isLogout: true }
      ]
    }
  ];

  /* ═══════════════════════════════════════
     3. FUNZIONE DI RENDERING
  ═══════════════════════════════════════ */
  function renderBottomNav() {
    // Rileva il nome del file corrente (es. 'turni.html')
    const path = window.location.pathname;
    const currentPage = path.split("/").pop() || 'index.html';

    const nav = document.createElement('nav');
    nav.id = 'm361-nav'; // Assicurati che il CSS usi questo ID

    NAV_DATA.forEach((group, gIdx) => {
      // Aggiunge separatore tra i gruppi
      if (gIdx > 0) {
        const sep = document.createElement('div');
        sep.className = 'mn-sep';
        nav.appendChild(sep);
      }

      group.items.forEach(item => {
        const a = document.createElement('a');
        
        // LOGICA ATTIVA: Se il file corrente coincide con l'href, aggiunge 'mn-current'
        const isCurrent = (currentPage === item.href);
        
        a.className = 'mn-item' + (isCurrent ? ' mn-current' : '');
        
        if (item.isLogout) {
          a.href = '#';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Vuoi uscire?')) window.location.href = BASE + 'index.html';
          });
        } else {
          a.href = BASE + item.href;
        }

        a.innerHTML = `
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        `;
        
        nav.appendChild(a);
      });
    });

    document.body.appendChild(nav);

    // Auto-scroll se ci sono troppi elementi (per mobile)
    requestAnimationFrame(() => {
      const active = nav.querySelector('.mn-current');
      if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    });
  }

  // Avvio al caricamento del DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderBottomNav);
  } else {
    renderBottomNav();
  }

})();
