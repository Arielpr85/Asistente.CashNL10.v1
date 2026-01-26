// js/postflop-runner.js
import { decideFlopAction } from "./flop-engine.js";

const PREFLOP_STORAGE_KEY = "PREFLOP_CTX";

const BLOCK_ON_MISMATCH = true;

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

function normalizeCardStr(s) {
  if (!s) return "";
  let t = s.trim();
  if (!t) return "";

  t = t.replace("10", "T");
  t = t.replace("♠", "s").replace("♣", "c").replace("♥", "h").replace("♦", "d");
  t = t.toUpperCase();

  const rank = t.slice(0, -1);
  const suit = t.slice(-1).toLowerCase();
  return `${rank}${suit}`;
}

function parseCard(cardStr) {
  const n = normalizeCardStr(cardStr);
  if (n.length < 2) return null;
  const rank = n.slice(0, -1).toUpperCase();
  const suit = n.slice(-1).toLowerCase();
  const okRank = "AKQJT98765432".includes(rank);
  const okSuit = "SHDC".includes(suit.toUpperCase()) || "shdc".includes(suit);
  if (!okRank || !"shdc".includes(suit)) return null;
  return { rank, suit, str: `${rank}${suit}` };
}

// handCode: "AJs" | "KTo" | "66"
function handMatchesCards(handCode, c1, c2) {
  if (!handCode) return { ok: false, reason: "missing_hand" };

  const a = parseCard(c1);
  const b = parseCard(c2);
  if (!a || !b) return { ok: false, reason: "invalid_cards" };
  if (a.str === b.str) return { ok: false, reason: "duplicate_card" };

  const h = handCode.trim().toUpperCase();

  // Pares: "66"
  if (h.length === 2 && h[0] === h[1]) {
    const pr = h[0];
    const ok = a.rank === pr && b.rank === pr;
    return ok ? { ok: true } : { ok: false, reason: "pair_mismatch" };
  }

  // Suited/offsuit: "AJs" / "KTo"
  const hi = h[0];
  const lo = h[1];
  const kind = h.slice(-1); // S/O

  const ranksOk =
    (a.rank === hi && b.rank === lo) || (a.rank === lo && b.rank === hi);

  if (!ranksOk) return { ok: false, reason: "ranks_mismatch" };

  const suited = a.suit === b.suit;

  if (kind === "S")
    return suited ? { ok: true } : { ok: false, reason: "needs_suited" };
  if (kind === "O")
    return !suited ? { ok: true } : { ok: false, reason: "needs_offsuit" };

  return { ok: true };
}

function setWarn(msg) {
  const el = document.getElementById("pfWarn");
  if (!el) return;
  if (!msg) {
    el.style.display = "none";
    el.textContent = "";
    return;
  }
  el.style.display = "block";
  el.textContent = msg;
}

function renderCtx(preflopCtx) {
  const pfCtxLabel = document.getElementById("pfCtxLabel");
  const heroHandLabel = document.getElementById("heroHandLabel");

  if (!preflopCtx) {
    if (pfCtxLabel) pfCtxLabel.textContent = "—";
    if (heroHandLabel) heroHandLabel.textContent = "—";
    return;
  }

  const { pos, hand, action, scenario, ipState } = preflopCtx;

  if (pfCtxLabel) {
    pfCtxLabel.textContent = `${pos || "?"} · ${hand || "?"} · ${(action || "").toUpperCase()} · ${scenario || "?"} · ${(ipState || "UNKNOWN").toUpperCase()}`;
  }
  if (heroHandLabel) {
    heroHandLabel.textContent = hand || "—";
  }
}

/* =========================
   ✅ COMBOS (AUTOFILL)
   ========================= */

const SUITS = ["s", "h", "d", "c"];

function makeCard(rank, suit) {
  return `${rank}${suit}`;
}

function parseHandCode(handCode) {
  if (!handCode) return null;
  const h = handCode.trim().toUpperCase();
  if (!h) return null;

  // Pair: "66"
  if (h.length === 2 && h[0] === h[1]) {
    return { type: "PAIR", r1: h[0], r2: h[1] };
  }

  // "AJs" / "KTo"
  const r1 = h[0];
  const r2 = h[1];
  const tag = h.slice(-1); // S/O
  if (!"AKQJT98765432".includes(r1) || !"AKQJT98765432".includes(r2))
    return null;

  if (tag === "S") return { type: "SUITED", r1, r2 };
  if (tag === "O") return { type: "OFFSUIT", r1, r2 };

  // Si alguna vez fuera "AK" sin tag
  return { type: "ANY", r1, r2 };
}

