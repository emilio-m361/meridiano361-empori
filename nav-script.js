// Inietta la navbar in fondo al body
const navHTML = `
<nav class="bottom-nav">

  <a href="/index.html" class="nav-item" id="nav-home">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
      <polyline points="9 21 9 12 15 12 15 21"/>
    </svg>
    <span>Home</span>
  </a>

  <a href="/ordini.html" class="nav-item" id="nav-ordini">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
    <span>Ordini</span>
  </a>

  <a href="/ordini_nuovi.html" class="nav-item nav-new" id="nav-nuovo">
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
    <span>Nuovo</span>
  </a>

  <a href="/ordini_incorso.html" class="nav-item" id="nav-incorso">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
    <span>In corso</span>
  </a>

  <a href="/ordini_archiviati.html" class="nav-item" id="nav-archivio">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
    <span>Archivio</span>
  </a>

</nav>
`;

document.body.insertAdjacentHTML('beforeend', navHTML);

// Evidenzia la voce attiva
(function() {
  const path = window.location.pathname.split('/').pop();
  const map = {
    'index.html':             'nav-home',
    'ordini.html':            'nav-ordini',
    'ordini_nuovi.html':      'nav-nuovo',
    'ordini_incorso.html':    'nav-incorso',
    'ordini_archiviati.html': 'nav-archivio'
  };
  const activeId = map[path];
  if (activeId) {
    const el = document.getElementById(activeId);
    if (el) el.classList.add('active');
  }
})();
