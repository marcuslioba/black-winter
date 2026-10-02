'use strict';
/* ===== Ficha do jogador, atributos derivados, mutação, evolução ===== */
function newPlayer(nome, classe = 'cacador') {
  const p = {
    nome, classe, nivel: 1, xp: 0, pontos: 0, coins: 0,
    talentos: {},
    baseHp: 100, hp: 100, folego: 100, mut: 0, marca: 0,
    armas: [{id: 'espada', rank: 0, ramo: null, runas: []}], arma: 0,
    armaduras: [{id: 'gibao', rank: 0, runa: null}], armadura: 0,
    itens: {raiz: 3, rimora: 1, erva: 0, ferro: 0, aco: 0, pele: 0, garra: 0, couro: 0, fragmento: 0, tecido: 0, resina: 0, antidoto: 0, elixir: 0},
    receitas: {}, elixirT: 0,
    runas: [],
    flags: {canis: false, baus: {}, bossMorto: false, natalie: false, mortes: 0, seen: {}, lidas: {}, memTodas: false, natalieMem: false},
    camp: 0, tempo: 0, sombra: null
  };
  const C = CLASSES[classe];
  p.armas = [{id: C.arma, rank: 0, ramo: null, runas: []}];
  p.talentos[C.talento] = true;
  if (classe === 'cacique') { p.itens.raiz = 5; p.itens.erva = 3; p.armas[0].runas.push({elem: 'veneno', lvl: 1}); }
  return p;
}

function calcStats(p) {
  const s = {danoPct: 0, velAtq: 0, velMove: 0, hpPct: 0, folegoMax: 0, folegoRegenPct: 0, mutGanhoPct: 0,
    marcaPct: 0, poderCustoPct: 0, curaPct: 0, mutCortePct: 0, runaBonus: 0, venenoBonus: 0, canisCura: 4, def: 0,
    bravata: false, odio: false, surpresa: false, olfato: false, resistir: false, vinganca: false,
    recurso: false, pocoes: false, receptador: false, curaProfunda: false, dodgeCdMult: 1, defBonus: 0,
    sorte: 0, sangria: 0, trovao: false, critico: 0, abalo: false, espinhos: 0, regen: 0, couraca: false};
  for (const t of TALENTS) if (p.talentos[t.id]) t.fx(s);
  if (CLASSES[p.classe]) CLASSES[p.classe].fx(s);
  const a = p.armaduras[p.armadura], ad = ARMORS[a.id], rm = RANK_MULT[a.rank];
  s.def = (ad.def * rm + s.defBonus) * (1 + FUSAO.bonus * (a.fus || 0));
  for (const k in ad.fx) s[k] = (s[k] || 0) + ad.fx[k] * (1 + 0.2 * a.rank);
  const w = p.armas[p.arma], wd = WEAPONS[w.id];
  s.armaDanoMult = rm * (1 + FUSAO.bonus * (w.fus || 0));
  s.armaVel = 0;
  if (w.ramo != null) {
    const fx = wd.ramos[w.ramo].fx;
    if (fx.dano) s.armaDanoMult *= 1 + fx.dano;
    if (fx.vel) s.armaVel += fx.vel;
  }
  for (const e of [w.esp || wd.esp, a.esp]) aplicaEsp(s, e);
  if (s.couraca) s.def *= 1.12;
  if (p.elixirT > 0) s.sorte += 50;
  return s;
}
function aplicaEsp(s, e) {
  switch (e) {
    case 'sangria': s.sangria += 0.05; break; case 'trovao': s.trovao = true; break; case 'critico': s.critico += 0.15; break;
    case 'veloz': s.velAtq += 0.10; break; case 'abalo': s.abalo = true; break; case 'faro': s.sorte += 12; break;
    case 'espinhos': s.espinhos += 0.25; break; case 'vigor': s.folegoMax += 20; break; case 'regen': s.regen += 0.6; break; case 'couraca': s.couraca = true; break;
  }
}
function hpBase(p, s) { return (p.baseHp + (p.nivel - 1) * 8) * (1 + s.hpPct / 100); }
function hpMax(p, s) {
  const corte = Math.min(0.5, p.mut / 100 * 0.5 * (1 - s.mutCortePct / 100)) + Math.min(0.25, p.marca / 100);
  return Math.round(hpBase(p, s) * Math.max(0.4, 1 - corte));
}
function folegoMax(p, s) { return 100 + s.folegoMax; }
function weaponName(w) {
  const wd = WEAPONS[w.id];
  return (wd.unica ? `${wd.nome} (${RANKS[w.rank]})` : `${wd.nome} de ${RANKS[w.rank]}`) + (w.fus ? ` +${w.fus}` : '') + (w.ramo != null ? ` — ${wd.ramos[w.ramo].nome}` : '');
}
function runeLevel(p, s, r) {
  let l = r.lvl + s.runaBonus + (r.elem === 'veneno' ? s.venenoBonus : 0);
  return Math.min(3, l);
}
function weaponRunes(p, s) {
  const w = p.armas[p.arma], out = {};
  for (const r of w.runas) out[r.elem] = (out[r.elem] || 0) + runeLevel(p, s, r);
  return out;
}
function mutStage(p) { const v = p.mut + p.marca * 4; return v < 25 ? 0 : v < 50 ? 1 : v < 75 ? 2 : 3; }