function buildCombosFromHand(handCode) {
  const info = parseHandCode(handCode);
  if (!info) return [];

  const out = [];

  if (info.type === "PAIR") {
    const r = info.r1;
    for (let i = 0; i < SUITS.length; i++) {
      for (let j = i + 1; j < SUITS.length; j++) {
        out.push({ c1: `${r}${SUITS[i]}`, c2: `${r}${SUITS[j]}` });
      }
    }
    return out;
  }

  if (info.type === "SUITED") {
    for (const s of SUITS)
      out.push({ c1: `${info.r1}${s}`, c2: `${info.r2}${s}` });
    return out;
  }

  if (info.type === "OFFSUIT") {
    for (const s1 of SUITS) {
      for (const s2 of SUITS) {
        if (s1 === s2) continue;
        out.push({ c1: `${info.r1}${s1}`, c2: `${info.r2}${s2}` });
      }
    }
    return out;
  }

  // ANY
  for (const s1 of SUITS) {
    for (const s2 of SUITS) {
      const c1 = `${info.r1}${s1}`;
      const c2 = `${info.r2}${s2}`;
      if (c1 === c2) continue;
      out.push({ c1, c2 });
    }
  }
  return out;
}

function setHeroCards(c1, c2) {
  const hero1 = document.getElementById("hero1");
  const hero2 = document.getElementById("hero2");
  if (hero1) hero1.value = c1.toUpperCase();
  if (hero2) hero2.value = c2.toUpperCase();
}

function renderHeroCombos(preflopCtx) {
  const wrap = document.getElementById("heroCombos");
  if (!wrap) return;

  wrap.innerHTML = "";

  if (!preflopCtx?.hand) {
    wrap.innerHTML = `<div class="muted">Seleccioná una mano en el visor para ver combos.</div>`;
    return;
  }

  const used = getBoardBlockSet(); // cartas del flop ya puestas
  const combos = buildCombosFromHand(preflopCtx.hand);

  if (!combos.length) {
    wrap.innerHTML = `<div class="muted">No se pudieron generar combos para: ${preflopCtx.hand}</div>`;
    return;
  }

  const available = combos.filter(
    (c) => !comboConflictsWithBoard(c.c1, c.c2, used),
  );

  // 🎲 Random (solo entre disponibles)
  const btnRnd = document.createElement("button");
  btnRnd.className = "combo-btn";
  btnRnd.textContent = "🎲 Random";
  btnRnd.style.cssText =
    "background:#020617;border:1px solid rgba(148,163,184,.25);color:#e5e7eb;padding:6px 10px;border-radius:10px;cursor:pointer";
  btnRnd.disabled = available.length === 0;

  btnRnd.addEventListener("click", () => {
    if (!available.length) return;
    const pick = available[Math.floor(Math.random() * available.length)];
    setHeroCards(pick.c1, pick.c2);
    setWarn("");
  });

  wrap.appendChild(btnRnd);

  // Botones combos
  for (const c of combos) {
    const disabled = comboConflictsWithBoard(c.c1, c.c2, used);

    const b = document.createElement("button");
    b.className = "combo-btn";
    b.disabled = disabled;

    // label con iconos
    b.innerHTML = `${prettyCardHTML(c.c1)} <span style="opacity:.8">·</span> ${prettyCardHTML(c.c2)}`;

    b.style.cssText =
      "background:#0b1020;border:1px solid rgba(148,163,184,.25);color:#e5e7eb;padding:6px 10px;border-radius:10px;cursor:pointer;font-size:.9rem";

    b.addEventListener("click", () => {
      if (b.disabled) return;

      // revalidar por si el flop cambió justo antes del click
      const usedNow = getBoardBlockSet();
      if (comboConflictsWithBoard(c.c1, c.c2, usedNow)) {
        setWarn(
          "⚠️ Ese combo choca con una carta del flop. Cambiá el flop o elegí otro combo.",
        );
        renderHeroCombos(window.PREFLOP_CTX || loadStoredPreflopCtx());
        return;
      }

      setHeroCards(c.c1, c.c2);
      setWarn("");
    });

    wrap.appendChild(b);
  }

  if (available.length === 0) {
    setWarn(
      "⚠️ Todos los combos de esa mano chocan con alguna carta del flop cargado.",
    );
  }
}

const SUIT_ICON = { s: "♠", h: "♥", d: "♦", c: "♣" };
const SUIT_CLASS = { s: "suit-s", h: "suit-h", d: "suit-d", c: "suit-c" };

