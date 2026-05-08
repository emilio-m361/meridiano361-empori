// nav-script.js — menu in basso condiviso
(function () {
  const NAV_ITEMS = [
    { label: 'Home',     icon: 'fa-house',         href: '../../index.html' },
    { label: 'Cassa',    icon: 'fa-cash-register',  href: '../../pages/cassa/cassa.html' },
    { label: 'Prodotti', icon: 'fa-box-open',        href: '../../pages/prodotti/prodotti.html' },
    { label: 'Ordini',   icon: 'fa-clipboard-list',  href: '../../pages/ordini/ordini.html' },
    { label: 'Report',   icon: 'fa-chart-bar',       href: '../../pages/report/report.html' },
  ];

  const current = window.location.pathname;

  const nav = document.createElement('nav');
  nav.className = 'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 flex justify-around items-center px-2 py-2 shadow-lg';

  NAV_ITEMS.forEach(item => {
    const isActive = current.includes(item.href.replace('../../', ''));
    const a = document.createElement('a');
    a.href = item.href;
    a.className = `flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${
      isActive ? 'text-[#b75252] font-black' : 'text-slate-400 hover:text-[#b75252]'
    }`;
    a.innerHTML = `
      <i class="fas ${item.icon} text-lg"></i>
      <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">${item.label}</span>
    `;
    nav.appendChild(a);
  });

  document.body.appendChild(nav);
})();
