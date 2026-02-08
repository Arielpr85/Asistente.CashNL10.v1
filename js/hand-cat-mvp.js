// js/hand-cat-mvp.js
function normSuit(x) {
  const s = (x || "").toString().toLowerCase();
  if (s === "s" || s === "♠") return "s";
  if (s === "h" || s === "♥") return "h";
  if (s === "d" || s === "♦") return "d";
  if (s === "c" || s === "♣") return "c";
  return s;
}

function rankOf(card) {
  // soporta objeto {rank,suit} o string "Ah"/"A♥"
  if (!card) return "";
  if (typeof card === "object") return (card.rank || "").toString().toUpperCase();
  const str = card.toString().trim().toUpperCase();
  if (!str) return "";
  const r = str.slice(0, -1);
  return r === "10" ? "T" : r;
}

function suitOf(card) {
  if (!card) return "";
  if (typeof card === "object") return normSuit(card.suit);
  const str = card.toString().trim();
  if (!str) return "";
  return normSuit(str.slice(-1));
}

// MONSTER | TOP_PAIR_GOOD | TOP_PAIR_WEAK | MID_PAIR | DRAW | BACKDOOR | AIR
export function getHandCatMVP(heroCards, boardCards) {
  const rankOrder = "23456789TJQKA";
  const hr = (heroCards || []).map(rankOf);
  const br = (boardCards || []).map(rankOf);
  const hs = (heroCards || []).map(suitOf);
  const bs = (boardCards || []).map(suitOf);

  if (hr.length !== 2 || br.length !== 3) return "AIR";

  const boardSet = new Set(br);
  const heroPairs = hr.filter((r) => boardSet.has(r)).length;
  const isPocketPair = hr[0] === hr[1];

  // Set / trips (pocket pair que aparece en board) o dos pares
  if (isPocketPair && br.includes(hr[0])) return "MONSTER";
  if (heroPairs === 2) return "MONSTER";

  // Pocket pair que NO aparece: overpair / underpair
  if (isPocketPair && !br.includes(hr[0])) {
    const pp = hr[0];
    const maxBoardRank = br.reduce((a, b) =>
      rankOrder.indexOf(a) > rankOrder.indexOf(b) ? a : b
    );

    const ppIdx = rankOrder.indexOf(pp);
    const topIdx = rankOrder.indexOf(maxBoardRank);

    // Si está por arriba de la carta más alta del flop = overpair
    if (ppIdx > topIdx) return "TOP_PAIR_GOOD"; // (si querés, luego lo renombramos a "OVERPAIR")
    return "MID_PAIR"; // underpair / middle pair sin match
  }

  // Top pair (match con carta más alta del flop)
  const maxBoardRank = br.reduce((a, b) =>
    rankOrder.indexOf(a) > rankOrder.indexOf(b) ? a : b
  );

  const hasTopPair = hr.includes(maxBoardRank);
  if (hasTopPair) {
    const kicker = hr[0] === maxBoardRank ? hr[1] : hr[0];
    const good = "AKQJT".includes(kicker);
    return good ? "TOP_PAIR_GOOD" : "TOP_PAIR_WEAK";
  }

  // Flush draw / Backdoor
  const suitCounts = {};
  [...hs, ...bs].filter(Boolean).forEach((s) => (suitCounts[s] = (suitCounts[s] || 0) + 1));

  if (Object.values(suitCounts).some((n) => n >= 4)) return "DRAW";
  if (Object.values(suitCounts).some((n) => n === 3)) return "BACKDOOR";

  // Pair con board (pero no top pair ni monster)
  if (heroPairs === 1) return "MID_PAIR";

  return "AIR";
}

// Opcional: debug desde consola
export function exposeHandCatDebug() {
  window.getHandCatMVP = getHandCatMVP;
}
