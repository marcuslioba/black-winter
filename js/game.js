'use strict';
/* ===== Simulação do jogo (física, combate, inimigos, interações) ===== */
const VW = 480, VH = 270;
const GRAV = 1800, MAXFALL = 900, RUN = 230, JUMP = 650;
let CFG = loadCfg(), G = null, L = null, P = null, S = null, pl = null;

const solidTile = t => t === 1 || t === 4 || t === 6;
function tileAt(tx, ty) { if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) return 1; return L.tiles[ty * L.w + tx]; }
function setTile(tx, ty, v) { if (tx >= 0 && ty >= 0 && tx < L.w && ty < L.h) L.tiles[ty * L.w + tx] = v; }
function boxHitsSolid(x, y, w, h) {
  const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - 0.01) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + h - 0.01) / TS);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (solidTile(tileAt(i, j))) return true;
  return false;
}
function moveBody(b, dt, dropThrough) {
  b.onGround = false; b.hitWall = 0;
  const dx = b.vx * dt, nx = Math.max(1, Math.ceil(Math.abs(dx) / 6));
  for (let i = 0; i < nx; i++) {
    b.x += dx / nx;
    if (boxHitsSolid(b.x, b.y, b.w, b.h)) { b.x -= dx / nx; b.hitWall = Math.sign(dx); b.vx = 0; break; }
  }
  const dy = b.vy * dt, ny = Math.max(1, Math.ceil(Math.abs(dy) / 6));
  for (let i = 0; i < ny; i++) {
    const st = dy / ny, prevBottom = b.y + b.h;
    b.y += st;
    if (boxHitsSolid(b.x, b.y, b.w, b.h)) { b.y -= st; if (dy > 0) b.onGround = true; b.vy = 0; break; }
    if (st > 0 && !dropThrough) {
      const ty = Math.floor((b.y + b.h) / TS), x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS);
      let landed = false;
      for (let tx = x0; tx <= x1; tx++) if (tileAt(tx, ty) === 2 && prevBottom <= ty * TS + 0.5 && b.y + b.h > ty * TS) landed = true;
      if (landed) { b.y = ty * TS - b.h; b.vy = 0; b.onGround = true; break; }
    }
  }
}
function wallProbe(b) {
  for (const dir of [-1, 1]) {
    const px = dir < 0 ? b.x - 2 : b.x + b.w + 2;
    for (const oy of [4, b.h / 2, b.h - 4]) if (solidTile(tileAt(Math.floor(px / TS), Math.floor((b.y + oy) / TS)))) return dir;
  }
  return 0;
}
function touchesTile(b, type) {
  const x0 = Math.floor(b.x / TS), x1 = Math.floor((b.x + b.w - 0.01) / TS), y0 = Math.floor(b.y / TS), y1 = Math.floor((b.y + b.h - 0.01) / TS);
  for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (tileAt(i, j) === type) return true;
  return false;
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const cxOf = b => b.x + b.w / 2, cyOf = b => b.y + b.h / 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const sign = v => v < 0 ? -1 : 1;

/* ---------- efeitos visuais ---------- */
function burst(x, y, col, n = 8, sp = 160, life = 0.5, size = 3) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, v = rnd(sp * 0.3, sp);
    G.parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: life * rnd(0.6, 1), max: life, col, size});
  }
}
function floatText(x, y, txt, col = '#fff', size = 14) { G.texts.push({x, y, txt, col, life: 1.0, size}); }
function shake(a) { if (CFG.shake) G.shake = Math.max(G.shake, a); }

/* ---------- criação do mundo ---------- */
function refresh() {
  S = calcStats(P);
  if (pl && pl.berserk) applyFury(S);
  const m = hpMax(P, S); if (P.hp > m) P.hp = m;
  const f = folegoMax(P, S); if (P.folego > f) P.folego = f;
}
/* Fúria bestial: atributos +50% enquanto ativa (ver toggleBerserk) */
const BERSERK = {bonus: 0.5, drain: 0.08, cost: 25, mut: 12, feralHp: 0.3, feralHitMut: 4};
function applyFury(s) { s.danoPct += BERSERK.bonus * 100; s.velAtq += BERSERK.bonus; s.velMove += BERSERK.bonus; s.def *= 1 + BERSERK.bonus; s.folegoRegenPct += BERSERK.bonus * 100; }
function mkEnemy(sp) {
  const d = ENEMIES[sp.type];
  return {type: sp.type, d, x: sp.x, y: sp.y, w: d.w, h: d.h, hp: d.hp, hpMax: d.hp, vx: 0, vy: 0, dir: 1, state: 'patrol', t: 0,
    cd: 0, flash: 0, fx: {}, aggro: false, stun: 0, homeX: sp.x, dotT: 0, onGround: false, boss: !!d.boss, dead: false, anim: Math.random() * 6};
}
function respawnEnemies() {
  G.enemies = L.spawns.map(mkEnemy);
  G.projs = [];
  closeGate(false);
  G.bossActive = false;
  if (!P.flags.bossMorto) { G.boss = mkEnemy(L.boss); G.boss.state = 'wait'; G.enemies.push(G.boss); } else G.boss = null;
  Snd.setMode('explore');
}
function closeGate(close) {
  for (let y = L.gate.y0; y <= L.gate.y1; y++) setTile(L.gate.x, y, close ? 6 : 0);
  G.gateClosed = close;
}
function beginWorld(fromCamp) {
  L = buildChapter1();
  G = {mode: 'play', time: 0, shake: 0, hitstop: 0, enemies: [], projs: [], parts: [], texts: [], drops: [], dialog: null, visited: {},
    cam: {x: 0, y: 0}, gateClosed: false, bossActive: false, boss: null, fade: 1, deadT: 0, prompt: null, banner: null, bannerT: 0};
  // restaura baús abertos / segredos
  P.flags.baus = P.flags.baus || {};
  const camp = L.camps[P.camp] || L.camps[0];
  pl = {x: 0, y: 0, w: 20, h: 30, vx: 0, vy: 0, facing: 1, onGround: false, hitWall: 0, wallDir: 0, atk: null, lastStep: 0, dead: false,
    coyote: 0, jumpBuf: 0, atkBuf: 0, comboT: 0, iframes: 0, dodgeT: 0, dashT: 0, dodgeCd: 0, powerT: 0, powerCd: 0, lock: 0, wallCoyote: 0, healCd: 0,
    resistCd: 0, skillCd: 0, shieldT: 0, folegoDelay: 0, jumpCut: false, poison: null, recursoUsado: false, berserk: false, feral: false, berserkT: 0, t: 0, safeX: 0, safeY: 0, safeT: 0, hitSet: null, room: 0, step: 0};
  if (fromCamp) { pl.x = camp.x - 10; pl.y = camp.y - pl.h - 1; } else { pl.x = L.start.x; pl.y = L.start.y; }
  pl.safeX = pl.x; pl.safeY = pl.y;
  refresh(); P.hp = hpMax(P, S);
  respawnEnemies();
  G.cam.x = clampCam(pl.x - VW / 2, 0, L.w * TS - VW); G.cam.y = clampCam(pl.y - VH * 0.55, 0, L.h * TS - VH);
  Input.clear();
  initArt();
}
const clampCam = (v, a, b) => Math.max(a, Math.min(b, v));
function setBanner(txt) { G.banner = txt; G.bannerT = 3; }

