'use strict';
/* ===== Capítulo 1: Vila Destruída =====
   Tiles: 0 ar · 1 sólido · 2 plataforma · 3 espinhos · 4 parede quebrável · 6 portão do chefe */
function buildChapter1() {
  const W = 200, H = 34, tiles = new Uint8Array(W * H);
  const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) tiles[y * W + x] = v; };
  const fill = (x, y, w, h, v = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, v); };
  const GROUND = 28;

  // contorno e chão
  fill(0, 0, W, 2); fill(0, 0, 1, H); fill(W - 1, 0, 1, H); fill(0, GROUND, W, H - GROUND);

  // Sala 0: Ruínas da Vila
  fill(14, 25, 5, 1, 2); fill(22, 22, 4, 1, 2); fill(19, 26, 2, 2, 1);
  // Sala 1: Rua Queimada
  fill(60, GROUND, 4, 6, 0); fill(60, 32, 4, 1, 3); fill(60, 33, 4, 1, 1);   // fosso com espinhos
  fill(44, 25, 5, 1, 2); fill(52, 22, 5, 1, 2); fill(66, 25, 6, 1, 2); fill(72, 22, 4, 1, 2);
  fill(76, 25, 4, 3, 1); fill(77, 26, 2, 2, 0); fill(76, 26, 1, 2, 4);       // segredo (parede quebrável)
  // Sala 2: Mercado e Altar
  fill(88, 25, 5, 1, 2); fill(96, 22, 5, 1, 2); fill(104, 25, 5, 1, 2); fill(110, 22, 6, 1, 2);
  // Sala 3: Poço do Lobo (corredor vertical, exige salto na parede)
  fill(124, 12, 1, 14, 1);                 // parede oeste
  fill(129, 18, 1, 10, 1);                 // parede leste
  fill(129, 18, 26, 1, 1);                 // chão superior
  fill(130, 12, 25, 1, 1);                 // teto do corredor superior
  // Sala 4: Arena do Extermínio
  fill(176, 24, 5, 1, 2); fill(188, 24, 5, 1, 2);

  const gy = (ty, h) => ty * TS - h;     // y de um corpo de altura h apoiado no topo do tile ty
  const sp = (type, tx, ty) => ({type, x: tx * TS, y: gy(ty, ENEMIES[type].h)});

  return {
    w: W, h: H, tiles, GROUND,
    rooms: [
      {x0: 0, x1: 40, nome: 'Ruínas da Vila'}, {x0: 40, x1: 80, nome: 'Rua Queimada'},
      {x0: 80, x1: 120, nome: 'Mercado e Altar'}, {x0: 120, x1: 160, nome: 'Poço do Lobo'},
      {x0: 160, x1: 200, nome: 'Arena do Extermínio'}
    ],
    start: {x: 4 * TS, y: gy(GROUND, 30)},
    camps: [{id: 0, x: 8 * TS, y: GROUND * TS}, {id: 1, x: 84 * TS, y: GROUND * TS}, {id: 2, x: 163 * TS, y: GROUND * TS}],
    npcs: [{id: 'natalie', x: 11 * TS, y: GROUND * TS, nome: 'Natalie', emoji: '🧙‍♀️'}, {id: 'bazar', x: 14 * TS, y: GROUND * TS, nome: 'Bazar de Testes', emoji: '🎒'}],
    altar: {x: 116 * TS, y: GROUND * TS},
    notes: NOTES.concat(MEMORIAS_C1).map(n => ({id: n.id, nome: n.nome, lines: n.lines, mem: !!n.mem, needBoss: !!n.needBoss, resumo: n.resumo, x: n.x * TS, y: n.y * TS})),
    chests: [
      {id: 'c_ruinas', x: 24 * TS, y: 22 * TS, loot: {coins: 20, raiz: 2}},
      {id: 'c_segredo', x: 78 * TS, y: GROUND * TS, loot: {runa: {elem: 'fogo', lvl: 1}, coins: 30}, secret: true},
      {id: 'c_machado', x: 112 * TS, y: 22 * TS, loot: {arma: 'machado', coins: 25}},
      {id: 'c_lanca', x: 53 * TS, y: 22 * TS, loot: {arma: 'lanca', coins: 20}},
      {id: 'c_manoplas', x: 98 * TS, y: 22 * TS, loot: {arma: 'manoplas', coins: 20}},
      {id: 'c_opala', x: 140 * TS, y: 18 * TS, loot: {runa: {elem: 'fisico', lvl: 1}, ferro: 3}, secret: true},
      {id: 'c_couro', x: 152 * TS, y: 18 * TS, loot: {armadura: 'couro_lobo', ferro: 4, coins: 40}},
      {id: 'c_boss', x: 194 * TS, y: GROUND * TS, loot: {runa: {elem: 'veneno', lvl: 1}, aco: 3, coins: 60}, needBoss: true}
    ],
    spawns: [
      sp('lobo', 30, GROUND), sp('lobo', 35, GROUND),
      sp('soldado', 50, GROUND), sp('lobo', 68, 25), sp('besta', 74, 22),
      sp('soldado', 92, GROUND), sp('soldado', 100, GROUND), sp('besta', 106, 25), sp('lobo', 112, GROUND),
      sp('lobo', 135, GROUND), sp('soldado', 138, 18), sp('besta', 147, 18),
      sp('lobo', 150, 18), sp('lobo', 146, GROUND), sp('soldado', 166, GROUND)
    ],
    boss: sp('cacador', 190, GROUND),
    gate: {x: 170, y0: 22, y1: 27},
    arenaX: 173 * TS,
    exitX: 197 * TS
  };
}
