'use strict';
/* ===== Desenho: mundo em pixel art com iluminação (canvas 640x360) e interface (canvas 960x540) ===== */
const cv = document.getElementById('cv'), cx = cv.getContext('2d');
const hudc = document.getElementById('hud'), hx = hudc.getContext('2d');
cx.imageSmoothingEnabled = false;
const HW = 960, HH = 540, HS = HW / VW;
const EMOJI_FONT = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
const [lcv, lx] = mk(VW, VH), [bcv, bx] = mk(VW >> 2, VH >> 2);
let PROPS = [], titleT = 0, lights = [];
const flakes = Array.from({length: 150}, (_, i) => ({x: Math.random() * VW, y: Math.random() * VH, s: 0.5 + Math.random() * 1.6, p: Math.random() * 6, z: i % 3}));

function ensureArt() { if (!ART.atlas) { makeAtlas(); makeBackdrops(); makeProps(); } }
function initArt() {
  ensureArt(); PROPS = [];
  const avoid = [...L.camps.map(c => c.x / TS), ...L.npcs.map(n => n.x / TS), L.altar.x / TS, ...L.chests.map(c => c.x / TS)];
  const types = ['rubble', 'barrel', 'crate', 'fence', 'cart', 'grave', 'sacks', 'posts', 'chimney', 'rubble', 'lamp'];
  for (let i = 0; i < 90; i++) {
    const tx = 2 + Math.floor(hash(i * 3 + 1) * 196), ty = L.GROUND;
    if (solidTile(tileAt(tx, ty - 1)) || !solidTile(tileAt(tx, ty))) continue;
    if (avoid.some(a => Math.abs(a - tx) < 4) || (tx >= 168 && tx <= 173)) continue;
    const type = tx > 168 ? 'rubble' : types[Math.floor(hash(i + 7) * types.length)];
    PROPS.push({type, v: Math.floor(hash(i + 9) * 3), x: tx * TS + 16 + (hash(i) - 0.5) * 12, y: ty * TS, z: hash(i + 2) > 0.5 ? 0 : 1});
  }
  for (let x = 131; x < 154; x += 4 + Math.floor(hash(x) * 5)) PROPS.push({type: x % 8 ? 'lamp' : 'barrel', v: 0, x: x * TS + 16, y: 18 * TS, z: 0});
  PROPS.push({type: 'banner', v: 0, x: 177 * TS, y: L.GROUND * TS, z: 0}, {type: 'banner', v: 0, x: 192 * TS, y: L.GROUND * TS, z: 0}, {type: 'lamp', v: 0, x: 183 * TS, y: L.GROUND * TS, z: 0});
  for (const c of L.camps) PROPS.push({type: 'lamp', v: 0, x: c.x + 52, y: c.y, z: 0});
  PROPS.sort((a, b) => a.z - b.z);
}
const addLight = (x, y, r, i = 1, col = null, a = 0.3) => lights.push({x, y, r, i, col, a});

/* ---------- fundo ---------- */
function drawFarImage(camX, camY) {
  const im = BG.far.img, h = VH * 1.1, w = im.width * h / im.height, gy = L ? L.GROUND * TS - camY : VH * 0.8;
  const x = -Math.max(0, Math.min(w - VW, camX * 0.02)), y = Math.max(VH - h, Math.min(0, gy + 40 - h));
  cx.drawImage(im, x, y, w, h);
}
function drawSky(t, camX = 0, camY = 0) {
  if (BG.far.ok) { drawFarImage(camX, camY); return; }
  const g = cx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, '#0b1334'); g.addColorStop(0.55, '#223a6b'); g.addColorStop(1, '#4d6ca2');
  cx.fillStyle = g; cx.fillRect(0, 0, VW, VH);
  for (let i = 0; i < 70; i++) { const x = hash(i) * VW, y = hash(i + 99) * VH * 0.55; cx.globalAlpha = 0.35 + 0.5 * hash(i + 7) * (0.6 + 0.4 * Math.sin(t * 2 + i)); cx.fillStyle = '#dbe6ff'; cx.fillRect(Math.floor(x), Math.floor(y), 1, 1); }
  cx.globalAlpha = 1;
  const mx = VW * 0.8, my = 52; const mg = cx.createRadialGradient(mx, my, 6, mx, my, 70); mg.addColorStop(0, 'rgba(210,225,255,0.55)'); mg.addColorStop(1, 'rgba(210,225,255,0)'); cx.fillStyle = mg; cx.fillRect(mx - 70, my - 70, 140, 140);
  cx.fillStyle = '#e8f0ff'; cx.beginPath(); cx.arc(mx, my, 14, 0, 7); cx.fill(); cx.fillStyle = '#c4d2ee'; cx.fillRect(mx - 6, my - 4, 4, 3); cx.fillRect(mx + 2, my + 3, 5, 3);
  cx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    cx.beginPath(); cx.moveTo(0, 0);
    for (let x = 0; x <= VW; x += 16) cx.lineTo(x, 70 + k * 22 + Math.sin(x * 0.012 + t * 0.35 + k * 2) * 20);
    cx.lineTo(VW, 0); cx.closePath();
    cx.fillStyle = ['rgba(60,200,160,0.06)', 'rgba(80,130,255,0.06)', 'rgba(170,110,255,0.05)'][k]; cx.fill();
  }
  cx.globalCompositeOperation = 'source-over';
}
function tileLayer(img, camX, f, y) {
  const W = img.width, off = -(((camX * f) % W) + W) % W;
  for (let x = off; x < VW; x += W) cx.drawImage(img, Math.round(x), Math.round(y));
}
/* camada de imagem repetida em espelho (sem emenda), com parallax f, base em bottomY e altura h */
function tileImg(img, camX, f, bottomY, h, alpha = 1) {
  const sc = h / img.height, W = img.width * sc, off = -((camX * f) % (W * 2) + W * 2) % (W * 2);
  cx.save(); cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high'; cx.globalAlpha = alpha;
  for (let i = 0, x = off; x < VW; i++, x += W) {
    if (x + W < 0) continue;
    if (i % 2 === 0) cx.drawImage(img, Math.round(x), Math.round(bottomY - h), Math.ceil(W), Math.round(h));
    else { cx.save(); cx.translate(Math.round(x) + Math.ceil(W), 0); cx.scale(-1, 1); cx.drawImage(img, 0, Math.round(bottomY - h), Math.ceil(W), Math.round(h)); cx.restore(); }
  }
  cx.restore();
}
function drawBackdrops(camX, camY, groundY, t) {
  const gy = groundY - camY;
  if (BG.mid.ok) tileImg(BG.mid.img, camX, 0.22, gy + 40 + camY * 0.2, 175);
  if (BG.near.ok) tileImg(BG.near.img, camX, 0.5, gy + 14 + camY * 0.05, 135);
  if (!BG.far.ok) tileLayer(ART.far, camX, 0.08, gy - 230 + 10 + camY * 0.45);
  if (!BG.mid.ok) tileLayer(ART.mid, camX, 0.22, gy - 250 + 18 + camY * 0.25);
  if (!BG.near.ok) tileLayer(ART.near, camX, 0.5, gy - 280 + 6 + camY * 0.05);
}

/* ---------- tiles ---------- */
function drawTiles(camX, camY) {
  const x0 = Math.max(0, Math.floor(camX / TS)), x1 = Math.min(L.w - 1, Math.floor((camX + VW) / TS));
  const y0 = Math.max(0, Math.floor(camY / TS) - 1), y1 = Math.min(L.h - 1, Math.floor((camY + VH) / TS));
  const A = ART.atlas;
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = L.tiles[ty * L.w + tx]; if (!t) continue;
    const x = tx * TS - camX, y = ty * TS - camY, v = Math.floor(hash(tx * 7 + ty * 13) * 4);
    if (t === 1) {
      cx.drawImage(A, v * 32, 0, 32, 32, x, y, 32, 32);
      if (ty > L.GROUND + 1) { cx.fillStyle = `rgba(2,4,14,${Math.min(0.6, (ty - L.GROUND) * 0.1)})`; cx.fillRect(x, y, 32, 32); }
      if (!solidTile(tileAt(tx - 1, ty)) && tileAt(tx - 1, ty) !== 2) { cx.fillStyle = 'rgba(2,4,16,0.5)'; cx.fillRect(x, y, 2, 32); cx.fillStyle = 'rgba(2,4,16,0.22)'; cx.fillRect(x + 2, y, 3, 32); }
      if (!solidTile(tileAt(tx + 1, ty))) { cx.fillStyle = 'rgba(190,215,255,0.35)'; cx.fillRect(x + 31, y, 1, 32); }
      if (solidTile(tileAt(tx, ty - 1))) { cx.fillStyle = 'rgba(2,4,16,0.18)'; cx.fillRect(x, y, 32, 4); }
      if (!solidTile(tileAt(tx, ty + 1)) && tileAt(tx, ty + 1) !== 2) { cx.fillStyle = 'rgba(2,4,16,0.4)'; cx.fillRect(x, y + 28, 32, 4); }
      if (!solidTile(tileAt(tx, ty - 1))) cx.drawImage(A, (4 + v) * 32, 0, 32, 32, x, y - 3, 32, 32);
      if (!solidTile(tileAt(tx, ty + 1)) && tileAt(tx, ty + 1) !== 2 && hash(tx * 5 + ty * 3) < 0.4) {
        const ix = x + 4 + Math.floor(hash(tx + ty) * 22), il = 5 + Math.floor(hash(tx * 3 + ty) * 8);
        for (let r = 0; r < il; r++) { cx.fillStyle = r < 2 ? '#e8f3ff' : '#9fc4ea'; cx.fillRect(ix - Math.floor((il - r) / 4), y + 32 + r, Math.max(1, 4 - Math.floor(r * 0.5)), 1); }
      }
    } else if (t === 2) cx.drawImage(A, 8 * 32, 0, 32, 12, x, y, 32, 12);
    else if (t === 3) cx.drawImage(A, 9 * 32, 0, 32, 32, x, y, 32, 32);
    else if (t === 4) cx.drawImage(A, 10 * 32, 0, 32, 32, x, y, 32, 32);
    else if (t === 6) cx.drawImage(A, 11 * 32, 0, 32, 32, x, y, 32, 32);
  }
}
function prop(p, camX, camY, t) {
  if (p.type === 'lamp' && SCN.ok) {
    const x0 = p.x - camX; if (x0 < -60 || x0 > VW + 60) return;
    drawScn(7, x0, p.y - camY + 1); addLight(x0, p.y - 44 - camY, 110, 0.85, '#ff9a3c', 0.2 + 0.05 * Math.sin(t * 11 + p.x)); return;
  }
  if (SPRP.ok && SPRP.idx[p.type]) { const x0 = p.x - camX; if (x0 < -80 || x0 > VW + 80) return; drawPropSpr(p.type, p.v, x0, p.y - camY); return; }
  let img = ART.props[p.type]; if (!img) return; if (Array.isArray(img)) img = img[p.v % img.length];
  const x = Math.round(p.x - img.width / 2 - camX), y = Math.round(p.y - img.height + 1 - camY);
  if (x < -60 || x > VW + 60) return;
  cx.drawImage(img, x, y);
  if (p.type === 'lamp') { addLight(p.x - camX, p.y - 42 - camY, 110, 0.85, '#ff9a3c', 0.2 + 0.05 * Math.sin(t * 11 + p.x)); flame(cx, p.x - camX - 0.5, p.y - 39 - camY, 4, 7 + Math.sin(t * 13 + p.x) * 1.5, '#ffd36e', t, p.x); }
}