/* ---------- dano ao jogador ---------- */
function hurtPlayer(dmg, fromX, elem, type) {
  if (pl.iframes > 0 || pl.dead || G.mode !== 'play') return 0;
  let d = dmg * ENEMY_DMG * 100 / (100 + S.def);
  if (type === 'proj' && S.receptador) { d *= 0.5; P.folego = Math.min(folegoMax(P, S), P.folego + 10); floatText(cxOf(pl), pl.y - 20, 'Receptor!', '#7fe3b0'); }
  if (pl.shieldT > 0) { d *= 0.3; floatText(cxOf(pl), pl.y - 34, 'Bloqueado', '#9cd3ff'); Snd.sfx('clang'); }
  if (S.resistir && pl.resistCd <= 0) { d *= 0.4; pl.resistCd = 12; floatText(cxOf(pl), pl.y - 34, 'Resistir!', '#9cd3ff'); }
  const ar = P.armaduras[P.armadura].runa;
  if (ar && elem && ar.elem === elem) d *= 1 - 0.15 * ar.lvl;
  d = Math.max(1, Math.round(d));
  let morreu;
  if (pl.feral) { pl.feralHp -= d; P.mut = Math.min(100, P.mut + BERSERK.feralHitMut); morreu = pl.feralHp <= 0; }   // fera: o dano gasta o instinto, e cada golpe sobe a mutação
  else { P.hp -= d; morreu = P.hp <= 0; }
  pl.iframes = 0.9; pl.hurtT = 0.2;
  const dir = cxOf(pl) < fromX ? -1 : 1;
  pl.vx = dir * 230; pl.vy = -260; pl.lock = 0.16; pl.atk = null; pl.powerT = 0; pl.dodgeT = 0;
  G.hitstop = 0.06; shake(7); Snd.sfx('hurt');
  floatText(cxOf(pl), pl.y - 8, '-' + d, '#ff6b6b', 16);
  burst(cxOf(pl), cyOf(pl), '#c0392b', 8, 180);
  if (S.espinhos) { let n = null, nd = 80; for (const e of G.enemies) if (!e.dead) { const dd = Math.hypot(cxOf(e) - cxOf(pl), cyOf(e) - cyOf(pl)); if (dd < nd) { nd = dd; n = e; } } if (n) hitEnemy(n, Math.max(1, d * S.espinhos), 120, sign(cxOf(n) - cxOf(pl)), {noFx: true, col: '#c9a45c'}); }
  if (elem === 'veneno') { if (P.itens.antidoto > 0) { P.itens.antidoto--; floatText(cxOf(pl), pl.y - 34, 'Antídoto!', '#7fe3b0', 14); } else pl.poison = {t: 4, tick: 0.5}; }
  if (morreu) {
    if (S.recurso && !pl.recursoUsado && !pl.feral) {
      pl.recursoUsado = true; P.hp = Math.round(hpMax(P, S) * 0.35); floatText(cxOf(pl), pl.y - 40, 'Recurso!', '#f2cc60', 18);
    } else killPlayer();
  }
  return d;
}
function killPlayer() {
  pl.dead = true; pl.berserk = pl.feral = false; G.mode = 'dead'; G.deadT = 0; P.hp = 0; refresh();
  P.sombra = {x: pl.x, y: pl.y, coins: P.coins, xp: P.xp};
  P.coins = 0; P.xp = 0; P.flags.mortes++;
  Snd.sfx('death'); Snd.setMode('none');
}
function respawn() {
  restAtCamp(P);
  const camp = L.camps[P.camp] || L.camps[0];
  pl.berserk = pl.feral = false;
  pl.dead = false; pl.x = camp.x - 10; pl.y = camp.y - pl.h - 1; pl.vx = pl.vy = 0; pl.iframes = 1.2; pl.poison = null; pl.recursoUsado = false;
  G.fade = 1; G.mode = 'play'; refresh(); P.hp = hpMax(P, S);
  respawnEnemies(); Input.clear();
}

/* ---------- ataque do jogador ---------- */
function aimDir() { const I = Input.held; if (I.up) return 'up'; if (I.down && !pl.onGround) return 'down'; return 'fwd'; }
function startAttack(step) {
  const wd = WEAPONS[P.armas[P.arma].id], st = wd.steps[step - 1];
  const sp = 1 + S.velAtq + S.armaVel;
  pl.atk = {step, t: 0, dur: st[0] / sp, mult: st[1], kb: st[2], hit: new Set(), dir: aimDir()};
  pl.lastStep = step; pl.atkBuf = 0;
  if (pl.onGround) pl.vx = pl.facing * 90;
  Snd.sfx('slash');
}
function atkRect(dir, range, alt) {
  const c = cxOf(pl);
  if (dir === 'up') return {x: c - 22, y: pl.y - range * 0.9, w: 44, h: range * 0.9 + 6};
  if (dir === 'down') return {x: c - 22, y: pl.y + pl.h - 6, w: 44, h: range * 0.9};
  return {x: pl.facing > 0 ? pl.x + pl.w - 4 : pl.x - range + 4, y: pl.y + pl.h / 2 - alt / 2, w: range, h: alt};
}
function playerDamage(mult, e) {
  const w = P.armas[P.arma], wd = WEAPONS[w.id];
  let d = wd.dano * S.armaDanoMult * (1 + S.danoPct / 100) * mult;
  if (S.odio && P.hp < hpMax(P, S) * 0.4) d *= 1.3;
  if (S.surpresa && !e.aggro) d *= 1.5;
  const r = weaponRunes(P, S); if (r.fisico) d *= 1 + 0.08 * r.fisico;
  if (e.boss && e.vuln > 0) d *= 1.3;
  if (S.critico && Math.random() < S.critico) { d *= 2; G.crit = true; }
  return d;
}
function hitEnemy(e, dmg, kb, dirx, opts = {}) {
  if (e.dead) return;
  if (e.weak > 0) dmg *= 1.3;   // Névoa Debilitante
  e.hp -= dmg; e.flash = 0.12; e.aggro = true;
  const crit = G.crit; G.crit = false;
  if (S.sangria && !opts.noFx && !pl.feral) P.hp = Math.min(hpMax(P, S), P.hp + dmg * S.sangria);   // Sangria
  if (!e.boss) {
    if (!(e.poise > 0)) {
      e.vx = dirx * kb; e.vy = -140; e.stun = opts.big ? 0.4 : 0.22; e.poise = e.stun + 0.7;
      if (e.state === 'wind' || e.state === 'aim') e.state = 'recover', e.t = 0.3;
    } else e.vx += dirx * kb * 0.15;
  }
  else e.vx += dirx * kb * 0.1;
  floatText(cxOf(e), e.y - 6, String(Math.round(dmg)) + (crit ? '!' : ''), crit ? '#ffd070' : (opts.col || '#fff'), crit ? 20 : (opts.big ? 18 : 14));
  burst(cxOf(e), cyOf(e), '#ffe9a8', 5, 150, 0.3);
  spawnFx('hit', cxOf(e), cyOf(e), {scale: opts.big ? 0.7 : 0.5, add: true, dur: 0.25});
  G.hitstop = Math.max(G.hitstop, 0.045); shake(3); Snd.sfx('hit', e.type === 'soldado' || e.boss ? 'metal' : e.type === 'lobo' ? 'wolf' : 'flesh');
  if (!opts.noFx) {
    const r = weaponRunes(P, S);
    if (r.fogo) { e.fx.fogo = {t: 4, lvl: r.fogo}; }
    if (r.veneno) { e.fx.veneno = {t: 5, lvl: r.veneno}; }
  }
  if (e.hp <= 0) killEnemy(e);
}
/* Trovão: o último golpe solta um raio nos vizinhos do alvo */
function trovaoAt(src, dmg) {
  Snd.sfx('bolt'); const x = cxOf(src), y = cyOf(src); burst(x, y, '#bfe6ff', 14, 260, 0.4, 2); spawnFx('hit', x, y, {scale: 0.9, add: true, dur: 0.3});
  for (const o of G.enemies) if (!o.dead && o !== src && Math.hypot(cxOf(o) - x, cyOf(o) - y) < 90) { hitEnemy(o, dmg * 0.6, 140, sign(cxOf(o) - x), {noFx: true, col: '#bfe6ff'}); spawnFx('hit', cxOf(o), cyOf(o), {scale: 0.6, add: true, dur: 0.25}); }
}
/* Abalo: o último golpe atordoa e arremessa quem estiver em volta */
function abaloAt() {
  shake(10); Snd.sfx('explode'); G.hitstop = Math.max(G.hitstop, 0.05); const x = cxOf(pl); G.slam = {x, y: pl.y + pl.h, t: 0};
  burst(x + pl.facing * 30, pl.y + pl.h, '#dfe9f5', 18, 260, 0.6, 3);
  for (const e of G.enemies) if (!e.dead && Math.abs(cxOf(e) - x) < 120 && Math.abs(cyOf(e) - cyOf(pl)) < 70) { e.stun = Math.max(e.stun || 0, 0.7); e.poise = 0; e.vx = sign(cxOf(e) - x) * 380; e.vy = -220; }
}
function explodeAt(x, y, dmg) {
  burst(x, y, '#ff8a2a', 22, 300, 0.7, 4); burst(x, y, '#7ed957', 18, 260, 0.7, 4);
  Snd.sfx('explode'); shake(8);
  spawnFx('fire', x, y - 6, {scale: 0.9, dur: 0.6}); spawnFx('poison', x, y, {scale: 0.9, dur: 0.6});
  for (const e of G.enemies) if (!e.dead && Math.hypot(cxOf(e) - x, cyOf(e) - y) < 90) hitEnemy(e, dmg, 100, sign(cxOf(e) - x), {noFx: true, col: '#ffb347', big: true});
}
function tickEnemyFx(e, dt) {
  for (const k of ['fogo', 'veneno']) if (e.fx[k]) { e.fx[k].t -= dt; if (e.fx[k].t <= 0) delete e.fx[k]; }
  if (e.fx.fogo && e.fx.veneno) {
    delete e.fx.fogo; delete e.fx.veneno;
    floatText(cxOf(e), e.y - 22, 'Explosão Tóxica!', '#ffb347', 14);
    explodeAt(cxOf(e), cyOf(e), 38);
    return;
  }
  if (e.fx.fogo || e.fx.veneno) {
    e.dotT -= dt;
    if (e.dotT <= 0) {
      e.dotT = 0.5;
      if (e.fx.fogo) { const d = Math.round(5 * e.fx.fogo.lvl * 0.5 * (e.d.fraq.fogo || 1) * (e.d.res.fogo || 1)); e.hp -= d; floatText(cxOf(e), e.y - 4, String(d), '#ff7a2f', 11); }
      if (e.fx.veneno) { const d = Math.round(4 * e.fx.veneno.lvl * 0.5 * (e.d.res.veneno || 1)); e.hp -= d; floatText(cxOf(e) + 8, e.y - 4, String(d), '#7ed957', 11); }
      if (e.hp <= 0) killEnemy(e);
    }
  }
}
function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  burst(cxOf(e), cyOf(e), e.boss ? '#ffb347' : '#e8d9a8', e.boss ? 40 : 14, 260, 0.8, 4);
  Snd.sfx('hit');
  const coins = Math.round(rnd(e.d.coins[0], e.d.coins[1]));
  P.coins += coins; floatText(cxOf(e), e.y - 24, `+${coins} 🪙`, '#f2cc60', 12);
  spawnLoot(e);
  const up = addXp(P, e.d.xp);
  if (up) { Snd.sfx('level'); floatText(cxOf(pl), pl.y - 40, `Nível ${P.nivel}! (+${up * 2} pontos de talento)`, '#9cd3ff', 16); refresh(); }
  if (e.boss) bossDefeated();
}
function updateAttack(dt) {
  const a = pl.atk; if (!a) return;
  const wd = WEAPONS[P.armas[P.arma].id];
  a.t += dt;
  const f = a.t / a.dur;
  if (f > 0.2 && f < 0.7) {
    const r = atkRect(a.dir, wd.alcance, wd.alt); a.rect = r;
    if (!a.fx) {
      a.fx = true; const L2 = wd.alcance * 0.5;
      if (a.dir === 'up') spawnFx('slash', 0, -L2, {follow: pl, scale: wd.alcance * 1.9 / 128, rot: -Math.PI / 2, flip: pl.facing < 0, add: true, dur: 0.28});
      else if (a.dir === 'down') spawnFx('slash', 0, L2, {follow: pl, scale: wd.alcance * 1.9 / 128, rot: Math.PI / 2, flip: pl.facing < 0, add: true, dur: 0.28});
      else spawnFx('slash', pl.facing * L2, -2, {follow: pl, scale: wd.alcance * 1.9 / 128, flip: pl.facing < 0, add: true, dur: 0.28});
    }
    for (const e of G.enemies) {
      if (e.dead || a.hit.has(e) || !overlap(r, e)) continue;
      a.hit.add(e);
      let kb = a.kb, dirx = pl.facing;
      if (S.bravata && a.step === wd.steps.length && a.dir === 'fwd') kb *= 2.4;
      if (a.dir !== 'fwd') dirx = sign(cxOf(e) - cxOf(pl));
      const dmgH = playerDamage(a.mult, e);
      hitEnemy(e, dmgH, kb, dirx, {big: a.step === wd.steps.length});
      if (a.step === wd.steps.length && a.dir === 'fwd' && S.trovao) trovaoAt(e, dmgH);
      if (a.dir === 'down') { pl.vy = -470; pl.jumpCut = true; }
    }
    if (S.abalo && !a.abaloFeito && a.hit.size && a.step === wd.steps.length && a.dir === 'fwd') { a.abaloFeito = true; abaloAt(); }
    // paredes quebráveis
    const x0 = Math.floor(r.x / TS), x1 = Math.floor((r.x + r.w) / TS), y0 = Math.floor(r.y / TS), y1 = Math.floor((r.y + r.h) / TS);
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) if (tileAt(i, j) === 4) {
      setTile(i, j, 0); burst(i * TS + 16, j * TS + 16, '#8a6a46', 10, 200, 0.6, 4); Snd.sfx('explode'); shake(4);
      if (!G.bannerShown) { G.bannerShown = true; floatText(i * TS, j * TS - 10, 'Passagem secreta!', '#f2cc60'); }
    }
  }
  if (a.t >= a.dur) { pl.atk = null; pl.comboT = 0.28; }
}

