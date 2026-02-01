// js/board-classifier.js
// Clasificador FLOP (MVP) => { structure, impact, texture, flags }
// Estructura: SECO | COORDINADO | MONOCOLOR | PAREADO
// Impacto: OFENSIVO | NEUTRO | DEFENSIVO

const RANK_VAL = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function normalizeSuit(s) {
  const x = (s || "").toString().trim();
  if (!x) return "";
  const low = x.toLowerCase();
  if (low === "c" || x === "♣") return "c";
  if (low === "d" || x === "♦") return "d";
  if (low === "h" || x === "♥") return "h";
  if (low === "s" || x === "♠") return "s";
  // si viene raro, devolvemos tal cual (pero consistente en minúscula)
  return low;
}

function toCardObj(card) {
  // Soporta:
  // - {rank:"K", suit:"♣"} o {rank:"K", suit:"c"}
  // - "Kc", "K♣", "10h" (lo normalizamos a T)
  if (!card) return null;

  if (typeof card === "object") {
    const r = (card.rank || "").toString().toUpperCase();
    const s = normalizeSuit(card.suit);
    const rank = r === "10" ? "T" : r;
    return { rank, suit: s };
  }

  const str = card.toString().trim();
  if (!str) return null;

  let rankPart = str.slice(0, -1);
  let suitPart = str.slice(-1);

  rankPart = rankPart.toUpperCase();
  if (rankPart === "10") rankPart = "T";

  return { rank: rankPart, suit: normalizeSuit(suitPart) };
}

function rankVal(r) {
  return RANK_VAL[r] ?? 0;
}

function uniq(arr) {
  return [...new Set(arr)];
}

function computeConnectivity(ranksValsSortedAsc) {
  const a = ranksValsSortedAsc[0];
  const b = ranksValsSortedAsc[1];
  const c = ranksValsSortedAsc[2];

  const gap1 = b - a;
  const gap2 = c - b;
  const span = c - a;

  // adyacencia simple (1-gap en alguna)
  const hasAdjacent = gap1 === 1 || gap2 === 1;

  // “conectividad real” para straights/draws (765, 976, T98, QJT, AQJ, KQJ, etc.)
  const threeClose = span <= 4 && gap1 <= 3 && gap2 <= 3;

  // “semi close” (no tan fuerte, pero hay interacción)
  const semiClose = span <= 6 && gap1 <= 4 && gap2 <= 4;

  return { threeClose, semiClose, span, gap1, gap2, hasAdjacent };
}

function computeHighness(ranksValsSortedAsc) {
  const high = ranksValsSortedAsc[2];
  const mid = ranksValsSortedAsc[1];
  const low = ranksValsSortedAsc[0];

  const hasBroadway = (v) => v >= 11; // J,Q,K,A
  const broadways = [low, mid, high].filter(hasBroadway).length;

  return {
    low,
    mid,
    high,
    broadways,
    isHighHigh: high >= 13, // K/A
    isHigh: high >= 12, // Q+
    isMiddle: high >= 9 && high <= 11, // 9..J
    isLow: high <= 8,
  };
}

export function classifyFlop(flopCards, preflopCtx = null) {
  const cards = (flopCards || []).map(toCardObj).filter(Boolean);
  if (cards.length !== 3) {
    return {
      structure: "UNKNOWN",
      impact: "UNKNOWN",
      texture: "UNKNOWN_UNKNOWN",
      flags: { error: "Need 3 flop cards" },
    };
  }

  const ranks = cards.map((c) => c.rank);
  const suits = cards.map((c) => c.suit);

  const ranksVals = ranks.map(rankVal).sort((a, b) => a - b);
  const uniqRanks = uniq(ranks);
  const uniqSuits = uniq(suits);

  const isPaired = uniqRanks.length < 3; // xxY
  const isTrips = uniqRanks.length === 1; // xxx
  const isMonotone = uniqSuits.length === 1; // 3 del mismo palo
  const isTwoTone = uniqSuits.length === 2; // 2 del mismo palo (FD posible)

  const conn = computeConnectivity(ranksVals);
  const hi = computeHighness(ranksVals);

  // ===== 1) STRUCTURE (prioridad: monotone / paired)
  let structure = "SECO";

  if (isMonotone) {
    structure = "MONOCOLOR";
  } else if (isPaired || isTrips) {
    structure = "PAREADO";
  } else {
    // Acá tu criterio: twotone cuenta como “coordinado” (wet por FD)
    // pero si además hay conectividad real, queda marcado en flags.
    if (conn.threeClose || isTwoTone) structure = "COORDINADO";
    else structure = "SECO";
  }

  // ===== 2) IMPACT
  // OFENSIVO_COORDINADO: boards altos + conectados/broadways → favorecen agresor
  // DEFENSIVO_COORDINADO: boards bajos/medios muy conectados → favorecen caller
  let impact = "NEUTRO";

  if (structure === "COORDINADO") {
    const highCoord = hi.isHigh && hi.broadways >= 2; // Q+ y 2+ broadways
    const veryHighCoord = hi.isHighHigh; // K/A arriba
    const lowCoord = hi.isLow && (conn.threeClose || conn.semiClose);
    const midStrongCoord = hi.isMiddle && conn.threeClose;

    if (veryHighCoord || highCoord) impact = "OFENSIVO";
    else if (lowCoord || midStrongCoord) impact = "DEFENSIVO";
    else impact = "NEUTRO";
  } else {
    // SECO / PAREADO / MONOCOLOR
    const veryHighDry = hi.isHighHigh && structure === "SECO"; // Kxx/Axx seco
    const highDry = hi.isHigh && structure === "SECO"; // Qxx seco
    const lowDry = hi.isLow && structure === "SECO"; // 8-high o menos seco

    if (veryHighDry) impact = "OFENSIVO";
    else if (highDry) impact = "OFENSIVO";
    else if (lowDry) impact = "DEFENSIVO";
    else if (structure === "MONOCOLOR") impact = hi.isLow || hi.isMiddle ? "DEFENSIVO" : "NEUTRO";
    else if (structure === "PAREADO" && hi.isHigh) impact = "OFENSIVO";
    else impact = "NEUTRO";
  }

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
      wetFlush: isTwoTone || isMonotone, // útil para debug/ajustes futuros
      connectivity: conn,
      highness: hi,
      ipState,
    },
  };
}