/* ---------- objetos e entidades ---------- */
/* ícone do item no mundo: sprite se houver, senão uma gema com a cor da raridade */
function drawDropIcon(info, x, y, size) {
  const ic = iconFor(info.kind, info.id);
  if (ic) { cx.save(); cx.imageSmoothingEnabled = false; cx.drawImage(ic.img, ic.p[0] * 64, ic.p[1] * 64, 64, 64, Math.round(x - size / 2), Math.round(y - size / 2), size, size); cx.restore(); return; }
  const s = size / 2; cx.save(); cx.fillStyle = '#10131a'; cx.beginPath(); cx.moveTo(x, y - s - 1); cx.lineTo(x + s + 1, y); cx.lineTo(x, y + s + 1); cx.lineTo(x - s - 1, y); cx.closePath(); cx.fill();
  cx.fillStyle = info.cor; cx.beginPath(); cx.moveTo(x, y - s + 1); cx.lineTo(x + s - 1, y); cx.lineTo(x, y + s - 1); cx.lineTo(x - s + 1, y); cx.closePath(); cx.fill();
  cx.fillStyle = 'rgba(255,255,255,0.55)'; cx.fillRect(Math.round(x) - 1, Math.round(y) - s / 2, 2, 2); cx.restore();
}
function drawWorldObjects(camX, camY, t) {
  for (const c of L.camps) {
    const x = c.x - camX, y = c.y - camY; if (x < -120 || x > VW + 120) continue;
    const near = Math.abs(cxOf(pl) - c.x) < 90 && Math.abs(pl.y + pl.h - c.y) < 60, lit = P.flags.lit && P.flags.lit[c.id];
    const target = (G.restFx && G.restFx.camp === c.id && G.time - G.restFx.t0 < 2.5) ? 1 : near ? 0.95 : lit ? 0.5 : 0;
    c.glow = (c.glow || 0) + (target - (c.glow || 0)) * 0.05;
    const h = TREE.ok ? drawTree(x, y + 3, t, c.glow, c.id * 3.1) : (drawFire(cx, x, y - 3, t, 1), 40);
    addLight(x, y - h * 0.5, 230 + Math.sin(t * 2) * 8, 1, '#7affd0', 0.05 + 0.2 * (c.glow || 0));
    if (G.mode === 'play' && c.glow > 0.3 && Math.random() < 0.05 + 0.1 * c.glow) treeLeavesSpawn(c.x, c.y, t, 1, false);
    const rf = G.restFx; if (rf && rf.camp === c.id) {   // onda de luz ao descansar
      const a = (G.time - rf.t0) / 1.6; if (a >= 0 && a < 1) { cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = (1 - a) * 0.8; cx.strokeStyle = '#9fffe0'; cx.lineWidth = 3 * (1 - a) + 1; cx.beginPath(); cx.ellipse(x, y - 4, 20 + a * 150, 6 + a * 34, 0, 0, 7); cx.stroke(); cx.restore(); }
    }
  }
  drawTreeLeaves(camX, camY, t);
  for (const n of L.notes) {
    const x = n.x - camX, y = n.y - camY; if (x < -40 || x > VW + 40) continue;
    if (n.needBoss && !P.flags.bossMorto) continue;
    const lida = P.flags.lidas && P.flags.lidas[n.id], bob = Math.sin(t * 2.4 + n.x) * 1.5;
    if (n.mem) {   // lembrança: chama azul flutuante
      const a = lida ? 0.35 : 1, py = y - 22 + Math.sin(t * 2 + n.x) * 3;
      cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'lighter';
      const g = cx.createRadialGradient(x, py, 0, x, py, 16); g.addColorStop(0, 'rgba(180,230,255,0.95)'); g.addColorStop(0.4, 'rgba(90,170,255,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.fillStyle = g; cx.fillRect(x - 16, py - 16, 32, 32);
      cx.fillStyle = '#e8f8ff'; cx.fillRect(Math.round(x) - 1, Math.round(py) - 2, 2, 4); cx.fillRect(Math.round(x) - 2, Math.round(py) - 1, 4, 2); cx.restore();
      if (G.mode === 'play' && !lida && Math.random() < 0.12) G.parts.push({x: n.x + (Math.random() - 0.5) * 10, y: n.y - 20, vx: (Math.random() - 0.5) * 10, vy: -20, life: 1.2, max: 1.2, col: '#9fd8ff', size: 1, add: true});
      addLight(x, py, 70, 0.6, '#7ad0ff', lida ? 0.06 : 0.22); continue;
    }
    if (SCN.ok) drawScn(6, x, y + 1);
    else { R(cx, x - 1, y - 14, 3, 14, '#3a2e22'); R(cx, x - 7, y - 24, 14, 11, '#c9b88a'); R(cx, x - 7, y - 24, 14, 1, '#efe2b8'); R(cx, x - 7, y - 14, 14, 1, '#8b7a52'); }
    if (!lida) { cx.fillStyle = '#ffd36e'; cx.fillRect(x - 1, y - 62 + bob, 2, 4); cx.fillRect(x - 1, y - 56 + bob, 2, 2); }
    addLight(x, y - 18, 46, 0.5, '#ffd36e', lida ? 0.05 : 0.12);
  }
  for (const n of L.npcs) {
    const x = n.x - camX, y = n.y - camY; if (x < -60 || x > VW + 60) continue;
    if (n.id === 'bazar') {   // mercador de testes: tudo grátis
      if (!hasSheet('mercador')) drawSheet('natalie', 'idle', t, 0, x, y, cxOf(pl) < n.x, {filter: 'hue-rotate(160deg) saturate(1.2) brightness(1.05)'});
      else drawSheet('mercador', 'idle', t, 0, x, y, cxOf(pl) < n.x);
      const bob = Math.sin(t * 3) * 2; glowBlob(x, y - 62 + bob, 14, '#ffd36e', 0.45); cx.fillStyle = '#ffe9a0'; cx.fillRect(Math.round(x) - 2, Math.round(y - 66 + bob), 4, 4); cx.fillRect(Math.round(x) - 1, Math.round(y - 69 + bob), 2, 10);
      addLight(x, y - 24, 80, 0.6, '#ffd36e', 0.16); continue;
    }
    if (!drawSheet('natalie', G.mode === 'dialog' && G.near && G.near.kind === 'npc' ? 'special' : 'idle', t, 0, x, y, cxOf(pl) < n.x))
      blit(cx, c => drawHuman(c, {t, mode: 'idle', vx: 0, vy: 0, atk: null, wpn: null, pal: PAL_NATALIE, stage: 0, robe: true}), x, y, cxOf(pl) < n.x);
    addLight(x, y - 20, 70, 0.5, '#59e0d0', 0.15);
  }
  {   // Altar do Lobo: dormente de longe, desperto quando o herói chega perto; depois do despertar fica aceso
    const x = L.altar.x - camX, y = L.altar.y - camY;
    if (x > -80 && x < VW + 80) {
      const near = Math.abs(cxOf(pl) - L.altar.x) < 130, target = P.flags.canis ? 0.55 : near ? 1 : 0.15;
      L.altar.glow = (L.altar.glow || 0) + (target - (L.altar.glow || 0)) * 0.06;
      if (SCN.ok) { drawScn(4, x, y + 2); drawScn(5, x, y + 2 + (P.flags.canis ? 0 : Math.sin(t * 2.4) * 1.5), Math.min(1, L.altar.glow * (0.85 + 0.15 * Math.sin(t * 3)))); }
      else cx.drawImage(ART.props.altar, Math.round(x - 20), Math.round(y - 63));
      addLight(x, y - 32, 130, 0.9, '#59e0d0', 0.08 + 0.3 * L.altar.glow);
      if (!P.flags.canis && G.mode === 'play' && Math.random() < 0.15 * L.altar.glow) G.parts.push({x: L.altar.x + (Math.random() - 0.5) * 36, y: L.altar.y - 30, vx: 0, vy: -26, life: 1, max: 1, col: '#7ff0ff', size: 1, add: true});
    }
  }
  for (const ch of L.chests) {
    if (ch.needBoss && !P.flags.bossMorto) continue;
    const x = ch.x + 16 - camX, y = ch.y - camY, open = P.flags.baus[ch.id];
    if (x < -40 || x > VW + 40) continue;
    const rune = ch.secret || ch.needBoss || (ch.loot && (ch.loot.armadura || ch.loot.runa));
    if (SCN.ok) drawScn((rune ? 2 : 0) + (open ? 1 : 0), x, y + 1);
    else { const img = open ? ART.props.chestOpen : ART.props.chest; cx.drawImage(img, Math.round(x - img.width / 2), Math.round(y - img.height + 1)); }
    if (!open) { addLight(x, y - 10, 46, 0.7, rune ? '#7ff0ff' : '#ffd666', 0.32 + 0.1 * Math.sin(t * 5)); if (G.mode === 'play' && Math.random() < 0.05) G.parts.push({x: ch.x + 8 + Math.random() * 16, y: ch.y - 14, vx: 0, vy: -20, life: 0.8, max: 0.8, col: '#ffe9a0', size: 1, add: true}); }
  }
  for (const d of G.drops) {   // itens caídos: materiais pequenos; equipamento, runas e receitas com feixe de luz da raridade
    const x = d.x + 6 - camX, bob = d.onGround ? Math.sin(t * 3 + d.id * 9) * 2 : 0, y = d.y + 6 - camY - (d.onGround ? 5 : 0) + bob;
    if (x < -30 || x > VW + 30) continue;
    if (d.age > (d.info.auto ? 62 : 232) && Math.floor(t * 8) % 2) continue;
    const info = d.info, big = !info.auto;
    if (big) {
      const gr = cx.createLinearGradient(0, y - 80, 0, y + 6); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, info.cor);
      cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 4); cx.fillStyle = gr; cx.fillRect(x - 5, y - 80, 10, 86); cx.restore();
    }
    glowBlob(x, y, big ? 26 : 13, info.cor, big ? 0.5 : 0.35);
    drawDropIcon(info, x, y, big ? 24 : 16);
    addLight(x, y, big ? 60 : 28, 0.5, info.cor, big ? 0.22 : 0.1);
  }
  if (P.flags.bossMorto) { const x = L.exitX - camX, y = L.GROUND * TS - camY; if (!drawPropSpr('flag', 0, x, y)) cx.drawImage(ART.props.flag, Math.round(x - 13), Math.round(y - 59)); addLight(x, y - 30, 70, 0.6, '#7ee787', 0.2); }
  if (P.sombra) {
    const x = P.sombra.x + 10 - camX, y = P.sombra.y + 28 - camY + Math.sin(t * 3) * 3;
    blit(cx, c => { R(c, -6, -26, 12, 20, 'rgba(180,150,255,0.8)'); R(c, -5, -30, 10, 6, 'rgba(200,180,255,0.9)'); for (let i = 0; i < 4; i++) R(c, -6 + i * 3, -6 + (i % 2) * 2, 3, 4, 'rgba(180,150,255,0.8)'); R(c, -3, -27, 2, 3, '#201040'); R(c, 1, -27, 2, 3, '#201040'); }, x, y, false, {alpha: 0.8, outline: 'rgba(100,60,200,0.6)'});
    addLight(x, y - 12, 60, 0.6, '#a078ff', 0.3);
  }
}
function humanMode(e) { if (e.stun > 0 && e.flash > 0) return 'hurt'; if (!e.onGround) return 'air'; if (Math.abs(e.vx) > 20) return 'run'; return 'idle'; }
function enemySheetAnim(e) {
  const mv = Math.abs(e.vx) > 20;
  if (e.stun > 0 && e.flash > 0) return {an: 'hurt', p: 0};
  if (e.type === 'lobo') {
    if (e.state === 'wind') return {an: 'attack1', p: 0.1};
    if (e.state === 'lunge') return {an: 'attack1', p: 0.7};
    return {an: !e.onGround ? 'fall' : mv ? 'run' : 'idle', p: 0};
  }
  if (e.type === 'soldado') {
    if (e.state === 'wind') return {an: 'attack1', p: 0.04 + (1 - Math.max(0, e.t) / 0.55) * 0.3};
    if (e.state === 'swing') return {an: 'attack1', p: 0.5 + (1 - e.t / 0.18) * 0.5};
    return {an: mv ? 'run' : 'idle', p: 0};
  }
  if (e.type === 'besta') return {an: e.state === 'aim' ? 'attack1' : mv ? 'run' : 'idle', p: e.state === 'aim' ? 1 - Math.max(0, e.t) / 0.6 : 0};
  if (e.state === 'dash') return {an: e.phase === 0 ? 'dodge' : 'attack3', p: 0.5};
  if (e.state === 'leap') return {an: e.phase === 0 ? 'dodge' : e.onGround ? 'attack2' : 'jump', p: 0.5};
  if (e.state === 'volley') return {an: 'attack1', p: e.phase === 0 ? 1 - Math.max(0, e.t) / 0.9 : 1};
  return {an: mv ? 'run' : 'idle', p: 0};
}
function drawEnemy(e, camX, camY, t) {
  const x = cxOf(e) - camX, yb = e.y + e.h - camY;
  if (x < -80 || x > VW + 80) return;
  const o = {flash: e.flash, tint: e.fx.veneno ? 'rgba(120,255,100,0.18)' : (e.fx.fogo ? 'rgba(255,120,40,0.18)' : null)};
  const sa = enemySheetAnim(e);
  if (hasSheet(e.type) && drawSheet(e.type, sa.an, e.anim, sa.p, x, yb, e.dir < 0, o)) {
    if (e.aggro && e.type === 'lobo') addLight(x + e.dir * 12, yb - 12, 14, 0.5, '#ffd24a', 0.4);
  } else if (e.type === 'lobo') {
    blit(cx, c => drawWolf(c, {t: e.anim, vx: e.vx, vy: e.vy, state: e.state, onGround: e.onGround}), x, yb, e.dir < 0, o);
    if (e.aggro) addLight(x + e.dir * 12, yb - 12, 14, 0.5, '#ffd24a', 0.4);
  } else {
    let atk = null, aim = false, mode = humanMode(e), wpn = 'sword', shield = false, pal = PAL_SOLDADO, scale = 1;
    if (e.type === 'soldado') {
      shield = true;
      if (e.state === 'wind') atk = {p: 0.04 + (1 - Math.max(0, e.t) / 0.55) * 0.12, step: 1, dir: 'fwd'};
      else if (e.state === 'swing') atk = {p: 0.35 + (1 - e.t / 0.18) * 0.6, step: 1, dir: 'fwd'};
    } else if (e.type === 'besta') { pal = PAL_BESTA; wpn = 'crossbow'; aim = e.state === 'aim' || e.state === 'engage'; }
    else {
      pal = PAL_BOSS; scale = 1.22; wpn = e.state === 'volley' ? 'crossbow' : 'blade'; aim = e.state === 'volley';
      if (e.state === 'dash') { if (e.phase === 0) mode = 'dodge'; else atk = {p: 0.55, step: 3, dir: 'fwd'}; }
      if (e.state === 'leap' && e.phase === 0) mode = 'dodge';
      if (e.state === 'idle' && e.vuln > 0) mode = 'hurt';
    }
    blit(cx, c => drawHuman(c, {t: e.anim, mode, vx: e.vx, vy: e.vy, atk, wpn, pal, stage: 0, shield, aim, scale}), x, yb, e.dir < 0, o);
  }
  if (e.boss) addLight(x + e.dir * 3, yb - 44, 22, 0.8, '#ff3030', 0.45);
  const tele = e.state === 'wind' || e.state === 'aim' || (e.boss && e.phase === 0 && (e.state === 'volley' || e.state === 'dash' || e.state === 'leap'));
  if (tele) {
    const ey = yb - e.h - 12; R(cx, x - 1, ey - 8, 3, 8, '#ff3b3b'); R(cx, x - 1, ey + 2, 3, 3, '#ff3b3b'); addLight(x, ey, 26, 0.4, '#ff3030', 0.5);
    if (e.boss && e.state === 'dash') { cx.fillStyle = 'rgba(255,60,60,0.22)'; cx.fillRect(e.dir > 0 ? x : x - 320, yb - e.h, 320, e.h); }
  }
  if (e.fx.fogo) { flame(cx, x - 5, yb - e.h - 2, 6, 9 + Math.sin(t * 14) * 2, '#ff8a2a', t, 1); addLight(x, yb - e.h / 2, 40, 0.5, '#ff7a2f', 0.25); }
  if (e.fx.veneno) for (let i = 0; i < 3; i++) R(cx, x + 3 + i * 3, yb - e.h - 3 - ((t * 20 + i * 5) % 8), 2, 2, '#7ed957');
  if (!e.boss && e.hp < e.hpMax) { R(cx, x - 11, yb - e.h - 9, 22, 3, '#0a0d18'); R(cx, x - 10, yb - e.h - 8, 20 * Math.max(0, e.hp / e.hpMax), 1, '#e0453a'); }
}
const CLASS_LOOK = {
  barbaro: {cloak: '#7a3a2a', cloakD: '#552618', fur: '#9a8a76', scarf: null},
  cacador: {cloak: '#3f6b4a', cloakD: '#2c4d36', hood: '#2f5a3c', scarf: '#d9b04a', scarfD: '#a88a2c', quiver: true},
  guardiao: {cloak: '#34486e', cloakD: '#24334f', helm: '#8a96b0', plate: '#6c7894', scarf: null},
  cacique: {cloak: '#5e7a3e', cloakD: '#445a2c', skin: '#b88458', skinD: '#946a44', scarf: '#c8503c', scarfD: '#9a3a2a'}
};
/* suavização do herói: inclinação ao correr, esticar/amassar no pulo e na aterrissagem, avanço no golpe, giro ao virar */
function playerXf(mode, atk, t, f) {
  const dt = Math.min(0.05, Math.max(0, t - (pl.lastDrawT || t))); pl.lastDrawT = t;
  pl.faceX = pl.faceX === undefined ? f : pl.faceX + (f - pl.faceX) * Math.min(1, dt * 22);
  if (Math.abs(pl.faceX - f) < 0.08) pl.faceX = f;
  pl.animClock = (pl.animClock || 0) + dt * (mode === 'run' ? 0.5 + Math.min(1.3, Math.abs(pl.vx) / 230) : 1);
  pl.squash = Math.max(0, (pl.squash || 0) - dt * 5.5);
  const turn = Math.abs(pl.faceX);                       // 1 = de frente, ~0 no meio do giro
  let sx = 0.55 + 0.45 * turn, sy = 1, rot = 0, dx = 0;
  if (mode === 'idle') sy += Math.sin(t * 2.4) * 0.012;
  if (mode === 'run') rot = 0.07 * Math.min(1, Math.abs(pl.vx) / 230);
  if (mode === 'air') { const k = Math.max(-1, Math.min(1, pl.vy / 600)); sy += k < 0 ? -k * 0.1 : -k * 0.04; sx -= (sy - 1) * 0.8; rot = pl.vy < 0 ? -0.03 : 0.05; }
  if (mode === 'dodge') { sx *= 1.14; sy *= 0.9; rot = 0.12; }
  if (mode === 'hurt') { rot = -0.16; sy *= 0.96; }
  if (atk) { const q = Math.sin(Math.min(1, atk.p) * Math.PI); dx = q * (atk.step >= 3 ? 7 : 4); rot += q * 0.08; sy *= 1 - q * 0.03; }
  if (pl.squash > 0) { sy *= 1 - pl.squash * 0.16; sx *= 1 + pl.squash * 0.12; }
  return {sx, sy, rot, dx};
}
/* espírito do Tanataú: o animal, translúcido e luminoso, envolvendo o herói (mais forte e maior na forma animal) */
function drawSpirit(x, yb, t, f, strong) {
  const T = TAN(), run = Math.abs(pl.vx) > 60, bob = Math.sin(t * 3) * 3, sc = 2.8;
  glowBlob(x, yb - 22, strong ? 70 : 58, T.cor, strong ? 0.36 : 0.3);
  cx.save(); cx.globalCompositeOperation = 'lighter';
  bigSheet(T.sprite, run ? 'run' : 'idle', t * 1.2, x - f * 12, yb + 8 + bob, sc, f < 0, {tint: `rgba(${T.rgb},0.9)`, alpha: 0.56 + 0.1 * Math.sin(t * 7)});
  cx.restore();
  if (G.mode === 'play' && Math.random() < 0.5) G.parts.push({x: cxOf(pl) - f * (6 + Math.random() * 18), y: pl.y + Math.random() * pl.h, vx: -f * (10 + Math.random() * 30), vy: -20 - Math.random() * 30, life: 0.8, max: 0.8, col: Math.random() < 0.5 ? T.cor : T.claro, size: 1, add: true});
}
/* herói 100% animal: o animal em si, sólido e imponente, com olhos luminosos, rastro e o espírito atrás */
function drawFeral(x, yb, t, mode, atk) {
  const T = TAN(), f = pl.facing, an = atk ? 'attack1' : (mode === 'run' || mode === 'air') ? 'run' : 'idle', k = 2.0;
  if (Math.abs(pl.vx) > 60) for (let q = 3; q >= 1; q--) bigSheet(T.sprite, 'run', pl.animClock || t, x - f * q * 12, yb, k, f < 0, {alpha: 0.12 * (4 - q) / 3, tint: 'rgba(10,10,10,0.5)'});   // só um leve borrão de velocidade
  const ok = bigSheet(T.sprite, an, (pl.animClock || t) * 1.3, x, yb, k, f < 0, {flash: pl.hurtT > 0 ? 0.12 : 0, alpha: 1}, atk ? atk.p : 0);
  if (!ok) blit(cx, c => { c.scale(2, 2); drawWolf(c, {t, vx: pl.vx, vy: 0, state: 'patrol', onGround: true}); }, x, yb, f < 0);
  cx.fillStyle = T.claro; cx.fillRect(Math.round(x + f * 22), Math.round(yb - 34), 3, 3); cx.fillRect(Math.round(x + f * 14), Math.round(yb - 34), 3, 3); glowBlob(x + f * 18, yb - 33, 9, T.cor, 0.6);
  addLight(x, yb - 16, 160, 0.8, T.cor, 0.12);
}
function drawPlayerSprite(camX, camY, t) {
  if (pl.dead) return;
  const stage = mutStage(P), wid = P.armas[P.arma].id, f = pl.facing;
  let mode = 'idle';
  if (pl.dodgeT > 0 || pl.powerT > 0 || pl.dashT > 0) mode = 'dodge';
  else if (pl.hurtT > 0) mode = 'hurt';
  else if (!pl.onGround) mode = (pl.wallDir && pl.vy > 0 && P.flags.canis && Math.sign(Input.axisX) === pl.wallDir) ? 'wall' : 'air';
  else if (Math.abs(pl.vx) > 25) mode = 'run';
  const atk = pl.atk ? {p: Math.min(1, pl.atk.t / pl.atk.dur), step: pl.atk.step, dir: pl.atk.dir} : null;
  const pal = Object.assign({}, PAL_PLAYER, CLASS_LOOK[P.classe] || {});
  if (stage >= 2) { pal.skin = '#b8a898'; pal.skinD = '#968a7c'; }
  if (stage >= 3) { pal.arm = '#8b8f9d'; pal.clothL = '#9a9ea8'; }
  const h = {t, mode, vx: pl.vx, vy: pl.vy, atk, wpn: {espada: 'sword', machado: 'axe', lanca: 'spear', manoplas: 'fist', cajado: 'cstaff', martelo: 'axe'}[wid], pal, stage, shield: P.classe === 'guardiao'};
  const x = cxOf(pl) - camX, yb = pl.y + pl.h - camY;
  if (pl.dodgeT > 0 || pl.powerT > 0 || pl.dashT > 0) for (let k = 3; k >= 1; k--) blit(cx, c => drawHuman(c, h), x - f * k * 11, yb, f < 0, {alpha: 0.18 * (4 - k) / 3, outline: pl.powerT > 0 ? '#59e0d0' : '#9cd3ff'});
  if (pl.feral) { drawFeral(x, yb, t, mode, atk); return; }
  if (pl.berserk) drawSpirit(x, yb, t, f, false);
  if (pl.berserk && Math.abs(pl.vx) > 140) for (let k = 2; k >= 1; k--) blit(cx, c => drawHuman(c, h), x - f * k * 13, yb, f < 0, {alpha: 0.14 * (3 - k), outline: TAN().cor});
  const blink = G.mode === 'play' && pl.iframes > 0 && pl.hurtT <= 0 && pl.dodgeT <= 0 && pl.powerT <= 0 && pl.dashT <= 0 && Math.floor(t * 18) % 2 === 0;
  if (pl.shieldT > 0) { cx.globalCompositeOperation = 'lighter'; const sg = cx.createRadialGradient(x, yb - 15, 6, x, yb - 15, 26); sg.addColorStop(0, 'rgba(120,200,255,0.05)'); sg.addColorStop(0.85, 'rgba(120,200,255,0.35)'); sg.addColorStop(1, 'rgba(120,200,255,0)'); cx.fillStyle = sg; cx.fillRect(x - 28, yb - 43, 56, 56); cx.globalCompositeOperation = 'source-over'; }
  const pk = heroSheetKey(P.classe, wid, P.armaduras[P.armadura].id);
  let an = {idle: 'idle', run: 'run', dodge: 'dodge', hurt: 'hurt', wall: 'wall'}[mode] || (pl.vy < 0 ? 'jump' : 'fall');
  if (atk) an = atk.dir === 'fwd' ? 'attack' + Math.min(3, atk.step) : 'attack1';
  if (pl.powerT > 0) an = 'special';
  const xf = playerXf(mode, atk, t, f);
  if (!pk || !drawSheet(pk, an, pl.animClock || t, atk ? atk.p : 0, x, yb, pl.faceX < 0, Object.assign({alpha: blink ? 0.4 : 1, flash: pl.hurtT > 0 ? 0.12 : 0, tint: pl.berserk ? `rgba(${TAN().rgb},0.22)` : undefined, filter: (!pk || pk.startsWith('cls_') || pk.startsWith('arm_')) ? null : CLASS_FILTER[P.classe]}, xf)))
    blit(cx, c => drawHuman(c, h), x, yb, f < 0, {alpha: blink ? 0.4 : 1, flash: pl.hurtT > 0 ? 0.12 : 0});
  if (pl.powerT > 0) blit(cx, c => { c.scale(1.1, 1.1); drawWolf(c, {t, vx: 300, vy: 0, state: 'lunge', onGround: true, ghost: true}); }, x - f * 18, yb, f < 0, {alpha: 0.55, outline: 'rgba(80,220,210,0.7)'});
  if (pl.berserk) { addLight(x, yb - 16, 260, 1, TAN().cor, 0.34); glowBlob(x, yb - 16, 34, TAN().cor, 0.3 + 0.12 * Math.sin(t * 14)); }
  else addLight(x, yb - 16, 200, 0.95, stage >= 1 ? '#ffb347' : '#a8c8ff', stage >= 2 ? 0.22 : 0.1);
  const r = weaponRunes(P, S), el = Object.keys(r).find(k => k === 'fogo' || k === 'veneno');
  if (el) addLight(x + f * 14, yb - 18, 34, 0.5, ELEMS[el].cor, 0.28);
  if (G.mode === 'play' && mode === 'run' && pl.onGround && Math.random() < 0.25) G.parts.push({x: cxOf(pl) - f * 5, y: pl.y + pl.h, vx: -f * 25, vy: -18, life: 0.4, max: 0.4, col: '#dfeaff', size: 1});
}
function drawSlash(camX, camY) {
  const a = pl.atk; if (!a || pl.dead || hasFx()) return;
  const p = a.t / a.dur; if (p < 0.12 || p > 0.8) return;
  const wd = WEAPONS[P.armas[P.arma].id], rr = wd.alcance * 0.78, f = pl.facing;
  const sx = cxOf(pl) - camX + f * 2, sy = pl.y + 13 - camY, r = weaponRunes(P, S);
  const col = r.fogo ? '255,150,60' : (r.veneno ? '150,255,110' : '215,235,255');
  let from, to;
  if (a.dir === 'up') { from = 0.25; to = -2.6; } else if (a.dir === 'down') { from = 0.4; to = 2.2; }
  else if (a.step % 2) { from = -2.3; to = 0.9; } else { from = 1.5; to = -1.6; }
  const e = Math.min(1, (p - 0.12) / 0.5), cur = from + (to - from) * e;
  cx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) {
    const a0 = cur - (to - from) * 0.09 * i, a1 = cur - (to - from) * 0.09 * (i + 1);
    cx.strokeStyle = `rgba(${col},${Math.max(0, (0.55 - i * 0.07) * (1 - Math.max(0, p - 0.55) * 2.5))})`; cx.lineWidth = 5 - i * 0.5;
    cx.beginPath();
    if (a.dir === 'fwd') { const m = f > 0 ? 1 : -1; cx.arc(sx, sy, rr, f > 0 ? a0 : Math.PI - a0, f > 0 ? a1 : Math.PI - a1, (a1 - a0) * m < 0); }
    else cx.arc(sx, sy, rr * 0.9, a0 - 1.57, a1 - 1.57, a1 < a0);
    cx.stroke();
  }
  cx.globalCompositeOperation = 'source-over';
}
function drawProjs(camX, camY) {
  for (const p of G.projs) {
    const x = p.x - camX, y = p.y - camY, ang = Math.atan2(p.vy, p.vx), col = p.from === 'player' ? '#e6f4ff' : (p.elem === 'veneno' ? '#8cff6a' : '#e8e8ff');
    cx.save(); cx.translate(Math.round(x), Math.round(y)); cx.rotate(ang);
    cx.fillStyle = col; cx.fillRect(-7, -1, 14, 2); cx.fillStyle = '#fff'; cx.fillRect(3, -1, 4, 2); cx.fillStyle = 'rgba(255,255,255,0.35)'; cx.fillRect(-14, 0, 8, 1);
    cx.restore();
    addLight(x, y, p.elem === 'veneno' ? 48 : 30, 0.5, p.elem === 'veneno' ? '#7ed957' : '#cfe6ff', 0.35);
  }
}
function drawEffects(camX, camY, dt) {
  if (G.slam) { G.slam.t += dt; const k = G.slam.t / 0.45; if (k > 1) G.slam = null; else { cx.globalCompositeOperation = 'lighter'; cx.strokeStyle = `rgba(255,220,150,${1 - k})`; cx.lineWidth = 4; cx.beginPath(); cx.ellipse(G.slam.x - camX, G.slam.y - camY, 120 * k, 22 * k, 0, 0, 7); cx.stroke(); cx.globalCompositeOperation = 'source-over'; } }
  if (G.cloud) {   // Névoa Debilitante: círculo rúnico no chão, glifos girando e fios de névoa subindo
    const C = G.cloud; C.t += dt; const k = C.t / 1.6;
    if (k > 1) G.cloud = null;
    else {
      const X = C.x - camX, Y = C.gy - camY - 2, grow = Math.min(1, k * 4), R = 130 * (1 - Math.pow(1 - grow, 3)), al = k < 0.65 ? 1 : (1 - k) / 0.35;
      cx.save(); cx.globalCompositeOperation = 'lighter';
      for (const [rr, w] of [[R, 2], [R * 0.64, 1.5], [R * 0.3, 1]]) { cx.strokeStyle = `rgba(130,255,180,${0.55 * al})`; cx.lineWidth = w; cx.beginPath(); cx.ellipse(X, Y, rr, rr * 0.26, 0, 0, 7); cx.stroke(); }
      for (let i = 0; i < 14; i++) { const an = i / 14 * 6.283 + C.t * 1.8, gx = X + Math.cos(an) * R * 0.82, gy = Y + Math.sin(an) * R * 0.82 * 0.26; cx.fillStyle = `rgba(210,255,215,${0.75 * al})`; cx.fillRect(Math.round(gx) - 1, Math.round(gy) - 3, 2, 6); cx.fillRect(Math.round(gx) - 3, Math.round(gy) - 1, 6, 2); }
      for (let w = 0; w < 6; w++) { cx.strokeStyle = `rgba(160,255,200,${0.3 * al})`; cx.lineWidth = 2; cx.beginPath();
        for (let s = 0; s <= 1.001; s += 0.08) { const px = X + Math.sin(s * 5 + C.t * 2.4 + w * 1.1) * R * 0.55 * (0.5 + 0.5 * Math.cos(w * 2.1)) * grow, py = Y - s * 70 * grow - Math.sin(C.t * 3 + w) * 3; if (s === 0) cx.moveTo(px, py); else cx.lineTo(px, py); } cx.stroke(); }
      cx.restore();
      if (Math.random() < 0.7) G.parts.push({x: C.x + (Math.random() - 0.5) * R * 1.4, y: C.gy - Math.random() * 6, vx: (Math.random() - 0.5) * 14, vy: -30 - Math.random() * 40, life: 0.9, max: 0.9, col: Math.random() < 0.5 ? '#b8ffd0' : '#e6ffb0', size: 1, add: true});
    }
  }
  for (const e of G.enemies) if (!e.dead && e.weak > 0) {   // marca de debuff sobre os inimigos enfraquecidos
    const ex = cxOf(e) - camX, ey = e.y - camY - 10 + Math.sin(G.time * 5 + e.x) * 2;
    cx.fillStyle = '#b6ffcc'; cx.fillRect(Math.round(ex) - 1, Math.round(ey) - 3, 3, 3); cx.fillRect(Math.round(ex) - 3, Math.round(ey), 7, 2); cx.fillRect(Math.round(ex) - 1, Math.round(ey) + 2, 3, 3);
  }
}
function drawParticles(camX, camY) {
  for (const p of G.parts) {
    cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillStyle = p.col;
    if (p.add) cx.globalCompositeOperation = 'lighter';
    cx.fillRect(Math.round(p.x - camX), Math.round(p.y - camY), p.size, p.size);
    if (p.add) cx.globalCompositeOperation = 'source-over';
  }
  cx.globalAlpha = 1;
}
function drawSnow(t, front) {
  cx.fillStyle = front ? 'rgba(255,255,255,0.95)' : 'rgba(210,225,255,0.6)';
  for (const f of flakes) {
    if ((f.z === 0) === front) continue;
    const sp = f.z === 2 ? 1.9 : f.z === 1 ? 1.1 : 0.7;
    f.y += f.s * sp * 0.9; f.x += Math.sin(t * 0.9 + f.p) * 0.3 - 0.45 * sp;
    if (f.y > VH) { f.y = -4; f.x = Math.random() * VW; } if (f.x < -4) f.x = VW;
    const s = f.z === 2 ? 2 : 1; cx.fillRect(Math.round(f.x), Math.round(f.y), s, s);
  }
}
function lightPass(t) {
  /* sem camada escura: a tela fica 100% visível; as luzes só somam brilho colorido */
  cx.globalCompositeOperation = 'lighter';
  for (const l of lights) if (l.col) { const g = cx.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r * 0.85); g.addColorStop(0, l.col); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.globalAlpha = l.a; cx.fillStyle = g; cx.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2); }
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  lights = [];
}
/* brilho (bloom) e vinheta */
function postFx(t) {
  bx.clearRect(0, 0, bcv.width, bcv.height); bx.filter = 'brightness(0.8) contrast(2) blur(1.5px)';
  bx.drawImage(cv, 0, 0, bcv.width, bcv.height); bx.filter = 'none';
  cx.save(); cx.imageSmoothingEnabled = true; cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = 0.3;
  cx.drawImage(bcv, 0, 0, VW, VH); cx.restore(); cx.imageSmoothingEnabled = false;
  const vg = cx.createRadialGradient(VW / 2, VH * 0.52, VH * 0.4, VW / 2, VH * 0.52, VW * 0.66);
  vg.addColorStop(0, 'rgba(0,0,10,0)'); vg.addColorStop(1, 'rgba(0,0,10,0.1)'); cx.fillStyle = vg; cx.fillRect(0, 0, VW, VH);
}

