// js/visor-rangos.js
import { APP } from "./config.js";

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

let selectedCellEl = null;
let PREFLOP_CTX = null;

// Para que lo puedas usar desde otros módulos después:
window.PREFLOP_CTX = null;

const PREFLOP_STORAGE_KEY = "PREFLOP_CTX";

function handCodeFixed(i, j) {
  if (i === j) return RANKS[i] + RANKS[j];
  const hi = RANKS[Math.min(i, j)];
  const lo = RANKS[Math.max(i, j)];
  const suited = i < j;
  return suited ? hi + lo + "s" : hi + lo + "o";
}

function guessIpState(heroPos, scenario) {
  // Heurística simple (no perfecta)
  if (heroPos === "BTN") return "IP";
  if (heroPos === "SB") return "OOP";
  if (heroPos === "BB") return "UNKNOWN";
  return "UNKNOWN";
}

function buildGrid(container, actionResolver, meta) {
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "range-grid";

  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const code = handCodeFixed(i, j);

      const cell = document.createElement("div");
      cell.className = "range-cell";
      cell.innerHTML = `
        <div class="cell-hand">${code}</div>
        <div class="cell-act"></div>
      `;

      const action = actionResolver(code);

      const actEl = cell.querySelector(".cell-act");
      if (action === "open") actEl.textContent = "OR";
      else if (action === "call") actEl.textContent = "CALL";
      else if (action === "3bet") actEl.textContent = "3B";
      else if (action === "4bet") actEl.textContent = "4B";
      else actEl.textContent = "";

      if (action) cell.classList.add(`action-${action}`);

      // ✅ SOLO manos jugables seleccionables (no fold)
      if (action === "fold") {
        cell.classList.add("is-disabled");
      } else {
        cell.style.cursor = "pointer";
        cell.addEventListener("click", () => {
          // limpiar selección previa
          if (selectedCellEl) selectedCellEl.classList.remove("is-selected");
          selectedCellEl = cell;
          cell.classList.add("is-selected");

          PREFLOP_CTX = {
            pos: meta.pos,
            hand: code,
            action,
            scenario: meta.scenario,
            ipState: guessIpState(meta.pos, meta.scenario),
          };

          window.PREFLOP_CTX = PREFLOP_CTX;

          // ✅ Persistir para Postflop / reload
          localStorage.setItem(PREFLOP_STORAGE_KEY, JSON.stringify(PREFLOP_CTX));

          document.dispatchEvent(new CustomEvent("PREFLOP_CTX_UPDATED", { detail: PREFLOP_CTX }));

          console.log("PREFLOP_CTX", PREFLOP_CTX);
        });
      }

      grid.appendChild(cell);
    }
  }

  const wrap = document.createElement("div");
  wrap.className = "grid-wrap";
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

function arrSet(arr) {
  return new Set(Array.isArray(arr) ? arr : []);
}

async function loadJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
  return await res.json();
}

function renderAllForPos(data, pos) {
  const posNode = data?.positions?.[pos];
  document.getElementById("posTitle").textContent = pos || "—";
  if (!posNode) return;

  // FIRST IN
  const fi = posNode.firstIn || {};
  const fiOpen = arrSet(fi.openRaise);
  const fiLimp = arrSet(fi.openLimp);

  buildGrid(
    document.getElementById("gridFirstIn"),
    (hand) => {
      if (fiOpen.has(hand)) return "open";
      if (fiLimp.has(hand)) return "call";
      return "fold";
    },
    { pos, scenario: "FIRST_IN" }
  );

  // OVERLIMP / ISO
  const ol = posNode.overLimp || {};
  const olIso = arrSet(ol.isoRaise);
  const olOL = arrSet(ol.overLimp);

  buildGrid(
    document.getElementById("gridOverlimp"),
    (hand) => {
      if (olIso.has(hand)) return "3bet";
      if (olOL.has(hand)) return "call";
      return "fold";
    },
    { pos, scenario: "OVERLIMP_ISO" }
  );

  // VS OPEN
  const vo = posNode.vsOpen?.default || { call: [], threeBet: [] };
  const voCall = arrSet(vo.call);
  const vo3b = arrSet(vo.threeBet);

  buildGrid(
    document.getElementById("gridVsOpen"),
    (hand) => {
      if (vo3b.has(hand)) return "3bet";
      if (voCall.has(hand)) return "call";
      return "fold";
    },
    { pos, scenario: "VS_OPEN" }
  );

  // VS 3BET
  const v3 = posNode.vs3bet?.default || { call: [], fourBet: [] };
  const v3Call = arrSet(v3.call);
  const v34b = arrSet(v3.fourBet);

  buildGrid(
    document.getElementById("gridVs3bet"),
    (hand) => {
      if (v34b.has(hand)) return "4bet";
      if (v3Call.has(hand)) return "call";
      return "fold";
    },
    { pos, scenario: "VS_3BET" }
  );
}

function clearSelection() {
  if (selectedCellEl) selectedCellEl.classList.remove("is-selected");
  selectedCellEl = null;
  PREFLOP_CTX = null;
  window.PREFLOP_CTX = null;

  // ✅ limpiar persistencia
  localStorage.removeItem(PREFLOP_STORAGE_KEY);
  document.dispatchEvent(new CustomEvent("PREFLOP_CTX_UPDATED", { detail: null }));
  console.log("PREFLOP_CTX", null);
}

function loadStoredPreflopCtx() {
  try {
    const raw = localStorage.getItem(PREFLOP_STORAGE_KEY);
    if (!raw) return null;
    const ctx = JSON.parse(raw);
    return ctx && typeof ctx === "object" ? ctx : null;
  } catch {
    return null;
  }
}

(async function init() {
  const data = await loadJson(APP.rangesUrl);

  const posSelect = document.getElementById("posSelect");
  const clearBtn = document.getElementById("clearPick");

  // ✅ Cargar última selección (si existe)
  const stored = loadStoredPreflopCtx();
  if (stored) {
    window.PREFLOP_CTX = stored;
    PREFLOP_CTX = stored;
    console.log("PREFLOP_CTX (restored)", stored);
  }

  function render() {
    renderAllForPos(data, posSelect.value);
  }

  posSelect.addEventListener("change", () => {
    // cuando cambiás de posición, por consistencia limpiamos selección actual
    clearSelection();
    render();
  });

  clearBtn?.addEventListener("click", () => {
    clearSelection();
  });

  if (posSelect.value) render();
})();


