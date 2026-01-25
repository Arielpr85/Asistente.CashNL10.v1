// js/visor-rangos.js
import { APP } from "./config.js";

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

function handCodeFixed(i, j) {
  if (i === j) return RANKS[i] + RANKS[j];
  const hi = RANKS[Math.min(i, j)];
  const lo = RANKS[Math.max(i, j)];
  const suited = i < j;
  return suited ? hi + lo + "s" : hi + lo + "o";
}

/**
 * Crea una grilla 13x13 con clases CSS action-*
 * @param {HTMLElement} container
 * @param {(hand:string)=>("open"|"call"|"3bet"|"4bet"|"fold")} actionResolver
 * @param {Object} labelMap - texto a mostrar en cell-act por acción (opcional)
 */
function buildGrid(container, actionResolver, labelMap = {}) {
  container.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.className = "grid-wrap";

  const grid = document.createElement("div");
  grid.className = "range-grid";

  const defaultLabels = {
    open: "OR",
    call: "CALL",
    "3bet": "3B",
    "4bet": "4B",
    fold: "",
  };

  const labels = { ...defaultLabels, ...labelMap };

  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const code = handCodeFixed(i, j);

      const cell = document.createElement("div");
      cell.className = "range-cell";

      const handEl = document.createElement("div");
      handEl.className = "cell-hand";
      handEl.textContent = code;

      const actEl = document.createElement("div");
      actEl.className = "cell-act";

      let action = actionResolver(code);

      // Normalización fuerte (evita valores raros)
      if (
        action !== "open" &&
        action !== "call" &&
        action !== "3bet" &&
        action !== "4bet" &&
        action !== "fold"
      ) {
        action = "fold";
      }

      // Texto + clase SIEMPRE (incluye fold)
      actEl.textContent = labels[action] ?? "";
      cell.classList.add(`action-${action}`);

      cell.appendChild(handEl);
      cell.appendChild(actEl);
      grid.appendChild(cell);
    }
  }

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
    { open: "OR", call: "L", fold: "" }
  );

  // OVERLIMP / ISO
  const ol = posNode.overLimp || {};
  const olIso = arrSet(ol.isoRaise);
  const olOL = arrSet(ol.overLimp);

  buildGrid(
    document.getElementById("gridOverlimp"),
    (hand) => {
      if (olIso.has(hand)) return "3bet"; // visual ISO
      if (olOL.has(hand)) return "call";
      return "fold";
    },
    { "3bet": "ISO", call: "L", fold: "" }
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
    { "3bet": "3B", call: "C", fold: "" }
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
    { "4bet": "4B", call: "C", fold: "" }
  );
}

(async function init() {
  const data = await loadJson(APP.rangesUrl);

  const posSelect = document.getElementById("posSelect");

  function render() {
    renderAllForPos(data, posSelect.value);
  }

  posSelect.addEventListener("change", render);

  if (posSelect.value) render();
})();