/* ---------- poder de Tanataú: Garra Lupina (Canis) ---------- */
function usePower() {
  const cost = 25 * (1 - S.poderCustoPct / 100);
  if (!P.flags.canis || pl.feral || pl.powerCd > 0 || P.folego < cost || pl.dodgeT > 0) return;
  P.folego -= cost; pl.folegoDelay = 1.0;
  pl.powerT = 0.34; pl.powerCd = 0.7; pl.iframes = Math.max(pl.iframes, 0.34); pl.atk = null;
  pl.powerHit = new Set(); pl.vy = 0;
  const gain = 10 * (1 + S.mutGanhoPct / 100);
  P.mut = Math.min(100, P.mut + gain);
  refresh();
  Snd.sfx('power'); shake(2);
  floatText(cxOf(pl), pl.y - 22, 'Mutação +' + Math.round(gain), '#c78bff', 12);
}
function updatePower(dt) {
  if (pl.powerT <= 0) return;
  const r = {x: pl.facing > 0 ? pl.x : pl.x - 70 + pl.w, y: pl.y - 8, w: 70, h: pl.h + 16};
  for (const e of G.enemies) {
    if (e.dead || pl.powerHit.has(e) || !overlap(r, e)) continue;
    pl.powerHit.add(e);
    const wd = WEAPONS[P.armas[P.arma].id];
    hitEnemy(e, playerDamage(2.1, e), 320, pl.facing, {big: true, col: '#ffcf70'});
    const heal = S.canisCura; P.hp = Math.min(hpMax(P, S), P.hp + heal);
    floatText(cxOf(pl), pl.y - 30, '+' + Math.round(heal), '#7ee787', 12);
  }
}

/* investida do Caçador: dano leve em quem for atravessado */
function updateDash(dt) {
  if (pl.dashT <= 0) return;
  const r = {x: pl.x - 6, y: pl.y - 6, w: pl.w + 12, h: pl.h + 12};
  for (const e of G.enemies) {
    if (e.dead || pl.dashHit.has(e) || !overlap(r, e)) continue;
    pl.dashHit.add(e); hitEnemy(e, playerDamage(1.3, e), 260, pl.facing, {col: '#9cd3ff'});
  }
  if (G.mode === 'play' && Math.random() < 0.8) G.parts.push({x: cxOf(pl) - pl.facing * 8, y: pl.y + Math.random() * pl.h, vx: -pl.facing * 60, vy: 0, life: 0.3, max: 0.3, col: '#9cd3ff', size: 2, add: true});
}

/* ---------- habilidade de classe (F / B) ---------- */
function useSkill() {
  const C = CLASSES[P.classe], cost = C.skillCost;
  if (pl.feral || pl.skillCd > 0 || P.folego < cost || pl.dodgeT > 0 || pl.powerT > 0 || pl.dashT > 0) return;
  P.folego -= cost; pl.folegoDelay = 0.9; pl.skillCd = 1.2;
  const x = cxOf(pl), y = cyOf(pl);
  if (P.classe === 'barbaro') {   // Golpe Brutal: um golpe pesado à frente
    const f = pl.facing, fx = x + f * 56;
    pl.lock = 0.22; pl.atk = null; pl.vx = f * 120; shake(11); G.hitstop = 0.07; Snd.sfx('explode');
    burst(x + f * 50, pl.y + pl.h, '#dfe9f5', 24, 300, 0.6, 3); G.slam = {x: fx, y: pl.y + pl.h, t: 0}; spawnFx('slash', fx, y - 4, {scale: 2.2, flip: f < 0, add: true, dur: 0.35});
    for (const e of G.enemies) if (!e.dead && (cxOf(e) - x) * f > -10 && Math.abs(cxOf(e) - x) < 120 && Math.abs(cyOf(e) - y) < 60)
      hitEnemy(e, playerDamage(3.6, e), 560, f, {big: true, col: '#ffcf70'});
  } else if (P.classe === 'cacador') {   // Investida: avanço veloz que atravessa os inimigos
    pl.dashT = 0.26; pl.dashHit = new Set(); pl.atk = null; pl.vy = 0; pl.iframes = Math.max(pl.iframes, 0.3); Snd.sfx('dodge'); shake(3);
    burst(x, y, '#9cd3ff', 10, 200, 0.4, 2);
  } else if (P.classe === 'guardiao') {
    pl.shieldT = 2.2; Snd.sfx('power'); burst(x, y, '#9cd3ff', 14, 160, 0.5, 2);
  } else if (P.classe === 'cacique') {
    Snd.sfx('power'); G.cloud = {x, y, gy: pl.y + pl.h, t: 0};
    burst(x, y, '#9fffc0', 14, 160, 0.9, 2);
    for (const e of G.enemies) if (!e.dead && Math.hypot(cxOf(e) - x, cyOf(e) - y) < 130) { e.fx.veneno = {t: 5, lvl: 2}; e.weak = 5; e.slow = 5; e.aggro = true; }
  }
}

