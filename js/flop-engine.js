// js/flop-engine.js
// Motor FLOP (HU) - MVP
// - Usa classifyFlop() para texture (OFENSIVO/NEUTRO/DEFENSIVO + SECO/COORDINADO/MONOCOLOR/PAREADO)
// - Usa PREFLOP_CTX para initiative + ipState (IP/OOP)
// - Devuelve una recomendación simple y consistente (sin "CHECK/CALL")

import { classifyFlop } from "./board-classifier.js";

/** Determina si HERO tiene iniciativa por la acción preflop */
export function hasInitiative(preflopCtx) {
  // En tu visor preflop: action suele ser "open" | "3bet" | "4bet" | "call"
  const a = (preflopCtx?.action || "").toLowerCase();
  return a === "open" || a === "3bet" || a === "4bet";
}

/** Normaliza ipState */
function getIpState(preflopCtx) {
  const ip = (preflopCtx?.ipState || "UNKNOWN").toUpperCase();
  if (ip === "IP" || ip === "OOP") return ip;
  return "UNKNOWN";
}

/** Acción estándar */
function out(action, note = "") {
  return { street: "FLOP", action, note };
}

/**
 * ctx esperado:
 * {
 *   heroCards: [ {rank,suit} | "As" | ... ],
 *   boardCards: [3 cartas flop],
 *   preflopCtx: { pos, hand, action, scenario, ipState }
 * }
 */
export function decideFlopAction(ctx) {
  const preflopCtx = ctx?.preflopCtx || null;
  const heroCards = ctx?.heroCards || [];
  const boardCards = ctx?.boardCards || [];

  // Clasificación del flop
  const flopInfo = classifyFlop(boardCards, preflopCtx);
  const texture = flopInfo.texture; // ej: "OFENSIVO_SECO"

  const ipState = getIpState(preflopCtx);
  const ini = hasInitiative(preflopCtx);

  // Reglas MVP HU:
  // - Si tengo iniciativa e IP: cbet más frecuente
  // - Si tengo iniciativa y OOP: más check, salvo boards muy favorables
  // - Si NO tengo iniciativa: IP tiende a check back; OOP check (y listo)
  //
  // (Luego le sumamos hand tiers para selectividad real)

  // 0) Sin iniciativa => simplificamos
  if (!ini) {
    if (ipState === "IP")
      return out(
        "CHECK",
        `Sin iniciativa (IP) · ${texture} · check back (MVP)`,
      );
    return out("CHECK", `Sin iniciativa (OOP) · ${texture} · check (MVP)`);
  }

  // 1) Con iniciativa (soy agresor preflop)
  // --- OFENSIVO_SECO (A/K/Q altos secos) => cbet chica casi range si IP
  if (texture === "OFENSIVO_SECO") {
    if (ipState === "IP")
      return out("BET 33%", `Ini+IP · ${texture} · cbet chico rango (MVP)`);
    // OOP: check bastante, pero en seco alto podemos apostar chico también (opcional)
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP, simplificado)`);
  }

  // --- OFENSIVO_PAREADO (K K x / Q Q x...) => cbet chica bastante
  if (texture === "OFENSIVO_PAREADO") {
    if (ipState === "IP")
      return out(
        "BET 33%",
        `Ini+IP · ${texture} · paired alto, cbet chico (MVP)`,
      );
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP)`);
  }

  // --- NEUTRO_SECO => IP mezcla, MVP: bet 33 si IP, check si OOP
  if (texture === "NEUTRO_SECO") {
    if (ipState === "IP")
      return out("BET 33%", `Ini+IP · ${texture} · cbet chico (MVP)`);
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP)`);
  }

  // --- NEUTRO_COORDINADO => apostar más grande/menos frecuente. MVP: IP bet 50
  if (texture === "NEUTRO_COORDINADO") {
    if (ipState === "IP")
      return out("BET 50%", `Ini+IP · ${texture} · cbet mediano (MVP)`);
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP)`);
  }

  // --- OFENSIVO_COORDINADO => sigue siendo buen board para agresor, pero hay draws
  // MVP: IP bet 50
  // --- OFENSIVO_COORDINADO => board alto + draws, seguimos presionando fuerte
  // Base estrategia: BET 75% (IP)
  if (texture === "OFENSIVO_COORDINADO") {
    if (ipState === "IP")
      return out("BET 75%", `Ini+IP · ${texture} · apostar grande (base)`);
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP)`);
  }

  // --- MONOCOLOR (3 del mismo palo) => mucha cautela
  // MVP: IP bet 33 (poco), OOP check
  if (
    texture === "OFENSIVO_MONOCOLOR" ||
    texture === "NEUTRO_MONOCOLOR" ||
    texture === "DEFENSIVO_MONOCOLOR"
  ) {
    if (ipState === "IP")
      return out("BET 33%", `Ini+IP · ${texture} · monotono, bet chico (MVP)`);
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP)`);
  }

  // --- DEFENSIVO_* => favorece defensa/rango caller, más check
  if (texture.startsWith("DEFENSIVO_")) {
    if (ipState === "IP")
      return out("CHECK", `Ini+IP · ${texture} · check back (MVP)`);
    return out("CHECK", `Ini+OOP · ${texture} · check (MVP)`);
  }

  // Fallback
  if (ipState === "IP")
    return out("BET 33%", `Ini+IP · ${texture} · fallback bet chico (MVP)`);
  return out("CHECK", `Ini+OOP · ${texture} · fallback check (MVP)`);
}
