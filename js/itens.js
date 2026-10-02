'use strict';
/* ===== Itens: drops, receitas, fabricação, desmonte e fusão (lógica pura, sem desenho) ===== */

function novaArma(id, rank = 0, esp = null) { const wd = WEAPONS[id]; return {id, rank, ramo: null, runas: [], fus: 0, esp: esp || wd.esp || null}; }
function novaArmadura(id, rank = 0, esp = null) { return {id, rank, runa: null, fus: 0, esp: esp || null}; }
const espDe = item => { const e = item && (item.esp || (WEAPONS[item.id] && WEAPONS[item.id].esp)); return e && ESPECIAIS[e] ? Object.assign({id: e}, ESPECIAIS[e]) : null; };
const fusTxt = item => item.fus ? ` +${item.fus}` : '';

/* ---- inventário ---- */
const mats = p => p.itens;
function addMat(p, id, q = 1) { p.itens[id] = (p.itens[id] || 0) + q; }

/* Entrega um item descrito por {t, ...}. Retorna o nome para mostrar na tela. */
function grantItem(p, s) {
  switch (s.t) {
    case 'mat': case 'pot': addMat(p, s.id, s.q || 1); return `${s.q > 1 ? s.q + '× ' : ''}${MAT_NAMES[s.id]}`;
    case 'arma': {
      p.armas.push(novaArma(s.id, s.rank || 0, s.esp));
      if (s.id === 'martelo') p.flags.forjaFerrao = true;        // o martelo guarda o segredo da liga de Damasco
      return WEAPONS[s.id].nome + (s.rank ? ` (${RANKS[s.rank]})` : '');
    }
    case 'armadura': p.armaduras.push(novaArmadura(s.id, s.rank || 0, s.esp)); return ARMORS[s.id].nome + (s.rank ? ` (${RANKS[s.rank]})` : '');
    case 'runa': p.runas.push({elem: s.elem, lvl: s.lvl || 1}); return `Runa de ${ELEMS[s.elem].nome} nv ${s.lvl || 1}`;
    case 'rec': p.receitas[s.id] = true; return 'Receita: ' + RECEITAS.find(r => r.id === s.id).nome;
  }
  return '';
}
/* Como um drop aparece: nome, cor da raridade, se é recolhido sozinho */
function dropInfo(s) {
  const rar = RARIDADE[s.r || 'comum'];
  const auto = s.t === 'mat' || s.t === 'pot';
  let nome = '', emoji = '✦', kind = 'item', id = s.id;
  if (auto) { nome = (s.q > 1 ? s.q + '× ' : '') + MAT_NAMES[s.id]; emoji = (MAT_INFO[s.id] || {}).emoji || '✦'; }
  else if (s.t === 'arma') { nome = WEAPONS[s.id].nome; emoji = WEAPONS[s.id].emoji; kind = 'weapon'; }
  else if (s.t === 'armadura') { nome = ARMORS[s.id].nome; emoji = ARMORS[s.id].emoji; kind = 'armor'; }
  else if (s.t === 'runa') { nome = `Runa de ${ELEMS[s.elem].nome}`; emoji = ELEMS[s.elem].emoji; kind = 'rune'; id = s.elem; }
  else if (s.t === 'rec') { nome = 'Receita: ' + RECEITAS.find(r => r.id === s.id).nome; emoji = '📜'; id = 'receita'; }
  return {nome, cor: rar.cor, rar, auto, emoji, kind, id};
}
/* Sorteia os drops de um inimigo; a sorte multiplica as chances (as garantidas, p >= 1, vêm sempre) */
function rollDrops(tipo, sorte) {
  const out = [], mult = 1 + (sorte || 0) / 100;
  for (const d of DROPS[tipo] || []) {
    const p = d.p >= 1 ? 1 : Math.min(0.95, d.p * mult);
    if (Math.random() >= p) continue;
    const s = Object.assign({}, d); delete s.p;
    if (d.q) s.q = d.q[0] + Math.floor(Math.random() * (d.q[1] - d.q[0] + 1));
    out.push(s);
  }
  return out;
}