function addXp(p, n) {
  p.xp += n; let up = 0;
  while (p.xp >= 100) { p.xp -= 100; p.nivel++; p.pontos += 2; up++; }
  return up;
}
function rankUpCost(r) { return RANK_COST[r]; }
function canPay(p, cost) {
  if (p.coins < cost.coins) return false;
  for (const m in cost.mat) if ((p.itens[m] || 0) < cost.mat[m]) return false;
  return true;
}
function pay(p, cost) { p.coins -= cost.coins; for (const m in cost.mat) p.itens[m] -= cost.mat[m]; }
function costText(c) { return `${c.coins} moedas` + Object.keys(c.mat).map(m => ` + ${c.mat[m]} ${MAT_NAMES[m]}`).join(''); }

/* Descansar na fogueira: limpa quase toda a mutação e deixa a marca permanente */
function restAtCamp(p) {
  const s = calcStats(p);
  const antes = p.mut;
  p.marca = Math.min(25, p.marca + antes * 0.06 * Math.max(0, 1 + s.marcaPct / 100));
  p.mut = s.curaProfunda ? 0 : p.mut * 0.15;
  p.hp = hpMax(p, s); p.folego = folegoMax(p, s);
  return antes;
}

/* Fusão de runas: 2 runas iguais do mesmo nível viram 1 de nível acima (máx. 3) */
function fuseRunes(p, elem, lvl) {
  if (lvl >= 3) return false;
  const idx = [];
  p.runas.forEach((r, i) => { if (r.elem === elem && r.lvl === lvl) idx.push(i); });
  if (idx.length < 2) return false;
  idx.slice(0, 2).reverse().forEach(i => p.runas.splice(i, 1));
  p.runas.push({elem, lvl: lvl + 1});
  return true;
}

/* Salvamento (3 espaços) */
const SAVE_KEY = n => 'inverno_save_' + n;
function saveGame(slot, p) { try { localStorage.setItem(SAVE_KEY(slot), JSON.stringify({p, quando: Date.now()})); return true; } catch (e) { return false; } }
function loadSave(slot) { try { const r = localStorage.getItem(SAVE_KEY(slot)); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
function deleteSave(slot) { try { localStorage.removeItem(SAVE_KEY(slot)); } catch (e) {} }
const CFG_KEY = 'inverno_cfg';
function loadCfg() {
  try { return Object.assign({music: 0.5, sfx: 0.7, shake: true}, JSON.parse(localStorage.getItem(CFG_KEY) || '{}')); }
  catch (e) { return {music: 0.5, sfx: 0.7, shake: true}; }
}
function saveCfg(c) { try { localStorage.setItem(CFG_KEY, JSON.stringify(c)); } catch (e) {} }