/* ---------- Fúria bestial (G / LT) ---------- */
function toggleBerserk() {
  if (!P.flags.canis) { G.hint = 'A Fúria vem do Tanataú. Desperte o Canis no altar primeiro.'; G.hintT = 4; return; }
  if (pl.feral) return;
  if (pl.berserk) { endBerserk(false); return; }
  if (pl.dodgeT > 0 || pl.powerT > 0) return;
  if (P.folego < BERSERK.cost || P.hp < hpMax(P, S) * 0.2) { floatText(cxOf(pl), pl.y - 22, P.folego < BERSERK.cost ? 'Sem Fôlego' : 'Vida baixa', '#ff9a7a', 12); return; }
  P.folego -= BERSERK.cost; pl.folegoDelay = 1.0;
  pl.berserk = true; pl.berserkT = 0;
  P.mut = Math.min(100, P.mut + BERSERK.mut * (1 + S.mutGanhoPct / 100)); refresh();
  Snd.sfx('fury'); Snd.setMode('fury'); shake(12); G.hitstop = 0.09; G.furyFlash = 0.55; G.furyWave = {x: cxOf(pl), y: cyOf(pl), t: 0};
  burst(cxOf(pl), cyOf(pl), TAN().cor, 28, 300, 0.8, 3); burst(cxOf(pl), cyOf(pl), TAN().claro, 14, 200, 0.6, 2);
  floatText(cxOf(pl), pl.y - 26, 'FÚRIA!', TAN().cor, 22); setBanner('Fúria bestial');
}
function enterFeral() {
  pl.feral = true; pl.berserk = true; pl.atk = null; pl.shieldT = 0;
  P.hp = 0; pl.feralMax = pl.feralHp = Math.max(4, Math.round(hpMax(P, S) * BERSERK.feralHp)); refresh();
  Snd.sfx('feral'); shake(16); G.hitstop = 0.18; G.furyFlash = 0.9; G.furyWave = {x: cxOf(pl), y: cyOf(pl), t: 0};
  burst(cxOf(pl), cyOf(pl), TAN().cor, 30, 320, 0.9, 3); burst(cxOf(pl), cyOf(pl), TAN().claro, 24, 280, 0.8, 3);
  floatText(cxOf(pl), pl.y - 30, 'FERAL!', TAN().claro, 24); setBanner('Você virou animal: toque a Árvore dos Antigos para voltar');
}
function endBerserk(atTree) {
  const was = pl.feral; pl.berserk = pl.feral = false; refresh();
  if (was) P.hp = Math.max(P.hp, Math.round(hpMax(P, S) * 0.4));      // volta à forma humana, mas fraco
  Snd.setMode(G.bossActive ? 'boss' : 'explore');
  if (atTree) {
    Snd.sfx('save'); treeLeavesSpawn(cxOf(pl), pl.y + pl.h, G.time, 30, true); G.furyFlash = 0;
    setBanner(was ? 'Você voltou ao normal' : 'Fúria encerrada'); floatText(cxOf(pl), pl.y - 26, was ? 'Forma humana' : 'Calma', '#9fffe0', 16);
  } else { Snd.sfx('menu'); floatText(cxOf(pl), pl.y - 22, 'Fúria encerrada', '#ffb08a', 12); }
}

/* ---------- jogador ---------- */
function updatePlayer(dt) {
  const I = Input.held, Pr = Input.pressed;
  for (const k of ['coyote', 'jumpBuf', 'atkBuf', 'comboT', 'iframes', 'dodgeT', 'dodgeCd', 'powerT', 'dashT', 'powerCd', 'lock', 'wallCoyote', 'healCd', 'resistCd', 'folegoDelay', 'hurtT', 'skillCd', 'shieldT'])
    if (pl[k] > 0) pl[k] -= dt;
  pl.t += dt;
  if (Pr.jump && !(Input.device === 'pad' && G.near && pl.onGround)) pl.jumpBuf = 0.12;   // no controle, A perto de algo interativo só interage
  if (Pr.attack) pl.atkBuf = 0.18;
  if (pl.onGround) { pl.coyote = 0.1; pl.jumpCut = false; }
  const ax = Input.axisX;

  // esquiva
  if (Pr.dodge && pl.dodgeCd <= 0 && pl.dodgeT <= 0 && pl.powerT <= 0 && pl.dashT <= 0) {   // a esquiva não gasta Fôlego, só tem recarga
    pl.dodgeT = 0.22; pl.dodgeCd = 0.45 * S.dodgeCdMult; pl.iframes = Math.max(pl.iframes, 0.3);
    pl.atk = null; if (ax) pl.facing = sign(ax);
    pl.vx = pl.facing * 440; pl.vy = 0; Snd.sfx('dodge');
  }
  if (Pr.power) usePower();
  if (Pr.skill) useSkill();
  if (Pr.berserk) toggleBerserk();

  const rm = pl.powerT > 0 || pl.dodgeT > 0 || pl.dashT > 0;
  if (pl.powerT > 0) { pl.vx = pl.facing * 520; pl.vy = 0; }
  else if (pl.dashT > 0) { pl.vx = pl.facing * 640; pl.vy = 0; }
  else if (pl.dodgeT > 0) { pl.vx = pl.facing * 440; pl.vy = 0; }
  else {
    let speed = RUN * (1 + S.velMove) * (P.flags.canis ? 1.22 : 1);
    if (pl.atk) speed *= 0.55;
    if (pl.lock <= 0) {
      const target = ax * speed, acc = (pl.onGround ? 2800 : 1800) * dt;
      pl.vx += Math.max(-acc, Math.min(acc, target - pl.vx));
      if (ax !== 0 && !pl.atk) pl.facing = sign(ax);
    }
    // parede
    const wallD = wallProbe(pl);
    pl.wallDir = wallD;
    pl.vy = Math.min(MAXFALL, pl.vy + GRAV * dt);
    if (P.flags.canis && !pl.onGround && wallD !== 0 && pl.vy > 0 && (Math.sign(ax) === wallD || (ax === 0 && pl.wallCoyote > 0 && pl.wallSide === wallD))) { pl.vy = Math.min(pl.vy, 90); pl.wallCoyote = 0.2; pl.wallSide = wallD; }
    else if (!P.flags.canis && !pl.onGround && wallD !== 0 && Math.sign(ax) === wallD && !P.flags.dicaParede) { P.flags.dicaParede = true; G.hint = 'Você ainda não sabe escalar paredes. O Canis, no Altar do Lobo (Mercado), ensina o salto na parede.'; G.hintT = 7; }
    // pulo
    if (pl.jumpBuf > 0) {
      if (pl.coyote > 0) { pl.vy = -JUMP; pl.coyote = 0; pl.jumpBuf = 0; pl.jumpCut = false; Snd.sfx('jump'); }
      else if (P.flags.canis && pl.wallCoyote > 0) {
        pl.vy = -625; pl.vx = -pl.wallSide * 300; pl.facing = -pl.wallSide; pl.lock = 0.17; pl.wallCoyote = 0; pl.jumpBuf = 0; pl.jumpCut = true;
        Snd.sfx('jump'); burst(pl.wallSide > 0 ? pl.x + pl.w : pl.x, cyOf(pl), '#dfe9f5', 6, 120, 0.3, 2);
      }
    }
    if (pl.vy < -250 && !I.jump && !pl.jumpCut) { pl.vy *= 0.45; pl.jumpCut = true; }
  }

  // ataque
  const wd = WEAPONS[P.armas[P.arma].id];
  if (pl.atk && pl.atkBuf > 0 && pl.atk.t > pl.atk.dur * 0.5 && pl.atk.step < wd.steps.length) startAttack(pl.atk.step + 1);
  else if (!pl.atk && pl.atkBuf > 0 && !rm) startAttack(pl.comboT > 0 && pl.lastStep < wd.steps.length ? pl.lastStep + 1 : 1);
  updateAttack(dt);
  updatePower(dt); updateDash(dt);

  // itens
  if (Pr.heal && !pl.feral && P.itens.raiz > 0 && pl.healCd <= 0 && P.hp < hpMax(P, S)) {
    const h = Math.round(40 * (1 + S.curaPct / 100)); P.hp = Math.min(hpMax(P, S), P.hp + h); P.itens.raiz--; pl.healCd = 0.8;
    floatText(cxOf(pl), pl.y - 14, '+' + h, '#7ee787', 16); Snd.sfx('pickup'); burst(cxOf(pl), cyOf(pl), '#7ee787', 8, 90);
  }
  if (Pr.rimora && !pl.feral && P.itens.rimora > 0 && pl.healCd <= 0 && P.folego < folegoMax(P, S)) {
    P.folego = Math.min(folegoMax(P, S), P.folego + 60); P.itens.rimora--; pl.healCd = 0.8;
    floatText(cxOf(pl), pl.y - 14, '+Fôlego', '#59e0d0', 14); Snd.sfx('pickup');
  }

  // fôlego
  if (pl.folegoDelay <= 0 && pl.dodgeT <= 0 && pl.powerT <= 0)
    P.folego = Math.min(folegoMax(P, S), P.folego + 17 * (1 + S.folegoRegenPct / 100) * dt);

  if (S.regen && !pl.feral && P.hp > 0 && P.hp < hpMax(P, S)) P.hp = Math.min(hpMax(P, S), P.hp + S.regen * dt);   // Regeneração
  // Fúria: a Vida é consumida até zero; zerada, o herói vira animal por inteiro
  if (pl.berserk) {
    pl.berserkT += dt;
    if (!pl.feral) { P.hp -= hpMax(P, S) * BERSERK.drain * dt; if (P.hp <= 0) enterFeral(); }
    if (Math.random() < dt * 1.2) shake(2);
  }

  // veneno
  if (pl.poison) {
    pl.poison.t -= dt; pl.poison.tick -= dt;
    if (pl.poison.tick <= 0) { pl.poison.tick = 0.5; P.hp = Math.max(1, P.hp - 2); floatText(cxOf(pl), pl.y - 6, '2', '#7ed957', 11); }
    if (pl.poison.t <= 0) pl.poison = null;
  }

  if (pl.onGround && Math.abs(pl.vx) > 60 && !pl.atk && pl.dodgeT <= 0) { pl.stepT = (pl.stepT || 0) - dt * Math.abs(pl.vx) / 230; if (pl.stepT <= 0) { pl.stepT = 0.3; Snd.sfx('step'); } } else pl.stepT = 0;
  const wasGround = pl.onGround, vyBefore = pl.vy;
  moveBody(pl, dt, I.down && I.jump);
  if (pl.dodgeT > 0 && pl.hitWall) pl.dodgeT = 0;
  if (!wasGround && pl.onGround && vyBefore > 300) { pl.squash = Math.min(1, vyBefore / 700); Snd.sfx('land'); burst(cxOf(pl), pl.y + pl.h, '#dfe9f5', 4, 80, 0.3, 2); }
  if (pl.dodgeT <= 0 && rm === false && Math.abs(pl.vx) > 450) pl.vx *= 0.5;
  if (pl.powerT <= 0 && pl.dodgeT <= 0 && Math.abs(pl.vx) > 420) pl.vx *= 0.4;

  // espinhos / queda
  if (touchesTile(pl, 3) && pl.iframes <= 0) {
    hurtPlayer(20, cxOf(pl), null, 'trap');
    if (!pl.dead) { pl.x = pl.safeX; pl.y = pl.safeY; pl.vx = pl.vy = 0; }
  }
  if (pl.onGround) {
    pl.safeT += dt;
    if (pl.safeT > 0.25 && !touchesTile({x: pl.x - 24, y: pl.y + 4, w: pl.w + 48, h: pl.h + 40}, 3)
        && boxHitsSolid(pl.x - 8, pl.y + pl.h + 2, 4, 4) && boxHitsSolid(pl.x + pl.w + 4, pl.y + pl.h + 2, 4, 4)) { pl.safeX = pl.x; pl.safeY = pl.y; }
  } else pl.safeT = 0;

  // sala atual / sombra
  const rx = cxOf(pl) / TS;
  L.rooms.forEach((r, i) => { if (rx >= r.x0 && rx < r.x1) { if (pl.room !== i || !G.visited[i]) { pl.room = i; if (!G.visited[i]) { G.visited[i] = true; setBanner(r.nome); } } } });
  if (P.sombra && overlap(pl, {x: P.sombra.x - 8, y: P.sombra.y - 8, w: 36, h: 46})) {
    P.coins += P.sombra.coins; const up = addXp(P, P.sombra.xp);
    floatText(cxOf(pl), pl.y - 30, `Recuperou ${P.sombra.coins} 🪙 e ${P.sombra.xp} XP`, '#f2cc60', 14);
    Snd.sfx('pickup'); P.sombra = null; if (up) { refresh(); Snd.sfx('level'); }
  }
}

