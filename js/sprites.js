'use strict';
/* ===== Sprites em imagem (opcional) =====
   Coloque as folhas PNG em inverno-sombrio/assets/sprites/. Se um arquivo não existir,
   o jogo continua usando o desenho feito por código. Guia completo: docs/guia-sprites.md
   Folha: células quadradas (cell x cell), personagem virado para a DIREITA, pés no centro-baixo (foot),
   fundo transparente. Cada animação é uma LINHA; os quadros ficam em colunas, da esquerda para a direita. */
const SPR_DEF = {
  player:   {src: 'assets/sprites/player.png',   cell: 96, foot: [48, 90], scale: 0.62, anims: {idle: [0, 8, 7], run: [1, 8, 14], attack3: [6, 5, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  player_espada: {src: 'assets/sprites/player_espada.png', cell: 96, foot: [48, 90], scale: 0.62, anims: {idle: [0, 8, 7], run: [1, 8, 14], attack2: [5, 3, 0], attack3: [6, 3, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  player_lanca: {src: 'assets/sprites/player_lanca.png', cell: 96, foot: [48, 90], scale: 0.62, anims: {idle: [0, 5, 6], run: [1, 8, 14], attack1: [4, 3, 0], attack2: [5, 3, 0], attack3: [6, 4, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  player_manoplas: {src: 'assets/sprites/player_manoplas.png', cell: 96, foot: [48, 90], scale: 0.62, anims: {idle: [0, 8, 7], run: [1, 8, 14], attack1: [4, 2, 0], attack2: [5, 2, 0], attack3: [6, 3, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  cls_barbaro: {src: 'assets/sprites/cls_barbaro.png', cell: 96, foot: [48, 90], scale: 0.64, anims: {idle: [0, 8, 7], run: [1, 8, 14], attack2: [5, 3, 0], attack3: [6, 3, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  cls_cacador: {src: 'assets/sprites/cls_cacador.png', cell: 96, foot: [48, 90], scale: 0.62, anims: {idle: [0, 8, 7], run: [1, 8, 15], attack1: [4, 3, 0], attack2: [5, 3, 0], attack3: [6, 3, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  cls_guardiao: {src: 'assets/sprites/cls_guardiao.png', cell: 96, foot: [48, 90], scale: 0.64, anims: {idle: [0, 8, 6], run: [1, 8, 12], attack1: [4, 3, 0], attack2: [5, 3, 0], attack3: [6, 3, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  cls_cacique: {src: 'assets/sprites/cls_cacique.png', cell: 96, foot: [48, 90], scale: 0.64, anims: {idle: [0, 8, 6], run: [1, 7, 13], attack1: [4, 3, 0], attack2: [5, 3, 0], attack3: [6, 3, 0], dodge: [7, 3, 12], special: [10, 4, 12]}},
  lobo:     {src: 'assets/sprites/lobo.png',     cell: 96, foot: [48, 90], scale: 0.5, anims: {idle: [0, 8, 6], run: [1, 8, 16], attack1: [4, 8, 0]}},
  soldado:  {src: 'assets/sprites/soldado.png',  cell: 96, foot: [48, 90], scale: 0.6, anims: {idle: [0, 8, 6], run: [1, 8, 9], attack1: [4, 6, 0]}},
  besta:    {src: 'assets/sprites/besta.png',    cell: 96, foot: [48, 90], scale: 0.58, anims: {idle: [0, 8, 6], run: [1, 8, 9], attack1: [4, 8, 0]}},
  cacador:  {src: 'assets/sprites/cacador.png',  cell: 96, foot: [48, 90], scale: 0.7, anims: {idle: [0, 8, 6], run: [1, 8, 14], attack1: [4, 4, 0], attack2: [5, 4, 0], attack3: [6, 6, 0]}},
  mercador: {src: 'assets/sprites/mercador.png', cell: 96, foot: [48, 90], scale: 0.6, anims: {idle: [0, 4, 4]}},
  natalie:  {src: 'assets/sprites/natalie.png',  cell: 96, foot: [48, 90], scale: 0.55, anims: {idle: [0, 8, 5], special: [10, 8, 7], elohim: [11, 8, 6]}}
};
/* linha, número de quadros, quadros por segundo (0 = o quadro segue o progresso do golpe) */
const SPR_ANIMS = {
  idle: [0, 4, 6], run: [1, 6, 12], jump: [2, 1, 0], fall: [3, 1, 0],
  attack1: [4, 4, 0], attack2: [5, 4, 0], attack3: [6, 5, 0],
  dodge: [7, 2, 10], hurt: [8, 1, 0], wall: [9, 1, 0], special: [10, 4, 0]
};
/* variações por armadura: arm_<armadura>_<classe> usa as mesmas animações da folha da classe */
for (const arm of ['couro_lobo']) for (const k of ['barbaro', 'cacador', 'guardiao', 'cacique'])
  SPR_DEF['arm_' + arm + '_' + k] = Object.assign({}, SPR_DEF['cls_' + k], {src: 'assets/sprites/arm_' + arm + '_' + k + '.png'});
const SPR = {};
for (const k in SPR_DEF) { const img = new Image(); SPR[k] = {def: SPR_DEF[k], img, ok: false}; img.onload = () => { SPR[k].ok = true; }; img.src = SPR_DEF[k].src; }

const [sprBuf, sprBx] = mk(160, 160);
/* Desenha um quadro. Retorna false se a folha não existe (aí quem chamou usa o desenho por código). */
function drawSheet(key, anim, t, p, wx, wy, flip, o = {}) {
  const s = SPR[key]; if (!s || !s.ok) return false;
  const d = s.def, a = (d.anims && d.anims[anim]) || SPR_ANIMS[anim] || SPR_ANIMS.idle, rows = Math.floor(s.img.height / d.cell);
  if (a[0] >= rows) return false;
  const n = a[1], f = a[2] ? Math.floor(t * a[2]) % n : Math.min(n - 1, Math.floor(Math.max(0, Math.min(0.999, p || 0)) * n));
  sprBx.clearRect(0, 0, 160, 160);
  if (o.filter) sprBx.filter = o.filter;
  sprBx.drawImage(s.img, f * d.cell, a[0] * d.cell, d.cell, d.cell, 0, 0, d.cell, d.cell);
  sprBx.filter = 'none';
  if (o.flash > 0) { sprBx.globalCompositeOperation = 'source-atop'; sprBx.fillStyle = `rgba(255,255,255,${Math.min(0.85, o.flash * 7)})`; sprBx.fillRect(0, 0, d.cell, d.cell); sprBx.globalCompositeOperation = 'source-over'; }
  if (o.tint) { sprBx.globalCompositeOperation = 'source-atop'; sprBx.fillStyle = o.tint; sprBx.fillRect(0, 0, d.cell, d.cell); sprBx.globalCompositeOperation = 'source-over'; }
  cx.save(); cx.translate(Math.round(wx), Math.round(wy)); if (flip) cx.scale(-1, 1);
  if (o.dx) cx.translate(o.dx * (flip ? -1 : 1) * (flip ? -1 : 1), 0);
  if (o.rot) cx.rotate(o.rot);
  if (o.sx || o.sy) cx.scale(Math.abs(o.sx || 1), o.sy || 1);
  if (o.alpha != null) cx.globalAlpha = o.alpha;
  cx.imageSmoothingEnabled = false;
  cx.drawImage(sprBuf, 0, 0, d.cell, d.cell, -d.foot[0] * d.scale, -d.foot[1] * d.scale, d.cell * d.scale, d.cell * d.scale);
  cx.restore();
  return true;
}
const hasSheet = key => !!(SPR[key] && SPR[key].ok);

/* ---------- efeitos animados (assets/sprites/efeitos.png, células 128x128) ---------- */
const FX = {img: new Image(), ok: false, cell: 128, rows: {slash: [0, 7], hit: [1, 7], fire: [2, 7], poison: [3, 6]}};
FX.img.onload = () => { FX.ok = true; }; FX.img.src = 'assets/sprites/efeitos.png';
const hasFx = () => FX.ok;
/* o: {scale, flip, rot, add, dur, follow} — follow: corpo cujo centro o efeito acompanha (x,y viram deslocamento) */
function spawnFx(name, x, y, o = {}) {
  if (!FX.ok || !G) return;
  (G.fxs = G.fxs || []).push({name, x, y, t: 0, dur: o.dur || 0.4, scale: o.scale || 1, flip: !!o.flip, rot: o.rot || 0, add: !!o.add, follow: o.follow || null});
}
function drawFxs(camX, camY, dt) {
  if (!FX.ok || !G.fxs) return;
  for (const f of G.fxs) {
    f.t += dt;
    const row = FX.rows[f.name], p = f.t / f.dur; if (p >= 1) continue;
    const fr = Math.min(row[1] - 1, Math.floor(p * row[1]));
    const wx = (f.follow ? cxOf(f.follow) : 0) + f.x, wy = (f.follow ? cyOf(f.follow) : 0) + f.y;
    const sz = FX.cell * f.scale;
    cx.save(); cx.translate(Math.round(wx - camX), Math.round(wy - camY)); cx.rotate(f.rot); if (f.flip) cx.scale(-1, 1);
    cx.globalAlpha = Math.min(1, (1 - p) * 2.2 + 0.2);
    if (f.add) cx.globalCompositeOperation = 'lighter';
    cx.drawImage(FX.img, fr * FX.cell, row[0] * FX.cell, FX.cell, FX.cell, -sz / 2, -sz / 2, sz, sz);
    cx.restore();
  }
  G.fxs = G.fxs.filter(f => f.t < f.dur);
}

/* ---------- ícones (assets/sprites/icones.png: 8x4 ícones de 64 px) ---------- */
const ICON = {img: new Image(), ok: false,
  pos: {weapon: {espada: [0, 0], machado: [1, 0], lanca: [2, 0], manoplas: [3, 0], arco: [4, 0], arcabuz: [5, 0]},
    armor: {gibao: [0, 1], couro_lobo: [1, 1]},
    rune: {fogo: [0, 2], agua: [1, 2], ar: [2, 2], terra: [3, 2], veneno: [4, 2], fisico: [5, 2]},
    item: {raiz: [0, 3], rimora: [1, 3], erva: [2, 3], ferro: [3, 3], aco: [4, 3], moeda: [5, 3], pocao: [6, 3], antidoto: [7, 3]}}};
ICON.img.onload = () => { ICON.ok = true; }; ICON.img.src = 'assets/sprites/icones.png';
/* segunda folha de ícones (materiais, poções, receita, armas novas): assets/sprites/icones2.png, 8x4 de 64 px */
const ICON2 = {img: new Image(), ok: false,
  pos: {item: {pele: [0, 0], garra: [1, 0], couro: [2, 0], fragmento: [3, 0], tecido: [4, 0], resina: [5, 0], antidoto: [0, 1], elixir: [1, 1], receita: [2, 1]},
    weapon: {martelo: [3, 1], cajado: [4, 1]}}};
ICON2.img.onload = () => { ICON2.ok = true; }; ICON2.img.onerror = () => { ICON2.ok = false; }; ICON2.img.src = 'assets/sprites/icones2.png';
/* onde está o ícone: {img, p, url} ou null */
function iconFor(kind, id) {
  const a = ICON.pos[kind] && ICON.pos[kind][id]; if (a && ICON.ok) return {img: ICON.img, p: a, url: 'assets/sprites/icones.png'};
  const b = ICON2.pos[kind] && ICON2.pos[kind][id]; if (b && ICON2.ok) return {img: ICON2.img, p: b, url: 'assets/sprites/icones2.png'};
  return null;
}
/* HTML de um ícone (ou o emoji de reserva, se a imagem não existir) */
function ico(kind, id, fallback = '', size = 32) {
  const ic = iconFor(kind, id), p = ic && ic.p;
  return ic ? `<span class="ico" style="width:${size}px;height:${size}px;background-image:url(${ic.url});background-size:${size * 8}px ${size * 4}px;background-position:-${p[0] * size}px -${p[1] * size}px"></span>` : fallback;
}
/* desenha um ícone no canvas da interface (hx), centralizado em (x, y) */
function drawIcon(c, kind, id, x, y, size) {
  const ic = iconFor(kind, id); if (!ic) return false;
  c.imageSmoothingEnabled = false; c.drawImage(ic.img, ic.p[0] * 64, ic.p[1] * 64, 64, 64, x - size / 2, y - size / 2, size, size); return true;
}

/* ---------- fundos em camadas (assets/bg/) ---------- */
const BG = {};
for (const [k, f] of [['far', 'far.jpg'], ['mid', 'mid.png'], ['near', 'near.png']]) { const img = new Image(); BG[k] = {img, ok: false}; img.onload = () => { BG[k].ok = true; }; img.src = 'assets/bg/' + f; }

/* Provisório: enquanto uma classe não tem folha própria (cls_<classe>), a folha genérica ganha um matiz diferente por classe */
const CLASS_FILTER = {barbaro: 'hue-rotate(-25deg) saturate(1.25) brightness(1.05)', cacador: 'hue-rotate(75deg) saturate(1.15)', guardiao: 'saturate(0.7) brightness(1.18) contrast(1.1)', cacique: 'hue-rotate(-60deg) sepia(0.35) saturate(1.2)'};
/* Retrato animado (parado) de uma classe, em um canvas 2D qualquer */
function drawPortrait(c, k, t, armor) {
  const C = CLASSES[k], wid = C.arma, key = heroSheetKey(k, wid, armor || 'gibao');
  c.clearRect(0, 0, c.canvas.width, c.canvas.height);
  if (!key) {   // sem folha: desenho por código com as cores da classe
    const pal = Object.assign({}, PAL_PLAYER, CLASS_LOOK[k] || {});
    c.save(); c.translate(c.canvas.width / 2, c.canvas.height - 6); c.scale(3, 3);
    drawHuman(c, {t, mode: 'idle', vx: 0, vy: 0, atk: null, wpn: {espada: 'sword', machado: 'axe', lanca: 'spear', manoplas: 'fist', cajado: 'cstaff', martelo: 'axe'}[wid], pal, stage: 0, shield: k === 'guardiao'});
    c.restore(); return;
  }
  const s = SPR[key], d = s.def, a = (d.anims && d.anims.idle) || SPR_ANIMS.idle, f = Math.floor(t * a[2]) % a[1], sc = c.canvas.height / d.cell * 1.15;
  c.save(); c.imageSmoothingEnabled = false;
  if (!key.startsWith('cls_') && !key.startsWith('arm_')) c.filter = CLASS_FILTER[k] || 'none';
  c.drawImage(s.img, f * d.cell, a[0] * d.cell, d.cell, d.cell, c.canvas.width / 2 - d.foot[0] * sc, c.canvas.height - 4 - d.foot[1] * sc, d.cell * sc, d.cell * sc);
  c.restore();
}

/* qual folha desenha o herói: armadura da classe > folha da classe > folha da arma > genérica (machado) */
function heroSheetKey(classe, wid, armor) {
  if (wid === CLASSES[classe].arma) {
    const a = 'arm_' + armor + '_' + classe; if (hasSheet(a)) return a;
    if (hasSheet('cls_' + classe)) return 'cls_' + classe;
  }
  if (hasSheet('player_' + wid)) return 'player_' + wid;
  return (wid === 'machado' || wid === 'martelo') ? 'player' : null;
}


/* ---------- Árvore dos Antigos (assets/sprites/arvore.png: quadro 0 dormente, quadro 1 desperta; 200x222 cada) ---------- */
const TREE = {img: new Image(), ok: false, w: 200, h: 222, scale: 0.74};
TREE.img.onload = () => { TREE.ok = true; }; TREE.img.src = 'assets/sprites/arvore.png';
const treeLeaves = [];
/* x, y = pé da árvore (mundo já convertido em tela). glow 0 = dormente, 1 = desperta. Retorna a altura desenhada */
function drawTree(x, y, t, glow, seed) {
  const sc = TREE.scale, w = TREE.w * sc, h = TREE.h * sc, top = y - h, W = TREE.w, H = TREE.h;
  if (glow > 0.02) glowAura(x, y - h * 0.58, 130 + 14 * Math.sin(t * 1.7 + seed), glow);
  cx.save(); cx.imageSmoothingEnabled = false;
  for (const fr of glow > 0.02 ? [0, 1] : [0]) {
    cx.globalAlpha = fr === 0 ? 1 : glow;
    for (let sy = 0; sy < H; sy += 4) {
      const k = Math.pow(Math.max(0, 1 - sy / (H * 0.78)), 1.6), off = Math.sin(t * 1.15 + seed + sy * 0.045) * 1.8 * k + Math.sin(t * 2.3 + sy * 0.08 + seed) * 0.5 * k;
      cx.drawImage(TREE.img, fr * W, sy, W, 4, Math.round(x - w / 2 + off), Math.round(top + sy * sc), Math.ceil(w), Math.ceil(4 * sc) + 1);
    }
  }
  cx.restore();
  return h;
}
function glowAura(x, y, r, a) {
  const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(150,255,210,0.55)'); g.addColorStop(0.5, 'rgba(110,220,190,0.2)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = 0.55 * a; cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); cx.restore();
}
/* folhas luminosas que caem da copa */
function treeLeavesSpawn(wx, wy, t, n, burst) {
  for (let i = 0; i < n; i++) treeLeaves.push({x: wx + (Math.random() - 0.5) * 100, y: wy - 70 - Math.random() * 40, t0: t, life: burst ? 1.6 + Math.random() : 3 + Math.random() * 2, sx: Math.random() * 6, v: burst ? -20 - Math.random() * 40 : 14 + Math.random() * 14, col: Math.random() < 0.5 ? '#d8ff7a' : '#7affe0'});
}
function drawTreeLeaves(camX, camY, t) {
  cx.save(); cx.globalCompositeOperation = 'lighter';
  for (let i = treeLeaves.length - 1; i >= 0; i--) {
    const l = treeLeaves[i], a = t - l.t0; if (a > l.life || a < 0) { treeLeaves.splice(i, 1); continue; }
    const px = l.x - camX + Math.sin(a * 2 + l.sx) * 9, py = l.y - camY + l.v * a + (l.v < 0 ? 40 * a * a : 0);
    cx.globalAlpha = Math.min(1, (l.life - a) * 1.2, a * 3); cx.fillStyle = l.col; cx.fillRect(Math.round(px), Math.round(py), 2, 1); cx.fillRect(Math.round(px) + 1, Math.round(py) + 1, 1, 1);
  }
  cx.restore();
}


/* ---------- objetos de cenário (assets/sprites/cenario.png: 8 células de 96x112, base no centro-baixo) ----------
   0 baú · 1 baú aberto · 2 baú rúnico · 3 baú rúnico aberto · 4 altar dormente · 5 altar desperto · 6 placa · 7 lampião */
const SCN = {img: new Image(), ok: false, w: 96, h: 112};
SCN.img.onload = () => { SCN.ok = true; }; SCN.img.src = 'assets/sprites/cenario.png';
/* (x, y) = ponto do chão onde o objeto pisa (já em coordenadas de tela) */
function drawScn(i, x, y, alpha = 1) {
  cx.save(); cx.imageSmoothingEnabled = false; cx.globalAlpha = alpha;
  cx.drawImage(SCN.img, i * SCN.w, 0, SCN.w, SCN.h, Math.round(x - SCN.w / 2), Math.round(y - SCN.h), SCN.w, SCN.h); cx.restore();
}


/* ---------- tiles em imagem (assets/sprites/tiles.png: 12 tiles de 32x32; ver tools/build-tiles.py) ----------
   Eles substituem, no atlas desenhado por código, os tiles de mesmo índice: 0-3 tijolo, 4-7 neve, 8 plataforma, 9 espinhos, 10 parede quebrável, 11 portão */
const TILES = {img: new Image(), ok: false, done: false};
TILES.img.onload = () => { TILES.ok = true; }; TILES.img.src = 'assets/sprites/tiles.png';
function patchAtlas() {
  if (!TILES.ok || TILES.done || !ART.atlas) return;
  const c = ART.atlas.getContext('2d'); c.imageSmoothingEnabled = false;
  for (let i = 0; i < 12; i++) { const h = i === 8 ? 12 : 32; c.clearRect(i * 32, 0, 32, 32); c.drawImage(TILES.img, i * 32, 0, 32, h, i * 32, 0, 32, h); }
  TILES.done = true;
}


/* ---------- props de cenário (assets/sprites/props.png: 16 células de 96x112; ver tools/build-props.py) ---------- */
const SPRP = {img: new Image(), ok: false, w: 96, h: 112,
  idx: {barrel: [0], crate: [1], cart: [2, 3], fence: [4, 5], rubble: [6, 7, 8], grave: [9, 10], banner: [11], flag: [12], sacks: [13], posts: [14], chimney: [15]}};
SPRP.img.onload = () => { SPRP.ok = true; }; SPRP.img.src = 'assets/sprites/props.png';
/* desenha o prop do tipo dado (v escolhe a variação); (x, y) = pé do objeto em tela. Retorna false se não houver sprite */
function drawPropSpr(type, v, x, y) {
  const a = SPRP.idx[type]; if (!SPRP.ok || !a) return false;
  cx.save(); cx.imageSmoothingEnabled = false;
  cx.drawImage(SPRP.img, a[v % a.length] * SPRP.w, 0, SPRP.w, SPRP.h, Math.round(x - SPRP.w / 2), Math.round(y - SPRP.h + 1), SPRP.w, SPRP.h); cx.restore();
  return true;
}