/* ---------- interface (canvas 960x540) ---------- */
function barRect(x, y, w, h, frac, col) {
  frac = Math.max(0, Math.min(1, frac));
  hx.fillStyle = '#000'; hx.fillRect(x - 3, y - 3, w + 6, h + 6);
  hx.fillStyle = '#2a2d34'; hx.fillRect(x - 2, y - 2, w + 4, h + 4);
  hx.fillStyle = '#0b0b0e'; hx.fillRect(x, y, w, h);
  const g = hx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.45, col); g.addColorStop(1, 'rgba(0,0,0,0.55)');
  hx.fillStyle = col; hx.fillRect(x, y, w * frac, h); hx.fillStyle = g; hx.fillRect(x, y, w * frac, h);
  hx.fillStyle = '#c9a45c'; hx.fillRect(x - 3, y - 3, 2, h + 6); hx.fillRect(x + w + 1, y - 3, 2, h + 6);
}
function hudEmoji(ch, x, y, size, alpha = 1) { hx.globalAlpha = alpha; hx.font = `${size}px ${EMOJI_FONT}`; hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillText(ch, x, y); hx.globalAlpha = 1; }
function drawHud() {
  const base = hpBase(P, S), mx = hpMax(P, S), W = 300, f = v => v / base * W;
  hx.fillStyle = '#000'; hx.fillRect(13, 13, W + 6, 24); hx.fillStyle = '#2a2d34'; hx.fillRect(14, 14, W + 4, 22); hx.fillStyle = '#0b0b0e'; hx.fillRect(16, 16, W, 18);
  pl.hpLag = Math.max(P.hp, (pl.hpLag === undefined ? P.hp : pl.hpLag) - base * 0.35 / 60); if (pl.hpLag > P.hp) { hx.fillStyle = '#e8dcc4'; hx.fillRect(16, 16, f(Math.max(0, pl.hpLag)), 18); }
  const hg = hx.createLinearGradient(0, 16, 0, 34); hg.addColorStop(0, '#ff6a5a'); hg.addColorStop(0.45, '#b02a20'); hg.addColorStop(1, '#4a0c0c');
  if (pl.berserk) { const T = TAN(), pu = 0.5 + 0.5 * Math.sin(performance.now() / (pl.feral ? 90 : 140)); hg.addColorStop(0, T.claro); hg.addColorStop(0.45, T.cor); hg.addColorStop(1, T.escuro); hx.fillStyle = hg; hx.fillRect(16, 16, f(Math.max(0, P.hp)), 18); hx.globalAlpha = 0.22 * pu; hx.fillStyle = '#fff'; hx.fillRect(16, 16, f(Math.max(0, P.hp)), 18); hx.globalAlpha = 1; }
  else { hx.fillStyle = hg; hx.fillRect(16, 16, f(Math.max(0, P.hp)), 18); }
  hx.fillStyle = 'rgba(255,255,255,0.2)'; hx.fillRect(16, 16, f(Math.max(0, P.hp)), 5);
  if (P.hp < base * 0.25) { hx.globalAlpha = 0.4 + 0.4 * Math.sin(performance.now() / 120); hx.strokeStyle = '#ff4040'; hx.strokeRect(13.5, 13.5, W + 5, 23); hx.globalAlpha = 1; }
  const cutW = W - f(mx), marcaW = Math.min(cutW, f(base * Math.min(0.25, P.marca / 100)));
  hx.fillStyle = '#6b2fa6'; hx.fillRect(16 + W - cutW, 16, cutW - marcaW, 18);
  hx.fillStyle = '#161018'; hx.fillRect(16 + W - marcaW, 16, marcaW, 18);
  hx.strokeStyle = '#c9a45c'; hx.lineWidth = 1; hx.strokeRect(13.5, 13.5, W + 5, 23);
  hx.fillStyle = '#fff'; hx.font = 'bold 12px "Palatino Linotype",Georgia'; hx.textAlign = 'left'; hx.textBaseline = 'middle'; hx.shadowColor = '#000'; hx.shadowBlur = 3;
  hx.fillText(pl.feral ? `0 / ${mx}` : `${Math.max(0, Math.round(P.hp))} / ${mx}`, 22, 25);
  if (pl.feral) { const T = TAN(), q = Math.max(0, pl.feralHp / pl.feralMax); hx.shadowBlur = 0; hx.fillStyle = '#05080a'; hx.fillRect(16, 28, W, 6); hx.fillStyle = T.cor; hx.fillRect(16, 28, W * q, 6); hx.fillStyle = T.claro; hx.fillRect(16, 28, W * q, 2); hx.fillStyle = '#fff'; hx.shadowColor = '#000'; hx.shadowBlur = 3; }
  if (pl.berserk) { hx.textAlign = 'right'; hx.fillStyle = TAN().claro; hx.fillText(pl.feral ? 'FERAL' : 'FÚRIA', 16 + W - 8, 25); hx.textAlign = 'left'; }
  hx.shadowBlur = 0;
  if (pl.feral) { hx.fillStyle = TAN().claro; hx.font = 'bold 14px "Segoe UI",Arial,sans-serif'; hx.shadowColor = '#000'; hx.shadowBlur = 4; hx.fillText('Toque a Árvore dos Antigos para voltar ao normal', 16, 134); hx.shadowBlur = 0; }
  const fm = folegoMax(P, S);
  barRect(16, 38, 220, 10, P.folego / fm, '#2fc7b4'); hx.fillStyle = '#cfe'; hx.font = '10px Georgia'; hx.fillText('Fôlego Tanataú', 242, 43);
  barRect(16, 52, 220, 6, P.mut / 100, '#a05cff'); hx.fillStyle = '#d6bfff'; hx.fillText(`Mutação ${Math.round(P.mut)}%`, 242, 55);
  hx.fillStyle = '#e6edf5'; hx.font = '12px Georgia';
  hx.fillText(`${CLASSES[P.classe].emoji} ${P.nome} · Nv ${P.nivel}`, 16, 72);
  barRect(16, 80, 110, 4, P.xp / 100, '#f2cc60');
  hx.fillStyle = '#e6edf5'; if (ICON.ok) { drawIcon(hx, 'item', 'moeda', 144, 72, 20); hx.fillText(`${P.coins}`, 156, 74); } else hx.fillText(`🪙 ${P.coins}`, 136, 74);
  if (ICON.ok) { drawIcon(hx, 'item', 'raiz', 28, 100, 24); hx.fillText(`${P.itens.raiz} (${KEY('heal')})`, 44, 100); drawIcon(hx, 'item', 'rimora', 118, 100, 24); hx.fillText(`${P.itens.rimora} (${KEY('rimora')})`, 134, 100); }
  else hx.fillText(`🌿 ${P.itens.raiz} (${KEY('heal')})   🧪 ${P.itens.rimora} (${KEY('rimora')})`, 16, 98);
  if (P.elixirT > 0) { hx.fillStyle = '#9fe0a0'; hx.font = 'bold 13px "Segoe UI",Arial,sans-serif'; hx.fillText(`☘ Sorte +50%  ${Math.floor(P.elixirT / 60)}:${String(Math.floor(P.elixirT % 60)).padStart(2, '0')}`, 16, P.pontos > 0 ? 152 : 134); hx.font = '12px Georgia'; }
  if (P.pontos > 0) { hx.fillStyle = '#f2cc60'; hx.fillText(`★ ${P.pontos} pontos de talento (na Árvore dos Antigos)`, 16, 116); }
  const icon = (x, ch, cd, col, label) => {
    hx.fillStyle = 'rgba(0,0,0,0.65)'; hx.beginPath(); hx.arc(x, 40, 22, 0, 7); hx.fill();
    hx.strokeStyle = col; hx.lineWidth = 2; hx.beginPath(); hx.arc(x, 40, 22, -1.57, -1.57 + 6.283 * (1 - cd)); hx.stroke();
    hudEmoji(ch, x, 41, 22); hx.fillStyle = '#cfd8ea'; hx.font = '9px Georgia'; hx.textAlign = 'center'; hx.fillText(label, x, 70); hx.textAlign = 'left';
  };
  if (P.flags.canis) icon(352, '🐺', Math.min(1, Math.max(0, pl.powerCd / 0.7)), '#59e0d0', KEY('power'));
  icon(P.flags.canis ? 402 : 352, CLASSES[P.classe].emoji, Math.min(1, Math.max(0, pl.skillCd / 1.2)), '#f2cc60', KEY('skill'));
  if (P.flags.canis) icon(452, '🩸', pl.berserk ? 0 : P.folego < BERSERK.cost ? 0.6 : 0.15, pl.berserk ? TAN().cor : '#3a5a5a', KEY('berserk'));
  const mw = 34, mh = 16, n = L.rooms.length, mx0 = HW - 16 - mw * n - 4 * (n - 1), my0 = 16;
  L.rooms.forEach((r, i) => {
    const x = mx0 + i * (mw + 4);
    hx.fillStyle = G.visited[i] ? 'rgba(120,160,230,0.55)' : 'rgba(0,0,0,0.5)'; hx.fillRect(x, my0, mw, mh);
    hx.strokeStyle = pl.room === i ? '#fff' : 'rgba(255,255,255,0.25)'; hx.strokeRect(x + 0.5, my0 + 0.5, mw - 1, mh - 1);
  });
  const mapX = wx => mx0 + (wx / TS / L.w) * (mw * n + 4 * (n - 1));
  hx.fillStyle = '#ffe9a8'; hx.beginPath(); hx.arc(mapX(cxOf(pl)), my0 + mh / 2, 3, 0, 7); hx.fill();
  for (const c of L.camps) { hx.fillStyle = '#7affd0'; hx.fillRect(mapX(c.x) - 1.5, my0 + mh - 4, 3, 3); }
  if (S.olfato) {
    for (const e of G.enemies) if (!e.boss && Math.abs(cxOf(e) - cxOf(pl)) < 700) { hx.fillStyle = '#ff6b6b'; hx.fillRect(mapX(cxOf(e)) - 1, my0 + 3, 2, 2); }
    for (const c of L.chests) if (c.secret && !P.flags.baus[c.id]) { hx.fillStyle = '#f2cc60'; hx.fillRect(mapX(c.x) - 1.5, my0 + 7, 3, 3); }
  }
  hx.textAlign = 'right'; hx.fillStyle = '#cfd8ea'; hx.font = '11px Georgia'; hx.fillText(L.rooms[pl.room].nome, HW - 16, my0 + mh + 14); hx.textAlign = 'left';
  if (G.bossActive && G.boss && !G.boss.dead) {
    const b = G.boss, w = 460, x = (HW - w) / 2;
    barRect(x, HH - 44, w, 12, b.hp / b.hpMax, '#c0392b');
    hx.fillStyle = '#fff'; hx.textAlign = 'center'; hx.font = 'bold 13px Georgia'; hx.fillText(b.d.nome, HW / 2, HH - 52); hx.textAlign = 'left';
    const bx = (cxOf(b) - G.cam.x) * HS;   // chefe fora da tela: seta vermelha na borda, apontando para ele
    if (bx < 24 || bx > HW - 24) {
      const right = bx > HW / 2, ex = right ? HW - 30 : 30, ey = HH / 2 + 20, pu = 0.6 + 0.4 * Math.sin(performance.now() / 160), d = right ? 1 : -1;
      hx.save(); hx.globalAlpha = pu; hx.fillStyle = '#ff4030'; hx.strokeStyle = '#000'; hx.lineWidth = 3;
      hx.shadowColor = '#ff2010'; hx.shadowBlur = 14; hx.beginPath(); hx.moveTo(ex + 26 * d, ey); hx.lineTo(ex - 14 * d, ey - 24); hx.lineTo(ex - 14 * d, ey + 24); hx.closePath(); hx.stroke(); hx.fill(); hx.shadowBlur = 0;
      hx.globalAlpha = 1; hx.font = 'bold 15px "Segoe UI",Arial,sans-serif'; hx.textAlign = right ? 'right' : 'left'; hx.fillStyle = '#ffd0c8'; hx.shadowColor = '#000'; hx.shadowBlur = 4; hx.fillText('Chefe', right ? ex + 22 : ex - 22, ey + 44); hx.restore();
    }
  }
}
/* botão da ação: tecla do teclado ou botão do controle (colorido, como no aparelho) */
function drawKeyGlyph(cxp, cyp, label, w, pad) {
  const col = {A: '#5ec24a', B: '#e5483a', X: '#3b82f6', Y: '#f2c230', '✕': '#6fa8ff', '○': '#ff6b6b', '□': '#e58ad2', '△': '#5ed6a0'}[label];
  hx.save(); hx.textAlign = 'center'; hx.textBaseline = 'middle';
  if (pad && col) { hx.fillStyle = '#10131a'; hx.beginPath(); hx.arc(cxp, cyp, 11, 0, 7); hx.fill(); hx.strokeStyle = col; hx.lineWidth = 2; hx.stroke(); hx.fillStyle = col; hx.font = 'bold 14px "Segoe UI",Arial,sans-serif'; hx.fillText(label, cxp, cyp + 1); }
  else { hx.fillStyle = pad ? '#2a2f3a' : '#e8e2d0'; hx.strokeStyle = pad ? '#8a93a6' : '#6b6450'; hx.lineWidth = 1.5; hx.beginPath(); hx.roundRect(cxp - w / 2, cyp - 11, w, 22, pad ? 8 : 4); hx.fill(); hx.stroke(); hx.fillStyle = pad ? '#e8edf7' : '#1a1814'; hx.font = 'bold 13px "Segoe UI",Arial,sans-serif'; hx.fillText(label, cxp, cyp + 1); }
  hx.restore();
}
function drawOverlayText(camX, camY) {
  if (G.near && G.mode === 'play' && !(pl.feral && G.near.kind !== 'camp')) {
    const o = G.near, x = (o.x + (o.kind === 'chest' ? 16 : 0) - camX) * HS, y = (o.y - camY - 52) * HS;
    hx.font = '14px "Segoe UI",Arial,sans-serif'; hx.textAlign = 'left'; hx.textBaseline = 'middle';
    const kl = KEY('interact'), pad = Input.device === 'pad', gw = pad ? 24 : Math.max(22, hx.measureText(kl).width + 12), tw = hx.measureText(o.label).width, w = gw + tw + 26, x0 = x - w / 2;
    hx.fillStyle = 'rgba(0,0,0,0.75)'; hx.fillRect(x0, y - 15, w, 30); hx.strokeStyle = 'rgba(160,190,240,0.6)'; hx.strokeRect(x0 + 0.5, y - 14.5, w - 1, 29);
    drawKeyGlyph(x0 + 8 + gw / 2, y, kl, gw, pad);
    hx.fillStyle = '#fff'; hx.textAlign = 'left'; hx.fillText(o.label, x0 + 16 + gw, y);
  }
  if (G.bannerT > 0 && G.banner) {
    hx.globalAlpha = Math.min(1, G.bannerT); hx.textAlign = 'center'; hx.font = 'bold 28px Georgia'; hx.fillStyle = '#e6edf5'; hx.shadowColor = '#000'; hx.shadowBlur = 10;
    hx.fillText(G.banner, HW / 2, 160); hx.shadowBlur = 0; hx.globalAlpha = 1; hx.textAlign = 'left';
  }
  if (G.hintT > 0 && G.hint) {
    hx.globalAlpha = Math.min(1, G.hintT); hx.fillStyle = 'rgba(0,0,0,0.7)'; hx.fillRect(HW / 2 - 340, HH - 108, 680, 38);
    hx.fillStyle = '#cfe9ff'; hx.font = '13px Georgia'; hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillText(keyText(G.hint), HW / 2, HH - 89, 660); hx.globalAlpha = 1; hx.textAlign = 'left';
  }
  hx.textAlign = 'center'; hx.textBaseline = 'middle';
  for (const tx of G.texts) { hx.globalAlpha = Math.min(1, tx.life * 1.5); hx.font = `bold ${tx.size + 2}px Georgia`; const X = (tx.x - camX) * HS, Y = (tx.y - camY) * HS; hx.fillStyle = '#000'; hx.fillText(tx.txt, X + 1, Y + 1); hx.fillStyle = tx.col; hx.fillText(tx.txt, X, Y); }
  hx.globalAlpha = 1; hx.textAlign = 'left';
}
function wrapText(txt, maxW) {
  const words = txt.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (hx.measureText(t).width > maxW) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
/* retrato do falante dentro de uma moldura (canvas da interface) */
function drawFace(kind, t, x, y, s) {
  const g = hx.createRadialGradient(x + s / 2, y + s * 0.4, s * 0.1, x + s / 2, y + s / 2, s * 0.75);
  g.addColorStop(0, kind === 'boss' ? '#3a1612' : kind === 'lobo' ? '#12332f' : kind === 'natalie' ? '#2a2540' : '#2b2a22'); g.addColorStop(1, '#07070a');
  hx.fillStyle = g; hx.fillRect(x, y, s, s);
  let key = null, crop = [12, 2, 72, 72];
  if (kind === 'hero') { const w = P.armas[P.arma], a = P.armaduras[P.armadura]; key = heroSheetKey(P.classe, w.id, a.id); }
  else if (kind === 'natalie') key = 'natalie';
  else if (kind === 'boss') key = 'cacador';
  else if (kind === 'lobo') { key = 'lobo'; crop = [4, 26, 80, 80]; }
  if (key && hasSheet(key)) {
    const S = SPR[key], d = S.def, an = (d.anims && d.anims.idle) || SPR_ANIMS.idle, f = Math.floor(t * an[2]) % an[1];
    hx.save(); hx.beginPath(); hx.rect(x, y, s, s); hx.clip(); hx.imageSmoothingEnabled = false;
    if (key === 'lobo') { hx.translate(x + s, y); hx.scale(-1, 1); hx.translate(0, 0); }
    hx.drawImage(S.img, f * d.cell + crop[0], an[0] * d.cell + crop[1], crop[2], crop[3], key === 'lobo' ? 0 : x, key === 'lobo' ? 0 : y, s, s);
    hx.restore();
  } else { hx.fillStyle = '#c9a45c'; hx.font = `${s * 0.5}px serif`; hx.textAlign = 'center'; hx.textBaseline = 'middle'; hx.fillText(kind === 'nota' ? '✎' : '✠', x + s / 2, y + s / 2); hx.textAlign = 'left'; }
  hx.strokeStyle = '#000'; hx.lineWidth = 4; hx.strokeRect(x - 2, y - 2, s + 4, s + 4);
  hx.strokeStyle = '#c9a45c'; hx.lineWidth = 2; hx.strokeRect(x, y, s, s);
}
function drawDialog() {
  const D = G.dialog, d = D.lines[D.i]; if (!d) return;
  const kind = speakerKind(d.who), face = kind !== 'nota';
  const x = 40, y = HH - 180, w = HW - 80, h = 150, tx = face ? x + 152 : x + 30;
  hx.fillStyle = 'rgba(0,0,0,0.35)'; hx.fillRect(0, y - 30, HW, HH - y + 30);   // escurece a base da cena
  const g = hx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#171419'); g.addColorStop(1, '#08080b');
  hx.fillStyle = g; hx.fillRect(x, y, w, h);
  hx.strokeStyle = '#5d636e'; hx.lineWidth = 3; hx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  hx.strokeStyle = '#c9a45c'; hx.lineWidth = 2;
  for (const [cx0, cy0, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { hx.beginPath(); hx.moveTo(cx0 + sx * 22, cy0 + sy * 2); hx.lineTo(cx0 + sx * 2, cy0 + sy * 2); hx.lineTo(cx0 + sx * 2, cy0 + sy * 22); hx.stroke(); }
  if (face) drawFace(kind, G.time, x + 18, y + 18, 114);
  hx.font = 'bold 18px "Trajan Pro","Perpetua Titling MT","Palatino Linotype",serif'; const nw = hx.measureText(d.who).width + 32;
  hx.fillStyle = '#14120e'; hx.fillRect(tx - 6, y - 14, nw, 28); hx.strokeStyle = '#c9a45c'; hx.lineWidth = 1; hx.strokeRect(tx - 5.5, y - 13.5, nw, 27);
  hx.textAlign = 'left'; hx.textBaseline = 'middle'; hx.fillStyle = kind === 'boss' ? '#ff9a80' : kind === 'natalie' ? '#c9b8ff' : '#f0d79a'; hx.fillText(d.who, tx + 10, y);
  hx.textBaseline = 'alphabetic'; hx.fillStyle = kind === 'nota' ? '#e4dcc4' : '#f4f0e6'; hx.font = '19px "Segoe UI",Verdana,Arial,sans-serif';
  let left = Math.floor(D.c);
  for (const [i, l] of wrapText(d.txt, w - (tx - x) - 36).entries()) {
    if (left <= 0) break; hx.fillText(l.slice(0, left), tx, y + 46 + i * 27); left -= l.length + 1;
  }
  if (D.c >= d.txt.length && Math.floor(performance.now() / 500) % 2) { hx.fillStyle = '#e0702a'; hx.beginPath(); hx.moveTo(x + w - 40, y + h - 28); hx.lineTo(x + w - 28, y + h - 28); hx.lineTo(x + w - 34, y + h - 20); hx.fill(); }
}

/* ---------- cores e efeitos de tela da Fúria ---------- */
function drawFuryScreen(t, camX, camY) {
  const T = TAN(), feral = pl.feral, beat = 0.5 + 0.5 * Math.sin(t * (feral ? 9 : 6.5)), rgb = T.rgb, up = feral ? 0.02 : 0;
  if (pl.berserk) {
    cx.save(); cx.globalCompositeOperation = 'overlay'; cx.fillStyle = `rgba(${rgb},${0.17 + up + 0.06 * beat})`; cx.fillRect(0, 0, VW, VH); cx.restore();                  // virada de cor na cor do animal
    cx.fillStyle = `rgba(${rgb},${0.025 + 0.025 * beat + up * 0.4})`; cx.fillRect(0, 0, VW, VH);
    const vg = cx.createRadialGradient(VW / 2, VH * 0.52, VH * 0.3, VW / 2, VH * 0.52, VW * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(${rgb},${0.4 + up + 0.18 * beat})`);   // bordas pulsando como batimento
    cx.fillStyle = vg; cx.fillRect(0, 0, VW, VH);
    cx.save(); cx.strokeStyle = `rgba(${T.claroRgb},0.22)`; cx.lineWidth = 1; const seed = Math.floor(t * 14);                                                              // linhas de velocidade
    for (let i = 0; i < 22; i++) { const a = (i / 22) * 6.283 + hash(i + seed * 7) * 0.3, r0 = VW * (0.36 + hash(i * 3 + seed) * 0.08), r1 = r0 + 26 + hash(i + 40 + seed) * 50; cx.beginPath(); cx.moveTo(VW / 2 + Math.cos(a) * r0, VH / 2 + Math.sin(a) * r0 * 0.62); cx.lineTo(VW / 2 + Math.cos(a) * r1, VH / 2 + Math.sin(a) * r1 * 0.62); cx.stroke(); }
    cx.restore();
  }
  if (G.furyFlash > 0) { cx.fillStyle = `rgba(${T.claroRgb},${G.furyFlash * 0.7})`; cx.fillRect(0, 0, VW, VH); }
  const w = G.furyWave; if (w) { const a = w.t / 0.9; cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = (1 - a) * 0.9; cx.strokeStyle = T.cor; cx.lineWidth = 5 * (1 - a) + 1; cx.beginPath(); cx.arc(w.x - camX, w.y - camY, 10 + a * 260, 0, 7); cx.stroke(); cx.restore(); }
}

/* ---------- título e abertura ---------- */
let CINE = null, titleClass = null; const titleEmbers = [];
function drawGroundSnow(y0) {
  const g = cx.createLinearGradient(0, y0, 0, VH); g.addColorStop(0, '#e4eefb'); g.addColorStop(0.04, '#a9bddc'); g.addColorStop(0.05, '#33436b'); g.addColorStop(1, '#0d1326');
  cx.fillStyle = g; cx.fillRect(0, y0, VW, VH - y0);
}
function glowBlob(x, y, r, col, a) { const g = cx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = a; cx.fillStyle = g; cx.fillRect(x - r, y - r, r * 2, r * 2); cx.restore(); }
function bigSheet(key, anim, t, x, y, k, flip, o, p = 0) {
  cx.save(); cx.translate(x, y); cx.scale(k, k); const ok = hasSheet(key) && drawSheet(key, anim, t, p, 0, 0, flip, o); cx.restore(); return ok;
}
function embersAt(x, y, n, col = '#ffb347') {
  for (let i = 0; i < n; i++) if (Math.random() < 0.35) titleEmbers.push({x: x + (Math.random() - 0.5) * 14, y, vx: (Math.random() - 0.5) * 20, vy: -30 - Math.random() * 40, life: 1.6, col});
}
function drawEmbers(dt) {
  for (const e of titleEmbers) { e.life -= dt; e.x += e.vx * dt + Math.sin(e.life * 6) * 0.3; e.y += e.vy * dt; cx.globalAlpha = Math.max(0, Math.min(1, e.life)); cx.fillStyle = e.col; cx.fillRect(Math.round(e.x), Math.round(e.y), 1, 1); }
  cx.globalAlpha = 1; for (let i = titleEmbers.length - 1; i >= 0; i--) if (titleEmbers[i].life <= 0) titleEmbers.splice(i, 1);
}
/* tela de título: Árvore dos Antigos numa noite de nevasca, com o herói, Natalie e um lobo à espreita */
function drawTitleScene(t) {
  if (!titleClass) titleClass = Object.keys(CLASSES)[Math.floor(Math.random() * 4)];
  drawSky(t); drawBackdrops(t * 14, 0, 215 + 90, t); drawGroundSnow(215);
  const fx = 112, fy = 240;
  // lobo à espreita, ao longe, com os olhos acesos
  const wx = 372; bigSheet('lobo', 'idle', t, wx, fy + 6, 1, true, {tint: 'rgba(6,9,22,0.88)'});
  const bl = (t % 5.5) > 5.3 ? 0 : 1; cx.fillStyle = `rgba(255,190,70,${0.9 * bl})`; cx.fillRect(wx - 17, fy - 16, 2, 2); cx.fillRect(wx - 11, fy - 16, 2, 2); glowBlob(wx - 13, fy - 15, 14, '#ffb030', 0.35 * bl);
  drawTree(fx, fy + 3, t, 0.9, 1.7);
  bigSheet(heroSheetKey(titleClass, CLASSES[titleClass].arma, 'gibao'), 'idle', t, fx - 56, fy + 2, 1.4, false, {});
  bigSheet('natalie', 'idle', t, fx + 58, fy + 2, 1.4, true, {});
  addLight(fx, fy - 60, 250, 1, '#7affd0', 0.22);
  if (Math.random() < 0.12) treeLeavesSpawn(fx, fy, t, 1, false); drawTreeLeaves(0, 0, t);
  drawSnow(t, false); lightPass(t); drawSnow(t, true); postFx(t);
}
/* abertura em cenas */
function startCine(slides, cb) { CINE = {slides, i: 0, t: 0, c: 0, out: 0, cb}; Input.clear(); const h = document.getElementById('hint'); if (h) h.style.display = 'none'; }
function cineText(s) { return (s.txt || '').replace('{nome}', P ? P.nome : 'sobrevivente').replace('{passado}', P ? CLASSES[P.classe].passado : ''); }
function updateCine(dt) {
  const C = CINE, s = C.slides[C.i], txt = cineText(s), Pr = Input.pressed; C.t += dt;
  const finish = () => { const cb = C.cb; CINE = null; Input.clear(); cb && cb(); };
  if (C.out > 0) { C.out -= dt; if (C.out <= 0) { if (++C.i >= C.slides.length) return finish(); C.t = 0; C.c = 0; } return; }
  if (!s.card && C.c < txt.length) C.c = Math.min(txt.length, C.c + dt * 34);
  if (C.t < 0.35) return;
  if (Pr.pause || Pr.back) return finish();
  if (Pr.confirm || Pr.interact || Pr.jump || Pr.attack) { if (!s.card && C.c < txt.length) C.c = txt.length; else C.out = 0.45; }
  if (s.card && C.t > 3.6) C.out = 0.7;
}
function drawCine() {
  const C = CINE, s = C.slides[C.i], t = C.t, tt = titleT, base = Math.min(1, t / 0.9) * (C.out > 0 ? Math.max(0, C.out / 0.45) : 1);
  const hero = () => heroSheetKey(P.classe, CLASSES[P.classe].arma, 'gibao');
  cx.save(); cx.translate(0, -42);
  drawSky(tt); drawBackdrops(tt * 7 + C.i * 140, 0, 215 + 90, tt); drawGroundSnow(215);
  const k = Math.min(1, t / 3);   // aproximação lenta da câmera
  switch (s.scene) {
    case 'vila':
      glowBlob(VW * 0.7, 80, 170, '#ffc060', 0.55); cx.fillStyle = 'rgba(255,170,80,0.24)'; cx.fillRect(0, 0, VW, VH);
      bigSheet('natalie', 'idle', tt, 150, 238, 1.6, false, {tint: 'rgba(40,20,0,0.55)'}); bigSheet(hero(), 'idle', tt, 330, 238, 1.6, true, {tint: 'rgba(40,20,0,0.55)'});
      break;
    case 'ceu':
      cx.fillStyle = 'rgba(5,8,26,0.5)'; cx.fillRect(0, 0, VW, VH); glowBlob(VW * 0.62, 70, 90, '#9fb8ff', 0.5);
      cx.fillStyle = '#e8f0ff'; cx.beginPath(); cx.arc(VW * 0.62, 70, 22, 0, 7); cx.fill(); cx.fillStyle = 'rgba(5,8,26,0.55)'; cx.beginPath(); cx.arc(VW * 0.62 + 11, 64, 20, 0, 7); cx.fill();
      break;
    case 'lobo':
      cx.fillStyle = 'rgba(2,12,18,0.55)'; cx.fillRect(0, 0, VW, VH); glowBlob(VW * 0.5, 100, 140, '#59e0d0', 0.28 + 0.06 * Math.sin(tt * 2));
      cx.fillStyle = 'rgba(190,255,245,0.85)'; cx.beginPath(); cx.arc(VW * 0.5, 96, 40, 0, 7); cx.fill();
      bigSheet('lobo', 'idle', tt, VW * 0.5, 246, 3.2 + k * 0.4, false, {tint: 'rgba(2,8,14,0.95)'}); glowBlob(VW * 0.5 + 38, 150, 18, '#59e0d0', 0.7);
      break;
    case 'mutacao': {
      cx.fillStyle = 'rgba(0,10,12,0.5)'; cx.fillRect(0, 0, VW, VH); const p = 0.5 + 0.5 * Math.sin(tt * 3);
      glowBlob(VW * 0.5, 150, 120 + p * 30, '#59e0d0', 0.4 + 0.2 * p); glowBlob(VW * 0.5, 150, 70, '#b84cff', 0.15 + 0.15 * p);
      bigSheet(hero(), 'special', tt, VW * 0.5, 248, 3, false, {}); embersAt(VW * 0.5, 180, 2, '#59e0d0');
      drawEmbers(0.016); break; }
    case 'cacador':
      cx.fillStyle = 'rgba(30,4,2,0.5)'; cx.fillRect(0, 0, VW, VH); glowBlob(VW * 0.5, 170, 200, '#ff3a1a', 0.35 + 0.08 * Math.sin(tt * 7));
      for (const fxp of [90, 160, 320, 392]) { drawFire(cx, fxp, 244, tt + fxp, 1.8); embersAt(fxp, 215, 1, '#ff7a30'); }
      bigSheet('cacador', 'idle', tt, VW * 0.5, 252, 3.1, false, {tint: 'rgba(8,2,2,0.78)'}); drawEmbers(0.016);
      cx.fillStyle = 'rgba(255,60,30,0.9)'; cx.fillRect(VW * 0.5 - 8, 118, 3, 2); cx.fillRect(VW * 0.5 + 4, 118, 3, 2);
      break;
    case 'heroi': {
      const fx = 330; cx.fillStyle = 'rgba(5,8,26,0.2)'; cx.fillRect(0, 0, VW, VH);
      drawTree(fx, 252, tt, 1, 0.7); bigSheet(hero(), 'idle', tt, fx - 78, 252, 2.6, false, {});
      if (Math.random() < 0.15) treeLeavesSpawn(fx, 252, tt, 1, false); drawTreeLeaves(0, 0, tt);
      break; }
    case 'muralha': {
      cx.fillStyle = 'rgba(5,8,22,0.45)'; cx.fillRect(0, 0, VW, VH);
      const wy = 92, wx0 = 70, wx1 = VW - 70;
      cx.fillStyle = '#10131c'; cx.fillRect(wx0, wy, wx1 - wx0, 215 - wy);
      for (let x = wx0; x < wx1; x += 16) cx.fillRect(x, wy - 9, 9, 9);
      cx.fillStyle = '#1b2030'; for (let y = wy + 8; y < 215; y += 12) for (let x = wx0 + ((y / 12) % 2) * 8; x < wx1; x += 16) cx.fillRect(x, y, 14, 1);
      cx.fillStyle = '#050609'; cx.fillRect(VW / 2 - 26, 135, 52, 80); cx.beginPath(); cx.arc(VW / 2, 135, 26, Math.PI, 0); cx.fill();
      cx.fillStyle = '#2a2218'; for (let q = -20; q <= 20; q += 10) cx.fillRect(VW / 2 + q - 1, 125, 2, 90); cx.fillRect(VW / 2 - 26, 150, 52, 3); cx.fillRect(VW / 2 - 26, 185, 52, 3);
      for (const tx of [VW / 2 - 52, VW / 2 + 52]) { drawFire(cx, tx, 150, tt + tx, 1.2); glowBlob(tx, 140, 55, '#ff8a2a', 0.3); }
      // vultos do povo diante do portão fechado
      for (let q = 0; q < 7; q++) { const px = VW / 2 - 60 + q * 20 + Math.sin(tt + q) * 1.5; cx.fillStyle = '#04050a'; cx.fillRect(px, 205, 6, 11); cx.beginPath(); cx.arc(px + 3, 203, 3, 0, 7); cx.fill(); }
      break; }
    case 'capitulo':
      cx.fillStyle = 'rgba(2,4,12,0.7)'; cx.fillRect(0, 0, VW, VH); break;
  }
  drawSnow(tt, false); drawSnow(tt, true);
  cx.restore();
  cx.globalAlpha = 1; cx.fillStyle = `rgba(0,0,0,${1 - base})`; cx.fillRect(0, 0, VW, VH);
  const vg = cx.createRadialGradient(VW / 2, VH * 0.5, VH * 0.35, VW / 2, VH * 0.5, VW * 0.7); vg.addColorStop(0, 'rgba(0,0,8,0)'); vg.addColorStop(1, 'rgba(0,0,8,0.72)'); cx.fillStyle = vg; cx.fillRect(0, 0, VW, VH);
  // faixas de cinema, texto e dicas (canvas da interface)
  hx.fillStyle = '#000'; hx.fillRect(0, 0, HW, 40); hx.fillRect(0, HH - 126, HW, 126);
  hx.fillStyle = '#c9a45c'; hx.fillRect(0, 40, HW, 1); hx.fillRect(0, HH - 127, HW, 1);
  hx.textAlign = 'center'; hx.textBaseline = 'alphabetic';
  if (s.card) {
    const a = Math.min(1, t / 1.2) * (C.out > 0 ? Math.max(0, C.out / 0.7) : 1);
    hx.globalAlpha = a; hx.shadowColor = '#000'; hx.shadowBlur = 8; hx.fillStyle = '#c9a45c'; hx.font = '24px "Trajan Pro","Perpetua Titling MT","Palatino Linotype",serif'; hx.fillText(s.card[0].split('').join(' '), HW / 2, HH / 2 - 30);
    hx.fillStyle = '#e8f1ff'; hx.font = '72px "Trajan Pro","Perpetua Titling MT","Palatino Linotype",serif'; hx.fillText(s.card[1], HW / 2, HH / 2 + 40);
    hx.fillStyle = '#c9a45c'; hx.fillRect(HW / 2 - 200, HH / 2 + 66, 400, 1); hx.shadowBlur = 0; hx.globalAlpha = 1;
  } else {
    const txt = cineText(s); hx.font = '22px "Segoe UI",Verdana,Arial,sans-serif'; hx.shadowColor = '#000'; hx.shadowBlur = 5; hx.fillStyle = '#f6f3ec';
    let left = Math.floor(C.c); for (const [i, l] of wrapText(txt, 860).entries()) { if (left <= 0) break; hx.fillText(l.slice(0, left), HW / 2, HH - 84 + i * 33); left -= l.length + 1; }
    hx.shadowBlur = 0;
  }
  hx.font = '13px "Palatino Linotype",serif'; hx.fillStyle = 'rgba(200,190,160,0.7)'; hx.textAlign = 'right'; hx.fillText('Enter / clique: continuar    ·    Esc: pular a abertura', HW - 18, 25); hx.textAlign = 'left';
}

/* ---------- tutorial guiado ---------- */
let TUT = null;
function startTutorial() { if (!G) return; TUT = {i: 0, t: 0}; G.mode = 'tutorial'; Input.clear(); }
function endTutorial() { TUT = null; if (P) P.flags.tutorial = true; if (G) { G.mode = 'play'; Input.clear(); } }
function updateTut(dt) {
  TUT.t += dt; const Pr = Input.pressed;
  if (TUT.t < 0.25) return;
  if (Pr.back || Pr.pause) return endTutorial();
  if (Pr.left && TUT.i > 0) { TUT.i--; TUT.t = 0; Snd.sfx('menu'); return; }
  if (Pr.confirm || Pr.interact || Pr.jump || Pr.attack || Pr.right) { Snd.sfx('menu'); if (++TUT.i >= TUT_STEPS.length) return endTutorial(); TUT.t = 0; }
}
function tutRect(s) {
  if (s.rect === 'mapa') { const mw = 34, n = L.rooms.length, mx0 = HW - 16 - mw * n - 4 * (n - 1); return [mx0 - 4, 12, HW - mx0 - 12, 56]; }
  return s.rect;
}
function drawTut() {
  const s = TUT_STEPS[TUT.i], rc = tutRect(s), pulse = 0.5 + 0.5 * Math.sin(performance.now() / 260);
  hx.save(); hx.fillStyle = 'rgba(0,0,0,0.6)'; hx.beginPath(); hx.rect(0, 0, HW, HH); if (rc) hx.rect(rc[0] - 5, rc[1] - 5, rc[2] + 10, rc[3] + 10); hx.fill('evenodd'); hx.restore();
  if (rc) { hx.strokeStyle = `rgba(240,215,154,${0.6 + 0.4 * pulse})`; hx.lineWidth = 3; hx.strokeRect(rc[0] - 5, rc[1] - 5, rc[2] + 10, rc[3] + 10); }
  const w = 520, pad = 22; hx.font = '18px "Segoe UI",Verdana,Arial,sans-serif'; const lines = wrapText(keyText(s.txt), w - pad * 2), h = 74 + lines.length * 26 + 30;
  let x = HW / 2 - w / 2, y = HH / 2 - h / 2 + 30;
  if (rc) { const below = rc[1] + rc[3] / 2 < HH / 2; y = below ? Math.max(rc[1] + rc[3] + 36, 140) : rc[1] - h - 36; x = Math.max(20, Math.min(HW - w - 20, rc[0] + rc[2] / 2 - w / 2));
    const ax = Math.max(x + 26, Math.min(x + w - 26, rc[0] + rc[2] / 2)); hx.fillStyle = '#c9a45c'; hx.beginPath();
    if (below) { hx.moveTo(ax - 10, y); hx.lineTo(ax + 10, y); hx.lineTo(ax, y - 14 - 4 * pulse); } else { hx.moveTo(ax - 10, y + h); hx.lineTo(ax + 10, y + h); hx.lineTo(ax, y + h + 14 + 4 * pulse); } hx.fill(); }
  const g = hx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#1a1c23'); g.addColorStop(1, '#0b0c10'); hx.fillStyle = g; hx.fillRect(x, y, w, h);
  hx.strokeStyle = '#5d636e'; hx.lineWidth = 3; hx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); hx.strokeStyle = '#c9a45c'; hx.lineWidth = 1; hx.strokeRect(x + 6.5, y + 6.5, w - 13, h - 13);
  hx.textAlign = 'left'; hx.textBaseline = 'alphabetic'; hx.fillStyle = '#f0d79a'; hx.font = '22px "Trajan Pro","Perpetua Titling MT","Palatino Linotype",serif'; hx.fillText(s.title, x + pad, y + 42);
  hx.fillStyle = '#f4f0e6'; hx.font = '18px "Segoe UI",Verdana,Arial,sans-serif'; lines.forEach((l, i) => hx.fillText(l, x + pad, y + 74 + i * 26));
  hx.fillStyle = '#9a9faa'; hx.font = '13px "Segoe UI",Verdana,Arial,sans-serif'; hx.fillText(`${TUT.i + 1} / ${TUT_STEPS.length}`, x + pad, y + h - 16);
  hx.textAlign = 'right'; hx.fillText('Enter ou clique: próximo   ·   ←: voltar   ·   Esc: fechar', x + w - pad, y + h - 16); hx.textAlign = 'left';
}

/* ---------- quadro ---------- */
function render(dt) {
  ensureArt(); patchAtlas();
  titleT += dt || 0.016; hx.clearRect(0, 0, HW, HH);
  if (!G || !L) { if (CINE) drawCine(); else drawTitleScene(titleT); return; }
  const t = G.time;
  if (G.mode !== 'play' && G.mode !== 'dialog') dt = 0;
  const sx = G.shake > 0 ? rnd(-G.shake, G.shake) : 0, sy = G.shake > 0 ? rnd(-G.shake, G.shake) : 0;
  const camX = Math.round(G.cam.x + sx), camY = Math.round(G.cam.y + sy);
  drawSky(t, camX, camY); drawBackdrops(camX, camY, L.GROUND * TS, t);
  for (const p of PROPS) if (p.z === 0) prop(p, camX, camY, t);
  drawTiles(camX, camY);
  for (const p of PROPS) if (p.z === 1) prop(p, camX, camY, t);
  drawWorldObjects(camX, camY, t);
  for (const e of G.enemies) drawEnemy(e, camX, camY, t);
  drawPlayerSprite(camX, camY, t); drawSlash(camX, camY);
  drawProjs(camX, camY); drawEffects(camX, camY, dt || 0); drawFxs(camX, camY, dt || 0);
  drawParticles(camX, camY);
  drawSnow(t, false);
  lightPass(t);
  drawSnow(t, true);
  postFx(t); if (pl.berserk || G.furyFlash > 0) drawFuryScreen(t, camX, camY);
  if (G.fade > 0) { cx.fillStyle = `rgba(0,0,0,${G.fade})`; cx.fillRect(0, 0, VW, VH); }
  if (G.mode !== 'menu') drawHud();
  drawOverlayText(camX, camY);
  if (G.mode === 'dialog' && G.dialog) drawDialog();
  if (G.mode === 'tutorial' && TUT) drawTut();
  if (G.mode === 'dead') {
    const a = Math.min(1, G.deadT / 1.0), k = Math.min(1, Math.max(0, (G.deadT - 0.5) / 0.8));
    hx.fillStyle = `rgba(0,0,0,${a * 0.78})`; hx.fillRect(0, 0, HW, HH);
    const band = hx.createLinearGradient(0, HH / 2 - 70, 0, HH / 2 + 70); band.addColorStop(0, 'rgba(0,0,0,0)'); band.addColorStop(0.5, `rgba(0,0,0,${0.9 * k})`); band.addColorStop(1, 'rgba(0,0,0,0)');
    hx.fillStyle = band; hx.fillRect(0, HH / 2 - 70, HW, 140);
    hx.save(); hx.translate(HW / 2, HH / 2); const sc = 1.15 - 0.15 * k; hx.scale(sc, sc); hx.globalAlpha = k; hx.textAlign = 'center'; hx.textBaseline = 'middle';
    hx.font = '64px "Trajan Pro","Perpetua Titling MT","Copperplate Gothic Bold","Palatino Linotype",serif';
    hx.shadowColor = '#ff2a1a'; hx.shadowBlur = 24 * k; hx.fillStyle = '#9e1b14'; hx.fillText('VOCÊ CAIU', 0, 0);
    hx.shadowBlur = 0; hx.font = 'italic 16px "Palatino Linotype",serif'; hx.fillStyle = '#b8ad96'; hx.fillText('Suas moedas e XP ficaram no local da queda.', 0, 54);
    hx.fillStyle = '#c9a45c'; hx.fillRect(-180, -52, 360, 1); hx.fillRect(-180, 76, 360, 1);
    hx.restore(); hx.globalAlpha = 1; hx.textAlign = 'left';
  }
}