/* ---------- inimigos ---------- */
function groundAhead(e, dir) { return solidTile(tileAt(Math.floor((cxOf(e) + dir * (e.w / 2 + 6)) / TS), Math.floor((e.y + e.h + 4) / TS))) || tileAt(Math.floor((cxOf(e) + dir * (e.w / 2 + 6)) / TS), Math.floor((e.y + e.h + 4) / TS)) === 2; }
function spawnProj(x, y, vx, vy, dmg, elem, extra = {}) { G.projs.push(Object.assign({x, y, w: 10, h: 6, vx, vy, dmg, elem, life: 3}, extra)); }
function faceP(e) { e.dir = sign(cxOf(pl) - cxOf(e)); }
function hitPlayerRect(r, dmg, e, elem, type = 'melee') {
  if (!overlap(r, pl)) return;
  const d = hurtPlayer(dmg, cxOf(e), elem, type);
  if (d && S.vinganca && type === 'melee' && !e.dead) hitEnemy(e, Math.max(1, Math.round(d * 0.4)), 120, sign(cxOf(e) - cxOf(pl)), {noFx: true, col: '#9cd3ff'});
}

function aiLobo(e, dt) {
  const dx = cxOf(pl) - cxOf(e), dy = cyOf(pl) - cyOf(e), ad = Math.abs(dx);
  e.cd -= dt;
  if (e.state === 'patrol') {
    if (e.dir === 0) e.dir = 1;
    e.vx = e.dir * 55;
    if (e.hitWall || !groundAhead(e, e.dir) || Math.abs(cxOf(e) - e.homeX) > 120) e.dir *= -1;
    if (ad < 240 && Math.abs(dy) < 100 && !pl.dead) { e.state = 'chase'; e.aggro = true; Snd.sfx('growl'); }
  } else if (e.state === 'chase') {
    faceP(e); e.vx = e.dir * 185;
    if (!groundAhead(e, e.dir) && e.onGround) e.vx = 0;
    if (ad < 130 && e.cd <= 0 && e.onGround && Math.abs(dy) < 70) { e.state = 'wind'; e.t = 0.3; e.vx = 0; }
    if (ad > 460) { e.state = 'patrol'; e.aggro = false; }
  } else if (e.state === 'wind') {
    e.vx = 0; e.t -= dt; faceP(e);
    if (e.t <= 0) { e.state = 'lunge'; e.vx = e.dir * 340; e.vy = -310; e.t = 0; e.hitOnce = false; Snd.sfx('snarl'); }
  } else if (e.state === 'lunge') {
    e.t += dt;
    if (!e.hitOnce && overlap(e, pl)) { e.hitOnce = true; hurtPlayer(14, cxOf(e), null, 'melee'); }
    if (e.onGround && e.t > 0.12) { e.state = 'recover'; e.t = 0.55; e.cd = 1.3; e.vx = 0; }
  } else if (e.state === 'recover') {
    e.vx *= 0.85; e.t -= dt; if (e.t <= 0) e.state = 'chase';
  }
}
function aiSoldado(e, dt) {
  const dx = cxOf(pl) - cxOf(e), dy = cyOf(pl) - cyOf(e), ad = Math.abs(dx);
  e.cd -= dt;
  if (e.state === 'patrol') {
    if (e.dir === 0) e.dir = 1;
    e.vx = e.dir * 38;
    if (e.hitWall || !groundAhead(e, e.dir) || Math.abs(cxOf(e) - e.homeX) > 90) e.dir *= -1;
    if (ad < 250 && Math.abs(dy) < 90 && !pl.dead) { e.state = 'approach'; e.aggro = true; }
  } else if (e.state === 'approach') {
    faceP(e); e.vx = groundAhead(e, e.dir) ? e.dir * 72 : 0;
    if (ad < 56 && e.cd <= 0) { e.state = 'wind'; e.t = 0.55; e.vx = 0; }
    if (ad > 420) { e.state = 'patrol'; e.aggro = false; }
  } else if (e.state === 'wind') {
    e.vx = 0; e.t -= dt;
    if (e.t <= 0) { e.state = 'swing'; e.t = 0.18; Snd.sfx('slash'); }
  } else if (e.state === 'swing') {
    e.t -= dt;
    hitPlayerRect({x: e.dir > 0 ? e.x + e.w : e.x - 54, y: e.y, w: 54, h: e.h}, 18, e);
    if (e.t <= 0) { e.state = 'recover'; e.t = 0.7; e.cd = 1.1; }
  } else if (e.state === 'recover') {
    e.t -= dt; e.vx = 0; if (e.t <= 0) e.state = 'approach';
  }
}
function aiBesta(e, dt) {
  const dx = cxOf(pl) - cxOf(e), dy = cyOf(pl) - cyOf(e), ad = Math.abs(dx);
  e.cd -= dt;
  if (e.state === 'patrol') {
    e.vx = 0; if (ad < 330 && Math.abs(dy) < 150 && !pl.dead) { e.state = 'engage'; e.aggro = true; }
  } else if (e.state === 'engage') {
    faceP(e);
    if (ad < 90 && groundAhead(e, -e.dir)) e.vx = -e.dir * 120; else e.vx = 0;
    if (e.cd <= 0 && ad >= 90) { e.state = 'aim'; e.t = 0.6; e.vx = 0; }
    if (ad > 420) { e.state = 'patrol'; e.aggro = false; }
  } else if (e.state === 'aim') {
    e.t -= dt; e.vx = 0; faceP(e);
    if (e.t <= 0) {
      const sx = cxOf(e) + e.dir * 14, sy = e.y + 12, ang = Math.atan2(cyOf(pl) - sy, cxOf(pl) - sx);
      spawnProj(sx, sy, Math.cos(ang) * 430, Math.sin(ang) * 430, 14, 'fisico'); Snd.sfx('bolt');
      e.state = 'engage'; e.cd = 2.2;
    }
  } else if (e.state === 'recover') { e.t -= dt; e.vx = 0; if (e.t <= 0) e.state = 'engage'; }
}