/* ---- receitas e fabricação ---- */
const receitaSabida = (p, r) => r.basica || !!p.receitas[r.id];
function custoOk(p, r) {
  if ((r.moedas || 0) > p.coins) return false;
  for (const m in r.custo) if ((p.itens[m] || 0) < r.custo[m]) return false;
  return true;
}
/* talento Fazer Poções: poções rendem uma unidade a mais */
function fabricar(p, r, s) {
  if (!receitaSabida(p, r) || !custoOk(p, r)) return null;
  p.coins -= r.moedas || 0;
  for (const m in r.custo) p.itens[m] -= r.custo[m];
  const g = r.da;
  if (g.arma) return grantItem(p, {t: 'arma', id: g.arma});
  if (g.armadura) return grantItem(p, {t: 'armadura', id: g.armadura});
  const txt = [];
  for (const m in g) { const q = g[m] + (r.tipo === 'pocao' && s && s.pocoes ? 1 : 0); addMat(p, m, q); txt.push(`${q}× ${MAT_NAMES[m]}`); }
  return txt.join(', ');
}

/* ---- desmontar ---- */
function desmonteDe(kind, item) {
  const base = Object.assign({}, DESMONTE[item.rank] || {});
  if (kind === 'A') { base.couro = (base.couro || 0) + 2; base.tecido = (base.tecido || 0) + 1; }
  if (item.fus) for (const m in base) base[m] += item.fus;
  return base;
}
/* kind 'W' ou 'A'. Não desmonta o item equipado nem o último que sobra. */
function desmontar(p, kind, i) {
  const lista = kind === 'W' ? p.armas : p.armaduras, atual = kind === 'W' ? p.arma : p.armadura, item = lista[i];
  if (!item) return {ok: false, msg: 'Item inexistente.'};
  if (i === atual) return {ok: false, msg: 'Não dá para desmontar o item equipado.'};
  if (lista.length <= 1) return {ok: false, msg: 'É o único item desse tipo.'};
  const back = desmonteDe(kind, item);
  if (kind === 'W') item.runas.forEach(r => p.runas.push(r)); else if (item.runa) p.runas.push(item.runa);
  for (const m in back) addMat(p, m, back[m]);
  lista.splice(i, 1);
  if (kind === 'W' && p.arma > i) p.arma--; if (kind === 'A' && p.armadura > i) p.armadura--;
  return {ok: true, back, msg: 'Desmontado: ' + Object.keys(back).map(m => `${back[m]}× ${MAT_NAMES[m]}`).join(', ')};
}

/* ---- fusão: dois equipamentos iguais viram um melhor, com chance de ganhar habilidade especial ---- */
function podeFundir(p, kind, i, j) {
  const lista = kind === 'W' ? p.armas : p.armaduras, a = lista[i], b = lista[j], atual = kind === 'W' ? p.arma : p.armadura;
  return !!(a && b && i !== j && a.id === b.id && j !== atual && (a.fus || 0) < FUSAO.max && (b.fus || 0) < FUSAO.max);
}
function fundir(p, kind, i, j) {
  if (!podeFundir(p, kind, i, j)) return {ok: false, msg: 'Só dá para fundir dois iguais (e o item emprestado não pode estar equipado).'};
  const lista = kind === 'W' ? p.armas : p.armaduras, a = lista[i], b = lista[j];
  a.rank = Math.max(a.rank, b.rank); a.fus = Math.min(FUSAO.max, Math.max(a.fus || 0, b.fus || 0) + 1);
  if (kind === 'W') { b.runas.forEach(r => p.runas.push(r)); while (a.runas.length > RANK_SLOTS[a.rank]) p.runas.push(a.runas.pop()); if (a.ramo == null && b.ramo != null) a.ramo = b.ramo; }
  else if (b.runa) { if (a.runa) p.runas.push(b.runa); else a.runa = b.runa; }
  let ganhou = null;
  const fixa = kind === 'W' && WEAPONS[a.id].esp;
  if (!a.esp && !fixa) a.esp = b.esp || null;
  if (!a.esp && !fixa && Math.random() < FUSAO.chanceEsp) { const pool = kind === 'W' ? ESP_ARMAS : ESP_ARMADURAS; a.esp = pool[Math.floor(Math.random() * pool.length)]; ganhou = ESPECIAIS[a.esp].nome; }
  lista.splice(j, 1);
  if (kind === 'W' && p.arma > j) p.arma--; if (kind === 'A' && p.armadura > j) p.armadura--;
  return {ok: true, ganhou, msg: `Fundido! Agora ${kind === 'W' ? 'a arma' : 'a armadura'} está em +${a.fus}.` + (ganhou ? ` Nova habilidade: ${ganhou}!` : '')};
}
