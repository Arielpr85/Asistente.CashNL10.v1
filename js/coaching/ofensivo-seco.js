// js/coaching/ofensivo-seco.js
import { evaluateHeroHandFlop } from '../hand-evaluator-flop.js';
import { adaptHandCatFromEval } from './handcat-adapter.js';
import { toIntent } from './intent-adapter.js';

const COACHING = {
  title: 'Plan (OFENSIVO SECO)',
  base: 'C-BET 33% todo el rango.',

  // AHORA por INTENT
  vsRaiseByIntent: {
    MANO_MUY_FUERTE: 'VS RAISE: 3BET (por valor).',
    MANO_FUERTE: 'VS RAISE: CALL si es chico; FOLD si es grande.',
    MANO_MEDIA: 'VS RAISE: FOLD (disciplina).',
    MANO_SEMIFAROL: 'VS RAISE: FOLD (MVP).',
    SD_VALUE: 'VS RAISE: FOLD.',
    MANO_AIRE: 'VS RAISE: FOLD SIEMPRE (modo estricto).'
  },

  reminders: ['En OFENSIVO_SECO el objetivo es imprimir EV con cbet chico, no hero-calls.', 'Raise grande = fuerza. No inventes calls con aire.', 'Si la app dice FOLD: es FOLD.']
};

export const coachingOfensivoSeco = {
  id: 'OFENSIVO_SECO',

  match(rec) {
    return rec?.texture === 'OFENSIVO_SECO' && rec?.ini === true;
  },

  decideAction({ ipState, ini }) {
    if (!ini) return 'CHECK';
    if (ipState === 'IP') return 'BET 33%';
    return 'CHECK'; // OOP MVP
  },

  build({ rec, heroCards, boardCards }) {
    const actionUpper = (rec?.action || '').toUpperCase();
    const isBet33 = actionUpper.includes('BET 33') || actionUpper.includes('BET33') || actionUpper.includes('33%');

    const handCat = heroCards?.length === 2 && boardCards?.length === 3 ? adaptHandCatFromEval(evaluateHeroHandFlop(heroCards, boardCards)) : null;

    const intent = handCat ? toIntent(handCat) : null;

    return {
      title: COACHING.title,
      base: COACHING.base,
      handCat,
      intent,
      isBet33,
      vsRaise: intent ? COACHING.vsRaiseByIntent[intent] || '' : '',
      reminders: COACHING.reminders,

      strictTrigger: {
        requiresHandCat: 'AIR',
        requiresBet33: true
      }
    };
  }
};