/* ---------- chefe: Caçador do Extermínio ---------- */
function aiBoss(e, dt) {
  if (!G.bossActive) { e.vx = 0; return; }
  const dx = cxOf(pl) - cxOf(e), ad = Math.abs(dx), enr = e.hp < e.hpMax * 0.5;
  e.cd -= dt; e.t -= dt; if (e.vuln > 0) e.vuln -= dt;
  const rate = enr ? 0.55 : 1;
  switch (e.state) {
    case 'wait': case 'idle':
      e.state = 'idle'; faceP(e); e.vx = 0;
      if (e.cd <= 0) {
        const opts = ['volley', 'dash', 'leap']; if (ad < 160) opts.push('dash', 'leap');
        let m = opts[Math.floor(Math.random() * opts.length)]; if (m === e.last) m = opts[Math.floor(Math.random() * opts.length)];
        e.last = m; e.state = m; e.t = m === 'volley' ? 0.7 * rate + 0.2 : m === 'dash' ? 0.75 * rate + 0.15 : 0.5; e.phase = 0; faceP(e);
      }
      break;
    case 'volley':
      e.vx = 0;
      if (e.phase === 0 && e.t <= 0) {
        e.phase = 1; Snd.sfx('bolt');
        const n = enr ? 5 : 3, sx = cxOf(e) + e.dir * 16, sy = e.y + 14, base = Math.atan2(cyOf(pl) - sy, cxOf(pl) - sx);
        for (let i = 0; i < n; i++) { const ang = base + (i - (n - 1) / 2) * 0.17; spawnProj(sx, sy, Math.cos(ang) * 400, Math.sin(ang) * 400, 15, 'veneno', {w: 12, h: 8}); }
        e.t = 0.5;
      } else if (e.phase === 1 && e.t <= 0) { e.state = 'idle'; e.cd = 0.9 * rate; }
      break;
    case 'dash':
      if (e.phase === 0) { e.vx = 0; if (e.t <= 0) { e.phase = 1; e.t = 0.42; e.vx = e.dir * 640; Snd.sfx('slash'); } }
      else if (e.phase === 1) {
        if (!e.hitOnce) { e.hitOnce = false; }
        hitPlayerRect({x: e.x - 6, y: e.y, w: e.w + 12, h: e.h}, 24, e);
        if (e.t <= 0 || e.hitWall) { e.phase = 2; e.t = 0.85; e.vx = 0; e.vuln = 0.85; }
      } else if (e.t <= 0) { e.state = 'idle'; e.cd = 0.6 * rate; }
      break;
    case 'leap':
      if (e.phase === 0) { e.vx = 0; if (e.t <= 0) { e.phase = 1; e.vy = -640; e.vx = sign(dx) * Math.min(330, ad * 1.1 + 40); e.t = 0.15; } }
      else if (e.phase === 1) {
        if (e.onGround && e.t <= 0) {
          e.phase = 2; e.t = 0.6; e.vx = 0; e.vuln = 0.6; shake(8); Snd.sfx('explode');
          spawnProj(cxOf(e), e.y + e.h - 10, 280, 0, 16, 'fisico', {w: 16, h: 14, ground: true});
          spawnProj(cxOf(e), e.y + e.h - 10, -280, 0, 16, 'fisico', {w: 16, h: 14, ground: true});
        }
      } else if (e.t <= 0) { e.state = 'idle'; e.cd = 0.7 * rate; }
      break;
  }
}
function bossDefeated() {
  P.flags.bossMorto = true; G.bossActive = false; closeGate(false); Snd.setMode('camp');
  G.projs = [];
  setBanner('Caçador do Extermínio derrotado');
  startDialog([
    {who: 'Caçador do Extermínio', txt: 'Ferrão... era o meu nome. Me prometeram um lugar atrás da muralha para a minha família. Ela já estava morta, e eu nem sabia.'},
    {who: 'H', txt: 'Ferrão? O ferreiro? Foi você quem entregou a vila?'},
    {who: 'Caçador do Extermínio', txt: 'Fui. E a menina da fita azul... eu a entreguei viva ao Comandante. Eu juro. Ela cantava o tempo todo.'},
    {who: 'H', txt: 'Lia... Onde ela está?'},
    {who: 'Caçador do Extermínio', txt: 'Na fortaleza, a leste. O Rei vai encontrar você. Corra, lobinho... enquanto o seu nome ainda é só um nome.'},
    {who: 'H', txt: 'Tem uma fortaleza ao leste. É de lá que o Extermínio sai, e é para lá que levam os nossos.'},
    {who: 'Natalie', txt: 'Ouvi o rugido daqui da árvore. Descanse, e depois siga a leste. O caminho da Geleira começa onde a vila termina.'}
  ]);
}

function updateEnemies(dt) {
  for (const e of G.enemies) {
    if (e.dead) continue;
    e.flash = Math.max(0, e.flash - dt); e.anim += dt; if (e.poise > 0) e.poise -= dt;
    tickEnemyFx(e, dt); if (e.dead) continue;
    if (e.stun > 0) { e.stun -= dt; e.vx *= 0.88; }
    else if (e.type === 'lobo') aiLobo(e, dt);
    else if (e.type === 'soldado') aiSoldado(e, dt);
    else if (e.type === 'besta') aiBesta(e, dt);
    else if (e.type === 'cacador') aiBoss(e, dt);
    if (e.weak > 0) e.weak -= dt;
    if (e.slow > 0) { e.slow -= dt; e.vx *= 0.62; }
    e.vy = Math.min(MAXFALL, e.vy + GRAV * dt);
    moveBody(e, dt);
    if (e.y > L.h * TS + 100) e.dead = true;
  }
  G.enemies = G.enemies.filter(e => !e.dead);
}
function updateProjs(dt) {
  for (const p of G.projs) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.life <= 0 || solidTile(tileAt(Math.floor(p.x / TS), Math.floor(p.y / TS)))) { p.life = 0; burst(p.x, p.y, '#cfd8ea', 3, 80, 0.2, 2); continue; }
    if (p.from === 'player') {
      for (const e of G.enemies) if (!e.dead && overlap({x: p.x - 5, y: p.y - 3, w: 10, h: 6}, e)) { hitEnemy(e, playerDamage(p.mult, e), 160, sign(p.vx), {}); p.life = 0; break; }
      continue;
    }
    if (overlap({x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h}, pl)) { hurtPlayer(p.dmg, p.x - p.vx * 0.01, p.elem, 'proj'); p.life = 0; }
  }
  G.projs = G.projs.filter(p => p.life > 0);
}

