// js/postflop-legend.js

import { APP } from "./config.js";

async function loadJson(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`No se pudo cargar ${url}`);
  return await res.json();
}

function fillSelect(sel, values, placeholder = "— Elegí —") {
  sel.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = placeholder;
  sel.appendChild(opt0);

  values.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    sel.appendChild(opt);
  });
}

function renderRule(outEl, rule) {
  if (!rule) {
    outEl.innerHTML = `<div class="muted">No hay regla cargada todavía para esta combinación.</div>`;
    return;
  }

  const bullets = Array.isArray(rule.bullets) ? rule.bullets : [];
  outEl.innerHTML = `
    <div class="pf-title">${rule.title || "Leyenda"}</div>
    <div class="pf-line"><strong>Línea:</strong> ${rule.line || "—"}</div>
    ${bullets.length ? `<ul class="pf-bullets">${bullets.map(b => `<li>${b}</li>`).join("")}</ul>` : ""}
  `;
}

(async function init() {
  const data = await loadJson(APP.postflopUrl);

  const selBoard = document.getElementById("pfBoardType");
  const selTier = document.getElementById("pfHandTier");
  const out = document.getElementById("pfOutput");

  fillSelect(selBoard, data.boardTypes || []);
  fillSelect(selTier, data.handTiers || []);

  function update() {
    const bt = selBoard.value;
    const ht = selTier.value;
    if (!bt || !ht) {
      out.innerHTML = `<div class="muted">Seleccioná boardType y handTier.</div>`;
      return;
    }
    const rule = data.rules?.[bt]?.[ht];
    renderRule(out, rule);
  }

  selBoard.addEventListener("change", update);
  selTier.addEventListener("change", update);
})();
