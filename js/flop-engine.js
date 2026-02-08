// js/flop-engine.js
// Motor FLOP (HU) - Refactor: el engine arma contexto y delega la acción al coaching.
// - Usa classifyFlop() para texture
// - Usa evaluator + adapters para handCat + intent
// - Usa coaching-registry para decidir acción

import { classifyFlop } from "./board-classifier.js";
import { pickCoaching } from "./coaching/coaching-registry.js";

import { evaluateHeroHandFlop } from "./hand-evaluator-flop.js";
import { adaptHandCatFromEval } from "./coaching/handcat-adapter.js";
import { toIntent } from "./coaching/intent-adapter.js";

/** Determina si HERO tiene iniciativa por la acción preflop */
export function hasInitiative(preflopCtx) {
  const a = (preflopCtx?.action || "").toLowerCase();
  return a === "open" || a === "3bet" || a === "4bet";
}

/** Normaliza ipState */
function getIpState(preflopCtx) {
  const ip = (preflopCtx?.ipState || "UNKNOWN").toUpperCase();
  if (ip === "IP" || ip === "OOP") return ip;
  return "UNKNOWN";
}

function out(rec) {
  return {
    street: "FLOP",
    action: rec.action,
    note: rec.note,
    // extra debug útil (no rompe nada si la UI no lo usa)
    texture: rec.texture,
    spot: rec.spot,
    ipState: rec.ipState,
    ini: rec.ini,
  };
}

function safeEvalHandCat(heroCards, boardCards) {
  try {
    const ev = evaluateHeroHandFlop(heroCards, boardCards);
    return adaptHandCatFromEval(ev);
  } catch {
    return null;
  }
}

export function decideFlopAction(ctx) {
  const preflopCtx = ctx?.preflopCtx || null;
  const heroCards = ctx?.heroCards || [];
  const boardCards = ctx?.boardCards || [];

  const ipState = getIpState(preflopCtx);
  const ini = hasInitiative(preflopCtx);

  // si faltan datos, fallback seguro
  if (!boardCards || boardCards.length !== 3) {
    return out({
      action: "CHECK",
      note: "FLOP inválido · faltan cartas",
      texture: "UNKNOWN_UNKNOWN",
      spot: "UNK_UNKNOWN_UNKNOWN",
      ipState,
      ini,
    });
  }

  const flopInfo = classifyFlop(boardCards, preflopCtx);
  const texture = flopInfo.texture; // ej: "DEFENSIVO_SECO"

  const posTag = ipState === "IP" ? "IP" : ipState === "OOP" ? "OOP" : "UNK";
  const spot = `${posTag}_${texture}`; // ej: "IP_DEFENSIVO_SECO"

  // sin iniciativa: por ahora simplificamos (MVP)
  if (!ini) {
    const note =
      ipState === "IP"
        ? `Sin iniciativa (IP) · ${texture} · check back (MVP) · ${spot}`
        : `Sin iniciativa (OOP) · ${texture} · check (MVP) · ${spot}`;

    return out({
      action: "CHECK",
      note,
      texture,
      spot,
      ipState,
      ini,
    });
  }

  // con iniciativa: calculamos handCat + intent (para DEFENSIVO selectivo)
  const handCat =
    heroCards?.length === 2 && boardCards?.length === 3
      ? safeEvalHandCat(heroCards, boardCards)
      : null;

  const intent = handCat ? toIntent(handCat) : null;

  // rec base que verá el coaching (y la UI)
  const recBase = {
    street: "FLOP",
    texture,
    spot,
    ipState,
    ini,
    handCat,
    intent,
    note: `Ini+${ipState} · ${texture} · ${spot}`,
    action: "CHECK", // default
  };

  // delegación al coaching
  const mod = pickCoaching(recBase);

  if (mod && typeof mod.decideAction === "function") {
    const action = mod.decideAction({
      ipState,
      ini,
      texture,
      spot,
      handCat,
      intent,
      heroCards,
      boardCards,
      preflopCtx,
    });

    return out({
      ...recBase,
      action: action || "CHECK",
      note: `${recBase.note} · action=${action || "CHECK"}`,
    });
  }

  // fallback (para texturas sin módulo todavía)
  // OFENSIVO_* IP: mantenemos comportamiento previo simple
  if (texture === "OFENSIVO_SECO" && ipState === "IP")
    return out({ ...recBase, action: "BET 33%", note: `${recBase.note} · fallback` });

  if (texture === "OFENSIVO_COORDINADO" && ipState === "IP")
    return out({ ...recBase, action: "BET 75%", note: `${recBase.note} · fallback` });

  // resto: check
  return out({ ...recBase, action: "CHECK", note: `${recBase.note} · fallback` });
}