/* ---------- drops no chão ---------- */
function spawnLoot(e) {
  const lista = rollDrops(e.type, S.sorte);
  lista.forEach((s, i) => spawnDrop(s, cxOf(e) + (i - lista.length / 2) * 6, e.y + e.h * 0.4));
}
function spawnDrop(s, x, y) {
  const info = dropInfo(s);
  G.drops.push({x: x - 6, y: y - 6, w: 12, h: 12, vx: rnd(-110, 110), vy: -rnd(180, 300), onGround: false, age: 0, spec: s, info, id: Math.random()});
  if (!info.auto) { Snd.sfx('pickup'); if (s.r === 'lendario' || s.r === 'epico') { G.hint = 'Item raro! Chegue perto e use {interact} para pegar.'; G.hintT = 5; } }
}
function updateDrops(dt) {
  const px = cxOf(pl), py = cyOf(pl);
  for (const d of G.drops) {
    d.age += dt; d.vy = Math.min(MAXFALL, d.vy + GRAV * 0.8 * dt); d.vx *= d.onGround ? 0.8 : 0.995;
    if (d.info.auto && d.age > 0.5) {   // materiais e poções vêm até você
      const dx = px - (d.x + 6), dy = py - (d.y + 6), dist = Math.hypot(dx, dy);
      if (dist < 90 && !pl.feral) { d.vx += dx / dist * 900 * dt; d.vy += dy / dist * 900 * dt - GRAV * 0.8 * dt; d.vx *= 0.9; d.vy *= 0.9; }
      if (!pl.feral && overlap({x: pl.x - 12, y: pl.y - 18, w: pl.w + 24, h: pl.h + 30}, d)) { d.dead = true; collectDrop(d); continue; }
    }
    moveBody(d, dt);
    if (d.age > (d.info.auto ? 70 : 240)) d.dead = true;
  }
  G.drops = G.drops.filter(d => !d.dead);
}
function collectDrop(d) {
  const nome = grantItem(P, d.spec), info = d.info;
  floatText(d.x + 6, d.y - 10, nome, info.cor, info.auto ? 12 : 15);
  Snd.sfx(info.auto ? 'pickup' : 'level'); burst(d.x + 6, d.y + 6, info.cor, info.auto ? 5 : 14, 140, 0.5, 2);
  if (d.spec.t === 'rec') setBanner('Receita aprendida: ' + RECEITAS.find(r => r.id === d.spec.id).nome);
  else if (d.spec.id === 'martelo') { setBanner('Martelo do Ferrão'); G.hint = 'A Forja do Ferrão se abriu: você já pode evoluir equipamentos até o Damasco.'; G.hintT = 8; }
  else if (!info.auto && (d.spec.r === 'lendario' || d.spec.r === 'epico')) setBanner(nome);
  refresh();
}

/* ---------- interações ---------- */
function nearest() {
  const c = {x: cxOf(pl), y: pl.y + pl.h};
  const list = [];
  for (const k of L.camps) list.push({kind: 'camp', ref: k, x: k.x, y: k.y, label: 'Árvore dos Antigos'});
  for (const n of L.npcs) list.push({kind: 'npc', ref: n, x: n.x, y: n.y, label: n.nome});
  for (const n of L.notes) if (!n.needBoss || P.flags.bossMorto) list.push({kind: 'note', ref: n, x: n.x, y: n.y, label: (n.mem ? 'Lembrar: ' : 'Ler: ') + n.nome});
  for (const d of G.drops) if (!d.info.auto && !d.dead) list.push({kind: 'drop', ref: d, x: d.x + 6, y: d.y + 14, label: 'Pegar: ' + d.info.nome});
  if (!P.flags.canis) list.push({kind: 'altar', ref: L.altar, x: L.altar.x, y: L.altar.y, label: 'Altar do Lobo'});
  for (const ch of L.chests) if (!P.flags.baus[ch.id] && (!ch.needBoss || P.flags.bossMorto)) list.push({kind: 'chest', ref: ch, x: ch.x, y: ch.y, label: 'Baú'});
  let best = null, bd = 56;
  for (const o of list) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; best = o; } }
  return best;
}
function interact(o) {
  if (pl.feral && o.kind !== 'camp') return;
  if (o.kind === 'camp') { P.camp = o.ref.id; (P.flags.lit = P.flags.lit || {})[o.ref.id] = true; Snd.sfx('menu'); G.mode = 'menu'; UI.camp(); }
  else if (o.kind === 'drop') { o.ref.dead = true; collectDrop(o.ref); }
  else if (o.kind === 'npc') { if (o.ref.id === 'bazar') { Snd.sfx('menu'); G.mode = 'menu'; UI.bazar(); } else nataliTalk(); }
  else if (o.kind === 'note') {
    const n = o.ref, lidas = P.flags.lidas || (P.flags.lidas = {}), first = !lidas[n.id]; lidas[n.id] = true; Snd.sfx(n.mem ? 'ok' : 'page');
    startDialog(typeof n.lines === 'function' ? n.lines() : n.lines, n.mem && first ? memoryCollected : null);
  }
  else if (o.kind === 'altar') {
    startDialog([
      {who: 'Altar do Lobo', txt: 'Pegadas de luz sobem pela pedra. Uma presença antiga respira atrás de você.'},
      {who: 'Canis, o Lobo', txt: 'Sobrevivente. Você tem o sangue. Aceite minhas garras e minha velocidade.'},
      {who: 'Você', txt: 'Meu corpo... está mudando. Os olhos queimam, e as mãos formigam.'},
      {who: 'Natalie (voz distante)', txt: 'Cada poder que você usar vai te mudar. A árvore alivia o corpo, mas deixa uma marca. Escolha bem quando lutar.'}
    ], () => {
      P.flags.canis = true; refresh(); Snd.sfx('power'); shake(8);
      burst(cxOf(pl), cyOf(pl), '#59e0d0', 30, 280, 0.9, 4);
      setBanner('Canis desperta: corrida e salto na parede');
      floatText(cxOf(pl), pl.y - 30, 'Salto na parede e corrida!', '#59e0d0', 16);
      G.hint = 'Poder: {power} (Garra Lupina). Fúria bestial: {berserk}. Na parede, segure a direção e pule para escalar.';
      G.hintT = 9;
    });
  } else if (o.kind === 'chest') openChest(o.ref);
}
/* quantas lembranças o jogador já reviveu */
const memCount = () => MEMORIAS_C1.filter(m => P.flags.lidas && P.flags.lidas[m.id]).length;
function memoryCollected() {
  const n = memCount(); floatText(cxOf(pl), pl.y - 30, `Lembrança ${n}/${MEMORIAS_C1.length}`, '#7ad0ff', 15);
  if (n === MEMORIAS_C1.length && !P.flags.memTodas) {
    P.flags.memTodas = true; P.pontos += 1; refresh(); Snd.sfx('level'); setBanner('Lembranças reunidas: +1 ponto de talento');
  }
}
function nataliTalk() {
  if (!P.flags.natalie) {
    P.flags.natalie = true;
    startDialog([
      {who: 'Natalie', txt: 'Você está vivo. Isso já é mais do que a maioria nesta vila.'},
      {who: 'H', txt: 'Quem é você? Onde estão os outros?'},
      {who: 'Natalie', txt: 'Me chamam de Natalie. Esta vila foi feita pelos que o rei deixou do lado de fora da muralha, e não me pergunte de onde eu vim. O Extermínio passou há três noites. Você foi o único que ainda respirava.'},
      {who: 'Natalie', txt: 'Sinto o sangue Tanataú em você. Há um altar no antigo mercado, a leste. O Lobo ainda atende a quem chama.'},
      {who: 'H', txt: 'Sangue de Tanataú? Eu só tentei sobreviver ao inverno.'},
      {who: 'Natalie', txt: 'Foi o que os monges nos ensinaram na floresta: quem sobreviveu ao portão fechado carrega o dom, mesmo sem saber. Mas escute: esse poder cobra. Cada vez que você o usa, o corpo muda, e sua vida resiste menos.'},
      {who: 'Natalie', txt: 'A Árvore dos Antigos limpa quase tudo, mas deixa uma marca. Escolha bem quando lutar. E se encontrar o Caçador do Extermínio, não o subestime. Ele ainda usa os troféus dos que caíram.'}
    ]);
  } else if (!P.flags.canis) startDialog([
    {who: 'Natalie', txt: 'O altar fica no mercado, depois da rua queimada. Cuidado com o fosso.'},
    {who: 'H', txt: 'E se o Lobo não me aceitar?'},
    {who: 'Natalie', txt: 'Ele não aceita os fracos nem os covardes. Você ainda não decidiu qual dos dois é.'}]);
  else if (!P.flags.bossMorto) startDialog([
    {who: 'Natalie', txt: 'Você ficou mais forte, mas lembre: descanse sob a Árvore dos Antigos para limpar a mutação.'},
    {who: 'Natalie', txt: 'Há um poço vertical depois do mercado. Use a parede para subir. O Caçador espera no fim do caminho.'}]);
  else if (P.flags.memTodas && !P.flags.natalieMem) { P.flags.natalieMem = true; startDialog([
    {who: 'Natalie', txt: 'Você está com o olhar de quem acabou de lembrar. Eu conheço esse olhar.'},
    {who: 'H', txt: 'Eu vi o portão fechar. Vi uma capa verde saltar a muralha, e o Capitão gritar um nome.'},
    {who: 'Natalie', txt: 'Eu também estava lá. Eu não consegui impedir, e ninguém precisa saber mais do que isso, por enquanto.'},
    {who: 'H', txt: 'A capa verde era a sua.'},
    {who: 'Natalie', txt: 'Era. Um dia eu te conto o resto. Hoje não. Descanse, e não me pergunte da minha casa.'}]); }
  else startDialog([
    {who: 'Natalie', txt: 'Valdemar vai querer você. Mas há tempo. Descanse, sobrevivente.'},
    {who: 'H', txt: 'Ele sabe quem eu sou?'},
    {who: 'Natalie', txt: 'Ainda não. Por isso a gente precisa ser mais rápido do que o nome dele.'}]);
}
function openChest(c) {
  P.flags.baus[c.id] = true; const lines = [], l = c.loot;
  if (l.coins) { P.coins += l.coins; lines.push(`+${l.coins} 🪙`); }
  for (const m of ['raiz', 'rimora', 'erva', 'ferro', 'aco']) if (l[m]) { P.itens[m] += l[m]; lines.push(`+${l[m]} ${MAT_NAMES[m]}`); }
  if (l.runa) { P.runas.push({elem: l.runa.elem, lvl: l.runa.lvl}); lines.push(`Runa de ${ELEMS[l.runa.elem].nome} (${ELEMS[l.runa.elem].gema}) nv ${l.runa.lvl}`); }
  if (l.arma) { P.armas.push({id: l.arma, rank: 0, ramo: null, runas: []}); lines.push(`${WEAPONS[l.arma].nome} de Ferro`); }
  if (l.armadura) { P.armaduras.push({id: l.armadura, rank: 0, runa: null}); lines.push(ARMORS[l.armadura].nome); }
  Snd.sfx('pickup'); burst(c.x + 16, c.y - 16, '#f2cc60', 14, 160, 0.6);
  lines.forEach((t, i) => floatText(c.x + 16, c.y - 30 - i * 16, t, '#f2cc60', 13));
  if (l.runa || l.arma || l.armadura) { Snd.sfx('level'); G.hint = 'Use a Árvore dos Antigos (Ferreiro) para equipar, evoluir e engastar runas.'; G.hintT = 7; }
  refresh();
}

