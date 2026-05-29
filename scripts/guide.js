(function () {
  'use strict';

  const GUIDE = {
    ordini: {
      title: 'Guida — Ordini',
      voci: [
        { q: 'Come creare un nuovo ordine?', a: 'Vai su "Nuovo Ordine", scegli il tipo (Standard o Bomboniere), compila emporio, operatore, cliente e prodotti, poi clicca "Salva Ordine".' },
        { q: 'Cosa significa la colonna "Da Ord"?', a: 'È la quantità ancora da ordinare: Qtà totale meno la somma di merce pronta, da fornitore, da empori e da altri. Se il risultato è rosso, la somma delle fonti supera la quantità totale.' },
        { q: 'Come modificare un ordine esistente?', a: 'Dalla lista "In Corso", clicca sull\'icona matita ✏ accanto all\'ordine per aprire la pagina di modifica.' },
        { q: 'Come archiviare un ordine?', a: 'Nella lista "In Corso", apri l\'ordine e usa il pulsante "Archivia". L\'ordine sarà spostato nella sezione "Archiviati".' },
        { q: 'Come generare automaticamente il titolo?', a: 'Compila i campi descrizione dei prodotti, poi clicca il pulsante "Genera" accanto al campo Titolo ordine.' },
        { q: 'Come stampare un preventivo?', a: 'Disponibile solo per ordini Bomboniere. Compila le tipologie e i prodotti, poi clicca "Stampa Preventivo PDF".' },
        { q: 'Cosa è il numero d\'ordine?', a: 'Viene generato automaticamente in formato AAAAMMGGXX#NN dove XX è il codice emporio e NN è il progressivo giornaliero.' },
      ]
    },
    cassa: {
      title: 'Guida — Cassa',
      voci: [
        { q: 'Come registrare un incasso?', a: 'Seleziona la data, inserisci l\'importo e la categoria, poi clicca "Registra". La voce apparirà nel riepilogo del giorno.' },
        { q: 'Come vedere il totale giornaliero?', a: 'In fondo alla pagina trovi il riepilogo con subtotali per categoria e il totale incassato del giorno.' },
        { q: 'Come esportare i dati cassa?', a: 'Usa il pulsante "Esporta CSV" per scaricare le registrazioni in formato foglio di calcolo.' },
      ]
    },
    turni: {
      title: 'Guida — Turni',
      voci: [
        { q: 'Come aggiungere un turno?', a: 'Clicca sul giorno desiderato nel calendario, seleziona l\'operatore e l\'orario, poi salva.' },
        { q: 'Come navigare tra le settimane?', a: 'Usa le frecce ← → in alto nel calendario per spostarti tra le settimane.' },
        { q: 'Come vedere i turni per emporio?', a: 'Usa il filtro emporio in alto per visualizzare solo i turni dell\'emporio selezionato.' },
      ]
    },
    preordini: {
      title: 'Guida — Preordini',
      voci: [
        { q: 'Come creare un preordine?', a: 'Clicca "Nuovo Preordine", inserisci i prodotti con le quantità desiderate e conferma.' },
        { q: 'Come aggiornare le quantità?', a: 'Apri il preordine dalla lista, modifica le quantità nei campi e clicca "Salva modifiche".' },
      ]
    },
    info: {
      title: 'Guida — Info & Messaggi',
      voci: [
        { q: 'Come inviare un messaggio agli operatori?', a: 'Scrivi il messaggio nel campo di testo in fondo alla pagina e clicca "Invia". Tutti gli operatori potranno leggerlo.' },
        { q: 'Come vedere i messaggi precedenti?', a: 'Scorri verso l\'alto per vedere la cronologia dei messaggi. I messaggi più recenti sono in fondo.' },
      ]
    },
    prenotazioni: {
      title: 'Guida — Prenotazioni',
      voci: [
        { q: 'Come creare una prenotazione?', a: 'Clicca "Nuova Prenotazione", inserisci il cliente, la data e l\'orario e salva.' },
        { q: 'Come annullare una prenotazione?', a: 'Apri la prenotazione dalla lista e usa il pulsante "Annulla prenotazione".' },
      ]
    },
  };

  function getGuideStyles() {
    return `
      .m361g-item { border-bottom:1px solid #f1f5f9;cursor:pointer;user-select:none; }
      .m361g-item:last-child { border-bottom:none; }
      .m361g-q { display:flex;justify-content:space-between;align-items:flex-start;gap:8px;padding:12px 4px;font-size:13px;font-weight:600;color:#334155;line-height:1.4; }
      .m361g-q span { flex:1; }
      .m361g-ico { font-size:10px;margin-top:3px;flex-shrink:0;transition:transform .2s;color:#94a3b8; }
      .m361g-a { display:none;padding:0 4px 12px;font-size:13px;color:#64748b;line-height:1.6; }
      .m361g-item.m361g-open .m361g-a { display:block; }
      .m361g-item.m361g-open .m361g-ico { transform:rotate(180deg); }
      .m361g-item:hover .m361g-q { color:#B5453A; }
    `;
  }

  function buildGuideDrawer(section, guide) {
    const existing = document.getElementById('m361-guide-drawer');
    if (existing) return;

    const vociHtml = guide.voci.map(v => `
      <div class="m361g-item" onclick="this.classList.toggle('m361g-open')">
        <div class="m361g-q"><span>${v.q}</span><i class="fas fa-chevron-down m361g-ico"></i></div>
        <div class="m361g-a">${v.a}</div>
      </div>`).join('');

    const drawer = document.createElement('div');
    drawer.id = 'm361-guide-drawer';
    drawer.innerHTML = `
      <div id="m361-guide-overlay"
           onclick="window.__m361ToggleGuida&&window.__m361ToggleGuida()"
           style="position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9998;display:none"></div>
      <div id="m361-guide-panel"
           style="position:fixed;top:56px;right:0;bottom:60px;width:340px;max-width:92vw;background:#fff;z-index:9999;
                  transform:translateX(100%);transition:transform .25s cubic-bezier(.4,0,.2,1);overflow-y:auto;
                  box-shadow:-4px 0 24px rgba(0,0,0,.14);display:flex;flex-direction:column">
        <div style="padding:14px 18px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;
                    align-items:center;background:#fff;position:sticky;top:0;z-index:1">
          <span style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;color:#1e293b">${guide.title}</span>
          <button onclick="window.__m361ToggleGuida&&window.__m361ToggleGuida()"
                  style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:16px;padding:4px 6px;line-height:1;border-radius:6px;transition:color .15s"
                  onmouseenter="this.style.color='#B5453A'" onmouseleave="this.style.color='#94a3b8'">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div style="padding:8px 14px;flex:1">${vociHtml}</div>
        <div style="padding:10px 16px;border-top:1px solid #f1f5f9;font-size:10px;color:#94a3b8;text-align:center">
          Assistenza: <a href="mailto:amministrazione@meridiano361.it" style="color:#B5453A;text-decoration:none">amministrazione@meridiano361.it</a>
        </div>
      </div>`;
    document.body.appendChild(drawer);

    if (!document.getElementById('m361-guide-styles')) {
      const st = document.createElement('style');
      st.id = 'm361-guide-styles';
      st.textContent = getGuideStyles();
      document.head.appendChild(st);
    }
  }

  let guideOpen = false;

  window.__m361ToggleGuida = function () {
    const section = window.PAGE_SECTION;
    if (!section || !GUIDE[section]) return;

    buildGuideDrawer(section, GUIDE[section]);
    guideOpen = !guideOpen;

    const panel = document.getElementById('m361-guide-panel');
    const overlay = document.getElementById('m361-guide-overlay');
    if (panel) panel.style.transform = guideOpen ? 'translateX(0)' : 'translateX(100%)';
    if (overlay) overlay.style.display = guideOpen ? 'block' : 'none';
  };

  function init() {
    const section = window.PAGE_SECTION;
    if (!section || !GUIDE[section]) return;
    buildGuideDrawer(section, GUIDE[section]);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
