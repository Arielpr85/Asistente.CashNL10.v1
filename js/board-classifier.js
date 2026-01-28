// js/board-classifier.js
// Clasificador FLOP (MVP) => { structure, impact, texture, flags }
// Estructura: SECO | COORDINADO | MONOCOLOR | PAREADO
// Impacto: OFENSIVO | NEUTRO | DEFENSIVO

const RANK_VAL = {
  "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9,
  "T": 10, "J": 11, "Q": 12, "K": 13, "A": 14
};

function toCardObj(card) {
  // Soporta:
  // - {rank:"K", suit:"♣"} o {rank:"K", suit:"c"}
  // - "Kc", "K♣", "10h" (lo normalizamos a T)
  if (!card) return null;

  if (typeof card === "object") {
    const r = (card.rank || "").toString().toUpperCase();
    const s = (card.suit || "").toString();
    const rank = r === "10" ? "T" : r;
    return { rank, suit: s };
  }

  const str = card.toString().trim();
  if (!str) return null;

  // rank puede ser "10" o "T" o letra/número
  let rankPart = str.slice(0, -1);
  let suitPart = str.slice(-1);

  rankPart = rankPart.toUpperCase();
  if (rankPart === "10") rankPart = "T";

  return { rank: rankPart, suit: suitPart };
}

function rankVal(r) {
  return RANK_VAL[r] ?? 0;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function countBy(arr) {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return m;
}

function isWheelDrawPossible(ranksVals) {
  // A-2-3-4-5 posibles en boards bajos con A presente o cerca
  // (MVP: no lo usamos fuerte todavía, pero queda para mejorar)
  return ranksVals.includes(14) && (ranksVals.includes(2) || ranksVals.includes(3) || ranksVals.includes(4) || ranksVals.includes(5));
}

function computeConnectivity(ranksValsSortedAsc) {
  const a = ranksValsSortedAsc[0];
  const b = ranksValsSortedAsc[1];
  const c = ranksValsSortedAsc[2];

  const gap1 = b - a;
  const gap2 = c - b;
  const span = c - a;

  // NUEVO: hay dos cartas consecutivas (QJ, JT, 98, etc.)
  const hasAdjacent = (gap1 === 1) || (gap2 === 1);

  const strong = span <= 4 || ((gap1 <= 2) && (gap2 <= 2));
  const medium = span <= 6;

  return { strong, medium, span, gap1, gap2, hasAdjacent };
}


function computeHighness(ranksValsSortedAsc) {
  const high = ranksValsSortedAsc[2];
  const mid = ranksValsSortedAsc[1];
  const low = ranksValsSortedAsc[0];

  const hasA = high === 14 || mid === 14 || low === 14;
  const hasBroadway = (v) => v >= 11; // J,Q,K,A
  const broadways = [low, mid, high].filter(hasBroadway).length;

  return {
    high,
    broadways,
    hasA,
    isHighHigh: high >= 13,      // K/A
    isHigh: high >= 12,          // Q+
    isMiddle: high >= 9 && high <= 11, // 9..J
    isLow: high <= 8
  };
}

export function classifyFlop(flopCards, preflopCtx = null) {
  // flopCards: array de 3 cartas
  const cards = (flopCards || []).map(toCardObj).filter(Boolean);
  if (cards.length !== 3) {
    return {
      structure: "UNKNOWN",
      impact: "UNKNOWN",
      texture: "UNKNOWN_UNKNOWN",
      flags: { error: "Need 3 flop cards" }
    };
  }

  const ranks = cards.map(c => c.rank);
  const suits = cards.map(c => c.suit);

  const ranksVals = ranks.map(rankVal).sort((a, b) => a - b);
  const uniqRanks = uniq(ranks);
  const uniqSuits = uniq(suits);

  const rankCounts = countBy(ranks);
  const isPaired = uniqRanks.length < 3;        // xxY
  const isTrips = uniqRanks.length === 1;       // xxx (raro, pero posible)
  const isMonotone = uniqSuits.length === 1;    // 3 del mismo palo
  const isTwoTone = uniqSuits.length === 2;     // 2 del mismo palo (FD posible)

  const conn = computeConnectivity(ranksVals);
  const hi = computeHighness(ranksVals);

  // ===== 1) STRUCTURE (prioridad: monotone / paired)
  let structure = "SECO";

  if (isMonotone) structure = "MONOCOLOR";
else if (isPaired || isTrips) structure = "PAREADO";
else {
  // NUEVO: si hay 2+ broadways y al menos una adyacencia (QJ, JT, KQ, etc.)
  const broadwayAdj = (hi.broadways >= 2) && conn.hasAdjacent;

  if (isTwoTone || conn.strong || conn.medium || broadwayAdj) structure = "COORDINADO";
  else structure = "SECO";
}

  // ===== 2) IMPACT (heurística ajustada para que exista OFENSIVO_COORDINADO)
  // OFENSIVO_COORDINADO: boards altos + coordinados (broadways) => favorecen agresor
  // DEFENSIVO_COORDINADO: boards bajos/medios muy conectados => favorecen caller
  let impact = "NEUTRO";

  // Helpers (ya existen hi y conn arriba)
  const isHighCoord = (structure === "COORDINADO" && hi.isHigh && hi.broadways >= 2); // Q+ y 2+ broadways
  const isVeryHighCoord = (structure === "COORDINADO" && hi.isHighHigh);              // K/A arriba
  const isLowCoord = (structure === "COORDINADO" && hi.isLow);
  const isMidStrongCoord = (structure === "COORDINADO" && hi.isMiddle && conn.strong);

  if (structure === "COORDINADO") {
    if (isVeryHighCoord || isHighCoord) impact = "OFENSIVO";
    else if (isLowCoord || isMidStrongCoord) impact = "DEFENSIVO";
    else impact = "NEUTRO";
  } else {
    // ===== lógica anterior para SECO / PAREADO / MONOCOLOR
    const danger = (
      structure === "MONOCOLOR" ||
      structure === "COORDINADO" ||
      (structure === "PAREADO" && !hi.isHigh)
    );

    const veryHighDry = (hi.isHighHigh && structure === "SECO"); // Kxx/Axx seco
    const highDry = (hi.isHigh && structure === "SECO");         // Qxx seco

    const lowAndConnected = (hi.isLow && (structure === "COORDINADO" || structure === "MONOCOLOR"));
    const middleConnected = (hi.isMiddle && (structure === "COORDINADO" || structure === "MONOCOLOR"));

    if (veryHighDry) impact = "OFENSIVO";
    else if (highDry && !danger) impact = "OFENSIVO";
    else if (lowAndConnected) impact = "DEFENSIVO";
    else if (middleConnected && conn.strong) impact = "DEFENSIVO";
    else if (structure === "PAREADO" && hi.isHigh) impact = "OFENSIVO";
    else impact = "NEUTRO";
  }

  // (Opcional) si querés incorporar iniciativa / IP-OOP más adelante:
  // por ahora solo lo dejamos como flag para debug.
  const ipState = preflopCtx?.ipState || "UNKNOWN";

  const texture = `${impact}_${structure}`;

  return {
    structure,
    impact,
    texture,
    flags: {
      isPaired,
      isTrips,
      isMonotone,
      isTwoTone,
      connectivity: conn,
      highness: hi,
      ipState
    }
  };
}