function prettyCardHTML(card) {
  // card: "As" / "Qh" / "Td" / etc (rank may be 1 char)
  const n = normalizeCardStr(card); // -> "As" => "As" (en nuestro normalize termina "As" pero suit en minúscula)
  const rank = n.slice(0, -1).toUpperCase();
  const suit = n.slice(-1).toLowerCase();
  const icon = SUIT_ICON[suit] || suit;
  const cls = SUIT_CLASS[suit] || "";
  return `<span>${rank}</span><span class="suit ${cls}">${icon}</span>`;
}

function getBoardBlockSet() {
  const ids = ["flop1", "flop2", "flop3", "turn1", "river1"];
  const used = new Set();

  for (const id of ids) {
    const v = document.getElementById(id)?.value?.trim();
    const c = parseCard(v);
    if (c) used.add(c.str); // "Ks", "9h", etc
  }
  return used;
}

function comboConflictsWithBoard(c1, c2, usedSet) {
  // c1/c2 vienen tipo "As" "Qh" pero ojo: en combos vienen "A" + "s" => "As"
  const a = parseCard(c1);
  const b = parseCard(c2);
  if (!a || !b) return true;
  if (a.str === b.str) return true;
  return usedSet.has(a.str) || usedSet.has(b.str);
}

/* =========================
   FLOP RUNNER
   ========================= */

function getHeroCardsFromInputs() {
  const h1 = document.getElementById("hero1")?.value?.trim();
  const h2 = document.getElementById("hero2")?.value?.trim();
  return [h1, h2];
}

function getFlopFromInputs() {
  const f1 = document.getElementById("flop1")?.value?.trim();
  const f2 = document.getElementById("flop2")?.value?.trim();
  const f3 = document.getElementById("flop3")?.value?.trim();
  return [f1, f2, f3];
}

function renderFlopResult(rec) {
  const out = document.getElementById("flopRec");
  if (!out) return;
  out.innerHTML = `
    <div style="font-weight:800">FLOP: ${rec.action}</div>
    <div style="opacity:.85; font-size:.9rem">${rec.note || ""}</div>
  `;
}

function run() {
  const preflopCtx = window.PREFLOP_CTX || loadStoredPreflopCtx();
  if (preflopCtx) window.PREFLOP_CTX = preflopCtx;

  renderCtx(preflopCtx);
  renderHeroCombos(preflopCtx);
  setWarn("");

  if (!preflopCtx) {
    alert("Primero elegí una mano en el visor (PREFLOP_CTX vacío).");
    return;
  }

  const [h1, h2] = getHeroCardsFromInputs();
  const [f1, f2, f3] = getFlopFromInputs();

  // 🔒 Bloqueo duro: HERO no puede repetir cartas del board
  const used = new Set([f1, f2, f3].map(normalizeCardStr));

  const nh1 = normalizeCardStr(h1);
  const nh2 = normalizeCardStr(h2);

  if (used.has(nh1) || used.has(nh2)) {
    setWarn("⚠️ HERO repite una carta del board. Cambiá Hero o el board.");
    return;
  }

  if (!h1 || !h2) {
    alert("Elegí un combo o cargá 2 cartas de HERO (ej: As Kd).");
    return;
  }
  if (!f1 || !f2 || !f3) {
    alert("Cargá 3 cartas del FLOP (ej: Kc 9h 2s).");
    return;
  }

  const check = handMatchesCards(preflopCtx.hand, h1, h2);
  if (!check.ok) {
    const msg = `⚠️ Las cartas HERO (${h1} ${h2}) no coinciden con la mano seleccionada (${preflopCtx.hand}).`;
    setWarn(msg);
    if (BLOCK_ON_MISMATCH) return;
  }

  const rec = decideFlopAction({
    heroCards: [h1, h2],
    boardCards: [f1, f2, f3],
    preflopCtx,
  });

  console.log("FLOP_REC", rec);
  renderFlopResult(rec);
}

(function init() {
  const ctx = window.PREFLOP_CTX || loadStoredPreflopCtx();
  if (ctx) window.PREFLOP_CTX = ctx;

  renderCtx(ctx);
  renderHeroCombos(ctx);
  setWarn("");
  ["flop1", "flop2", "flop3", "turn1", "river1"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", () => {
      const ctx = window.PREFLOP_CTX || loadStoredPreflopCtx();
      renderHeroCombos(ctx);
    });
  });

  document.getElementById("btnCalcFlop")?.addEventListener("click", run);

  // ✅ cuando elegís otra celda en el grid, refresca leyenda + combos al instante
  document.addEventListener("PREFLOP_CTX_UPDATED", (e) => {
    const newCtx = e.detail || null;
    window.PREFLOP_CTX = newCtx;
    renderCtx(newCtx);
    renderHeroCombos(newCtx);
    setWarn("");
  });
})();
