/**
 * ui-helpers.js — Toast, alert e confirm coerenti con il graphic system M361.
 * Dipende da: niente. Include autonomamente il proprio CSS via JS.
 */

(function injectCSS() {
  if (document.getElementById('m361-ui-css')) return;
  const s = document.createElement('style');
  s.id = 'm361-ui-css';
  s.textContent = `
    @keyframes m361-toast-in  { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes m361-toast-out { from{opacity:1;transform:translateX(-50%) translateY(0)} to{opacity:0;transform:translateX(-50%) translateY(10px)} }
    .m361-toast { position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
      color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:700;
      font-family:Nunito,sans-serif;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,.25);
      display:flex;align-items:center;gap:8px;white-space:nowrap;
      max-width:calc(100vw - 32px);pointer-events:none;
      animation:m361-toast-in .2s ease forwards; }
    .m361-toast.out { animation:m361-toast-out .2s ease forwards; }
    #m361-modal { position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99998;
      display:flex;align-items:center;justify-content:center;padding:16px;
      font-family:Nunito,sans-serif; }
    .m361-modal-box { background:#fff;border-radius:14px;max-width:380px;width:100%;
      box-shadow:0 20px 60px rgba(0,0,0,.2);overflow:hidden; }
    .m361-modal-head { color:#fff;padding:16px 20px;display:flex;align-items:center;gap:10px; }
    .m361-modal-body { padding:16px 20px;font-size:14px;color:#475569;line-height:1.5; }
    .m361-modal-foot { padding:12px 20px 16px;display:flex;justify-content:flex-end;gap:10px; }
    .m361-btn-ok,.m361-btn-ann { border:none;padding:10px 24px;border-radius:8px;
      font-size:14px;font-weight:700;cursor:pointer;min-height:auto; }
    .m361-btn-ann { background:#f1f5f9;color:#475569;border:1px solid #e2e8f0; }
  `;
  document.head.appendChild(s);
})();

const _M361_COLORI = {
  success: '#16A34A', error: '#B5453A',
  warning: '#D97706', info:    '#1e293b',
};
const _M361_ICONE = {
  success: '✓', error: '✕', warning: '⚠', info: 'ℹ',
};

function showToastM361(msg, tipo = 'success', durata = 2500) {
  document.querySelectorAll('.m361-toast').forEach(t => t.remove());
  const bg = _M361_COLORI[tipo] || _M361_COLORI.info;
  const ico = _M361_ICONE[tipo] || 'ℹ';
  const el = document.createElement('div');
  el.className = 'm361-toast';
  el.style.background = bg;
  el.innerHTML = `<span style="font-size:16px">${ico}</span><span>${msg}</span>`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 200);
  }, durata);
}

function m361Alert(msg, titolo, tipo) {
  titolo = titolo || '';
  tipo   = tipo   || 'info';
  return new Promise(function(resolve) {
    document.getElementById('m361-modal')?.remove();
    const col = _M361_COLORI[tipo] || _M361_COLORI.info;
    const ico = _M361_ICONE[tipo]  || 'ℹ';
    const overlay = document.createElement('div');
    overlay.id = 'm361-modal';
    overlay.innerHTML = `
      <div class="m361-modal-box">
        <div class="m361-modal-head" style="background:${col}">
          <span style="font-size:20px">${ico}</span>
          <span style="font-size:15px;font-weight:700">${titolo || msg}</span>
        </div>
        ${titolo ? `<div class="m361-modal-body">${msg}</div>` : ''}
        <div class="m361-modal-foot">
          <button class="m361-btn-ok" style="background:${col};color:#fff">OK</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.m361-btn-ok').addEventListener('click', function() {
      overlay.remove(); resolve(true);
    });
  });
}

function m361Confirm(msg, titolo, testoOk, testoAnnulla, tipo) {
  titolo      = titolo      || 'Conferma';
  testoOk     = testoOk     || 'Conferma';
  testoAnnulla = testoAnnulla || 'Annulla';
  tipo        = tipo        || 'warning';
  return new Promise(function(resolve) {
    document.getElementById('m361-modal')?.remove();
    const col = _M361_COLORI[tipo] || _M361_COLORI.warning;
    const overlay = document.createElement('div');
    overlay.id = 'm361-modal';
    overlay.innerHTML = `
      <div class="m361-modal-box">
        <div class="m361-modal-head" style="background:${col};font-size:15px;font-weight:700">${titolo}</div>
        <div class="m361-modal-body">${msg}</div>
        <div class="m361-modal-foot">
          <button class="m361-btn-ann">${testoAnnulla}</button>
          <button class="m361-btn-ok" style="background:${col};color:#fff">${testoOk}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.m361-btn-ok').addEventListener('click', function() {
      overlay.remove(); resolve(true);
    });
    overlay.querySelector('.m361-btn-ann').addEventListener('click', function() {
      overlay.remove(); resolve(false);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) { overlay.remove(); resolve(false); }
    });
  });
}

function m361Prompt(msg, defaultVal) {
  defaultVal = defaultVal || '';
  return new Promise(function(resolve) {
    document.getElementById('m361-modal')?.remove();
    const col = _M361_COLORI.info;
    const overlay = document.createElement('div');
    overlay.id = 'm361-modal';
    overlay.innerHTML = `
      <div class="m361-modal-box">
        <div class="m361-modal-head" style="background:${col};font-size:15px;font-weight:700">${msg}</div>
        <div class="m361-modal-body">
          <input id="m361-prompt-inp" type="text" value="${defaultVal}"
            style="width:100%;border:1px solid #e2e8f0;border-radius:8px;
                   padding:9px 12px;font-size:14px;font-family:inherit;outline:none">
        </div>
        <div class="m361-modal-foot">
          <button class="m361-btn-ann">Annulla</button>
          <button class="m361-btn-ok" style="background:${col};color:#fff">OK</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    const inp = overlay.querySelector('#m361-prompt-inp');
    inp.focus();
    inp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') { overlay.remove(); resolve(inp.value); }
      if (e.key === 'Escape') { overlay.remove(); resolve(null); }
    });
    overlay.querySelector('.m361-btn-ok').addEventListener('click', function() {
      overlay.remove(); resolve(inp.value);
    });
    overlay.querySelector('.m361-btn-ann').addEventListener('click', function() {
      overlay.remove(); resolve(null);
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) { overlay.remove(); resolve(null); }
    });
  });
}