/* ---------- diálogo ---------- */
function startDialog(lines, onEnd) {
  lines = lines.map(l => ({who: l.who === 'H' ? P.nome : l.who, txt: l.txt.replace('{nome}', P.nome)}));
  G.dialog = {lines, i: 0, c: 0, onEnd, tick: 0}; G.prevMode = G.mode; G.mode = 'dialog'; Input.clear(); Snd.sfx('page');
}
/* quem fala: define retrato e timbre da voz */
function speakerKind(who) {
  if (who === 'Você' || (P && who === P.nome)) return 'hero';
  if (/^Natalie/.test(who)) return 'natalie';
  if (/^Ca[çc]ador/.test(who) || who === 'Ferrão') return 'boss';
  if (/Canis/.test(who)) return 'lobo';
  return 'nota';
}
function updateDialog(dt) {
  const D = G.dialog, d = D.lines[D.i], Pr = Input.pressed;
  if (D.c < d.txt.length) {
    const prev = Math.floor(D.c); D.c = Math.min(d.txt.length, D.c + dt * 48);
    if (Math.floor(D.c / 2) !== Math.floor(prev / 2) && /\S/.test(d.txt[Math.floor(D.c) - 1] || ' ')) Snd.sfx('talk', speakerKind(d.who));
    if (Pr.interact || Pr.confirm || Pr.jump || Pr.attack) D.c = d.txt.length;
    return;
  }
  if (Pr.interact || Pr.confirm || Pr.jump || Pr.attack) {
    D.i++; D.c = 0; Snd.sfx('menu');
    if (D.i >= D.lines.length) {
      const cb = D.onEnd; G.dialog = null; G.mode = 'play'; Input.clear();
      if (cb) cb();
    }
  }
}
/* cena inicial do jogo novo */
function openingScene() {
  startDialog([
    {who: 'H', txt: 'Frio... cinzas por todo lado. A vila inteira... não sobrou nada.'},
    {who: 'H', txt: 'Mas uma árvore brilha logo à frente, a única coisa viva nesta vila. Alguém deve estar cuidando dela.'}
  ], () => { G.hint = 'Mova com {move}, pule com {jump}, ataque com {attack}. Chegue perto da árvore brilhante e fale com a pessoa ({interact}).'; G.hintT = 10; if (!P.flags.tutorial) startTutorial(); });
}
function checkTriggers() {
  if (pl.feral) return;
  const seen = P.flags.seen || (P.flags.seen = {}), px = cxOf(pl) / TS;
  for (const t of TRIGGERS) if (!seen[t.id] && px >= t.x && px < t.x + 12) { seen[t.id] = true; startDialog(t.lines); return; }
}

/* ---------- passo principal ---------- */
function step(dt) {
  G.time += dt; P.tempo += dt;
  G.fade = Math.max(0, G.fade - dt * 1.5);
  G.shake = Math.max(0, G.shake - dt * 22);
  G.bannerT = Math.max(0, G.bannerT - dt); if (G.hintT > 0) G.hintT -= dt;
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  if (Input.pressed.pause) { Snd.sfx('menu'); G.mode = 'menu'; UI.pause(); return; }
  G.furyFlash = Math.max(0, (G.furyFlash || 0) - dt); if (G.furyWave) { G.furyWave.t += dt; if (G.furyWave.t > 0.9) G.furyWave = null; }
  updatePlayer(dt);
  if (G.mode !== 'play') return;
  if (pl.berserk) for (const c of L.camps) if (Math.abs(cxOf(pl) - c.x) < 70 && Math.abs(pl.y + pl.h - c.y) < 60) { endBerserk(true); break; }
  updateEnemies(dt); updateProjs(dt); updateDrops(dt);
  if (P.elixirT > 0) { P.elixirT -= dt; if (P.elixirT <= 0) { P.elixirT = 0; refresh(); floatText(cxOf(pl), pl.y - 30, 'O Elixir da Sorte acabou', '#9fe0a0', 12); } }
  if (G.bossActive && G.boss) Snd.setIntensity(1 - G.boss.hp / G.boss.hpMax);

  // portão e chefe
  if (!P.flags.bossMorto && !G.gateClosed && cxOf(pl) > L.arenaX && G.boss) {
    closeGate(true); G.bossActive = false; Snd.sfx('boss'); shake(10); Snd.setMode('boss');
    startDialog([
      {who: 'Caçador do Extermínio', txt: 'Mais um que devia ter morrido do lado de fora das muralhas. Eu pendurei o último na parede.'},
      {who: 'Caçador do Extermínio', txt: 'Venha. Quero ver quanto de lobo já cresceu em você.'}
    ], () => { G.bossActive = true; });
  }
  if (P.flags.bossMorto && cxOf(pl) > L.exitX) { G.mode = 'end'; Snd.setMode('camp'); UI.end(); return; }
  if (G.boss && G.boss.dead) G.boss = null;

  // partículas e textos
  for (const p of G.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
  G.parts = G.parts.filter(p => p.life > 0);
  for (const t of G.texts) { t.life -= dt; t.y -= 26 * dt; }
  G.texts = G.texts.filter(t => t.life > 0);

  if (G.mode === 'play' && pl.onGround) { checkTriggers(); if (G.mode !== 'play') return; }

  // interação
  G.near = nearest();
  if (G.near && Input.pressed.interact && pl.onGround && !pl.atk) interact(G.near);

  // câmera
  let camTx = cxOf(pl) - VW / 2 + pl.facing * 50;
  if (G.bossActive && G.boss && !G.boss.dead) {   // na luta, a câmera enquadra o herói e o chefe (sem perder o herói de vista)
    const mid = (cxOf(pl) + cxOf(G.boss)) / 2 - VW / 2;
    camTx = clampCam(mid, cxOf(pl) - VW + 110, cxOf(pl) - 110);
  }
  const tx = clampCam(camTx, 0, L.w * TS - VW), ty = clampCam(pl.y - VH * 0.55, 0, L.h * TS - VH);
  G.cam.x += (tx - G.cam.x) * Math.min(1, dt * 6); G.cam.y += (ty - G.cam.y) * Math.min(1, dt * 5);
  refresh();
}

/* ---------- laço principal ---------- */
let lastT = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  Input.poll();
  if (CINE) updateCine(dt);
  if (G) {
    if (G.mode === 'play') step(dt);
    else if (G.mode === 'dialog') {
      G.time += dt; updateDialog(dt);
      for (const p of G.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; }
    } else if (G.mode === 'tutorial') { G.time += dt; updateTut(dt);
    } else if (G.mode === 'dead') {
      G.deadT += dt;
      if (G.deadT > 3.0) respawn();
    } else if (G.mode === 'menu' || G.mode === 'end') G.time += dt;
  }
  UI.pollNav();
  render(dt);
  requestAnimationFrame(frame);
}
