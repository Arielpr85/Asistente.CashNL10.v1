// js/visor-rangos.js

const RANKS = ["A","K","Q","J","T","9","8","7","6","5","4","3","2"];

// 13x13: arriba = suited, diagonal = pairs, abajo = offsuit
function handCode(r1, r2, i, j){
  if (i === j) return r1 + r2;           // pair
  if (i < j)  return r1 + r2 + "s";      // suited
  return r2 + r1 + "o";                 // offsuit (nota: invertimos para formato alto-bajo)
}

// Para que abajo quede "AKo" (no "KAo"):
function handCodeFixed(r1, r2, i, j){
  if (i === j) return r1 + r2;
  const hi = RANKS[Math.min(i,j)];
  const lo = RANKS[Math.max(i,j)];
  const suited = (i < j);
  return suited ? (hi+lo+"s") : (hi+lo+"o");
}

function buildGrid(container, actionResolver){
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "range-grid";

  for (let i=0;i<13;i++){
    for (let j=0;j<13;j++){
      const r1 = RANKS[i];
      const r2 = RANKS[j];
      const code = handCodeFixed(r1, r2, i, j);

      const cell = document.createElement("div");
      cell.className = "range-cell";
      cell.textContent = code;

      const action = actionResolver(code, i, j); // "open" | "call" | "3bet" | "4bet" | "fold"
      if (action === "open") cell.classList.add("action-open");
      if (action === "call") cell.classList.add("action-call");
      if (action === "3bet") cell.classList.add("action-3bet");
      if (action === "4bet") cell.classList.add("action-4bet");
      if (action === "fold") cell.classList.add("action-fold");

      grid.appendChild(cell);
    }
  }
  container.appendChild(grid);
}

function getRangesData(){
  // 1) intenta leer lo editado por el editor
  const raw = localStorage.getItem("RANGES_NL5_9MAX_JSON"); // <- si tu key es otra, la cambiamos acá
  if (raw) {
    try { return JSON.parse(raw); } catch(e){}
  }

  // 2) fallback: pegá tu json en un archivo y lo fetchamos (si hosteás)
  return window.__RANGES__ || null;
}

function arrSet(arr){ return new Set(Array.isArray(arr) ? arr : []); }

function getVsBlock(container, key, fallbackKey = "default") {
  if (!container) return null;
  return container[key] || container[fallbackKey] || null;
}

function renderAllForPos(data, pos, vsOpenPos, vs3betPos){
  const posNode = data?.positions?.[pos];
  document.getElementById("posTitle").textContent = pos ? pos : "—";
  if (!posNode) return;

  // FIRST IN
  const fi = posNode.firstIn || {};
  const fiOpen = arrSet(fi.openRaise);
  const fiLimp = arrSet(fi.openLimp);

  buildGrid(document.getElementById("gridFirstIn"), (hand)=>{
    if (fiOpen.has(hand)) return "open";
    if (fiLimp.has(hand)) return "call";
    return "fold";
  });

  // OVERLIMP / ISO
  const ol = posNode.overLimp || {};
  const olIso = arrSet(ol.isoRaise);
  const olOL  = arrSet(ol.overLimp);

  buildGrid(document.getElementById("gridOverlimp"), (hand)=>{
    if (olIso.has(hand)) return "3bet";   // usamos verde para Iso (como en tu leyenda)
    if (olOL.has(hand))  return "call";   // overlimp = call
    return "fold";
  });

  // VS OPEN (default)
  const voKey = vsOpenPos || "default";
  const vo = getVsBlock(posNode.vsOpen, voKey) || { call:[], threeBet:[] };
  const voCall = arrSet(vo.call);
  const vo3b   = arrSet(vo.threeBet);

  buildGrid(document.getElementById("gridVsOpen"), (hand)=>{
    if (vo3b.has(hand)) return "3bet";
    if (voCall.has(hand)) return "call";
    return "fold";
  });

  // VS 3BET (default)
  const v3Key = vs3betPos || "default";
  const v3 = getVsBlock(posNode.vs3bet, v3Key) || { call:[], fourBet:[] };
  const v3Call = arrSet(v3.call);
  const v34b   = arrSet(v3.fourBet);

  buildGrid(document.getElementById("gridVs3bet"), (hand)=>{
    if (v34b.has(hand)) return "4bet";
    if (v3Call.has(hand)) return "call";
    return "fold";
  });
}

// Init
const data = getRangesData();
const posSelect = document.getElementById("posSelect");
const vsOpenSelect = document.getElementById("vsOpenSelect");
const vs3betSelect = document.getElementById("vs3betSelect");

function renderFromUI() {
  renderAllForPos(data, posSelect.value, vsOpenSelect?.value, vs3betSelect?.value);
}

posSelect.addEventListener("change", renderFromUI);
vsOpenSelect?.addEventListener("change", renderFromUI);
vs3betSelect?.addEventListener("change", renderFromUI);

// auto: si querés arrancar en UTG
// posSelect.value = "UTG"; renderAllForPos(data, "UTG");
