'use strict';
/* ===== Arte em pixel art gerada por código: texturas, cenário em camadas, sprites animados ===== */
const ART = {};
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; return [c, x]; };
function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
const R = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), w, h); };
function LINE(c, x0, y0, x1, y1, w, col) {
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); c.fillStyle = col;
  for (let i = 0; i <= n; i++) c.fillRect(Math.round(x0 + (x1 - x0) * i / n - w / 2), Math.round(y0 + (y1 - y0) * i / n - w / 2), w, w);
}
const OUTLINE = '#080b18';

/* ---------- atlas de tiles ---------- */
function makeAtlas() {
  const [a, c] = mk(32 * 16, 64); ART.atlas = a;
  // 0-3 pedra: tijolos com tom próprio, brilho no topo, argamassa, rachaduras e gelo
  for (let v = 0; v < 4; v++) {
    const ox = v * 32;
    c.fillStyle = '#16203a'; c.fillRect(ox, 0, 32, 32);
    for (let r = 0; r < 4; r++) {
      const y = r * 8, off = (r + v) % 2 ? 8 : 0;
      for (let bxp = -16 + off; bxp < 32; bxp += 16) {
        const x0 = Math.max(0, bxp), x1 = Math.min(32, bxp + 16), tone = hash(v * 131 + r * 17 + bxp) ;
        const base = tone < 0.33 ? '#2a3a62' : tone < 0.66 ? '#33466f' : '#3b4f7a';
        c.fillStyle = base; c.fillRect(ox + x0 + 1, y + 1, x1 - x0 - 1, 6);
        c.fillStyle = 'rgba(170,205,255,0.28)'; c.fillRect(ox + x0 + 1, y + 1, x1 - x0 - 1, 1);
        c.fillStyle = 'rgba(0,0,16,0.30)'; c.fillRect(ox + x0 + 1, y + 6, x1 - x0 - 1, 1);
        c.fillStyle = 'rgba(160,195,245,0.12)'; c.fillRect(ox + x0 + 1, y + 1, 1, 6);
        for (let k = 0; k < 3; k++) { c.fillStyle = hash(bxp + r * 9 + k + v * 5) > 0.5 ? 'rgba(190,215,255,0.22)' : 'rgba(5,8,22,0.30)'; c.fillRect(ox + x0 + 2 + Math.floor(hash(k * 7 + r + bxp + v) * (x1 - x0 - 4)), y + 2 + Math.floor(hash(k * 3 + bxp + r) * 4), 1 + (k & 1), 1); }
      }
    }
    if (v === 1) { c.fillStyle = 'rgba(8,12,30,0.8)'; for (let i = 0; i < 9; i++) c.fillRect(ox + 12 + (i % 3) - (i > 4 ? 1 : 0), 6 + i * 2, 1, 2); }
    if (v === 2) { c.fillStyle = 'rgba(140,220,240,0.45)'; for (let i = 0; i < 6; i++) c.fillRect(ox + 4 + i * 4, 3 + (i % 2) * 2, 2, 1); c.fillStyle = 'rgba(200,245,255,0.5)'; c.fillRect(ox + 4, 3, 1, 1); }
    if (v === 3) { c.fillStyle = 'rgba(70,110,90,0.45)'; for (let i = 0; i < 7; i++) c.fillRect(ox + 3 + i * 4, 16 + (i % 3), 3, 1); }
    const g = c.createLinearGradient(0, 0, 0, 32); g.addColorStop(0, 'rgba(140,175,235,0.10)'); g.addColorStop(1, 'rgba(0,0,12,0.30)');
    c.fillStyle = g; c.fillRect(ox, 0, 32, 32);
  }
  // 4-7 neve no topo (transparente)
  for (let v = 0; v < 4; v++) {
    const ox = (4 + v) * 32;
    for (let x = 0; x < 32; x++) {
      const h = 5 + Math.floor(hash(v * 31 + x * 0.5) * 3) + (x % 7 === 0 ? 1 : 0);
      c.fillStyle = '#dfeaff'; c.fillRect(ox + x, 3, 1, h);
      c.fillStyle = '#f7fbff'; c.fillRect(ox + x, 3, 1, 2);
      c.fillStyle = '#9db4dc'; c.fillRect(ox + x, 3 + h - 2, 1, 2);
    }
    c.fillStyle = '#ffffff'; for (let i = 0; i < 4; i++) c.fillRect(ox + Math.floor(hash(v * 7 + i) * 30), 4, 1, 1);
  }
  // 8 plataforma de madeira
  let ox = 8 * 32;
  c.fillStyle = '#6a452a'; c.fillRect(ox, 0, 32, 10);
  c.fillStyle = '#8b5e38'; c.fillRect(ox, 0, 32, 3);
  c.fillStyle = '#3d2615'; c.fillRect(ox, 9, 32, 1); for (let i = 0; i < 4; i++) c.fillRect(ox + i * 8 + 7, 3, 1, 7);
  c.fillStyle = '#d6c4a0'; for (let i = 0; i < 4; i++) c.fillRect(ox + i * 8 + 3, 5, 1, 1);
  c.fillStyle = '#eaf2ff'; c.fillRect(ox, -1 + 1, 32, 2);
  // 9 espinhos
  ox = 9 * 32;
  for (let k = 0; k < 4; k++) {
    const bx = ox + k * 8;
    c.fillStyle = '#8c98b0'; c.beginPath(); c.moveTo(bx, 32); c.lineTo(bx + 4, 8); c.lineTo(bx + 8, 32); c.fill();
    c.fillStyle = '#d8e2f5'; c.beginPath(); c.moveTo(bx + 3, 32); c.lineTo(bx + 4, 8); c.lineTo(bx + 5, 32); c.fill();
  }
  c.fillStyle = '#4a2020'; c.fillRect(ox, 29, 32, 3);
  // 10 parede quebrável
  ox = 10 * 32;
  c.fillStyle = '#7b5a3c'; c.fillRect(ox, 0, 32, 32);
  c.fillStyle = '#4d3623'; for (let r = 0; r < 4; r++) { c.fillRect(ox, r * 8 + 7, 32, 1); c.fillRect(ox + ((r % 2) ? 6 : 14), r * 8, 1, 8); }
  c.fillStyle = '#c9a77a'; for (let i = 0; i < 12; i++) c.fillRect(ox + Math.floor(hash(i + 5) * 30), Math.floor(hash(i + 9) * 30), 2, 1);
  c.strokeStyle = '#1c120a'; c.lineWidth = 1; c.beginPath(); c.moveTo(ox + 6, 0); c.lineTo(ox + 12, 12); c.lineTo(ox + 8, 20); c.lineTo(ox + 16, 32); c.stroke();
  // 11 portão de ferro
  ox = 11 * 32;
  c.fillStyle = '#3c4458'; c.fillRect(ox, 0, 32, 32);
  c.fillStyle = '#1e2433'; for (let k = 0; k < 4; k++) c.fillRect(ox + 3 + k * 8, 0, 4, 32);
  c.fillStyle = '#8791a8'; for (let k = 0; k < 4; k++) c.fillRect(ox + 3 + k * 8, 0, 1, 32);
  c.fillStyle = '#aab4ca'; for (let k = 0; k < 4; k++) { c.fillRect(ox + 4 + k * 8, 4, 2, 2); c.fillRect(ox + 4 + k * 8, 26, 2, 2); }
  c.fillStyle = '#60697e'; c.fillRect(ox, 0, 32, 3); c.fillRect(ox, 29, 32, 3);
}

/* ---------- camadas de fundo (periódicas) ---------- */
function makeBackdrops() {
  const TAU = Math.PI * 2;
  // montanhas distantes
  let [c, x] = mk(640, 230); ART.far = c;
  for (let px = 0; px < 640; px++) {
    const h = 100 + 38 * Math.sin(TAU * 2 * px / 640) + 24 * Math.sin(TAU * 5 * px / 640 + 1) + 10 * Math.sin(TAU * 11 * px / 640 + 2);
    const top = 230 - h;
    x.fillStyle = '#3a4f82'; x.fillRect(px, top, 1, h);
    x.fillStyle = '#2b3d69'; x.fillRect(px, top + 26 + 8 * Math.sin(px * 0.2), 1, h);
    x.fillStyle = '#d3e0f7'; x.fillRect(px, top, 1, 5 + 3 * Math.sin(px * 0.31));
    x.fillStyle = '#8ea6d6'; x.fillRect(px, top + 5 + 3 * Math.sin(px * 0.31), 1, 3);
  }
  // floresta de pinheiros
  [c, x] = mk(800, 250); ART.mid = c;
  const pine = (px, base, hgt, col, hi) => {
    const w = hgt * 0.42;
    R(x, px - 1, base - hgt * 0.15, 3, hgt * 0.15, '#0c1226');
    for (let k = 0; k < 5; k++) {
      const yy = base - hgt * 0.12 - k * hgt * 0.19, ww = w * (1 - k * 0.19);
      for (let r = 0; r < hgt * 0.24; r++) { const wr = ww * (r / (hgt * 0.24)); x.fillStyle = col; x.fillRect(Math.round(px - wr / 2), Math.round(yy - hgt * 0.24 + r), Math.round(wr), 1); x.fillStyle = hi; x.fillRect(Math.round(px + wr / 2 - 2), Math.round(yy - hgt * 0.24 + r), 2, 1); }
    }
  };
  for (let i = 0; i < 46; i++) {
    const px = hash(i) * 800, h = 70 + hash(i + 40) * 90;
    for (const o of [0, 800, -800]) if (px + o > -40 && px + o < 840) pine(px + o, 250, h, i % 3 ? '#16264a' : '#1a2c55', '#2b4278');
  }
  // ruínas queimadas
  [c, x] = mk(1280, 280); ART.near = c;
  for (let i = 0; i < 10; i++) {
    const bx = i * 128 + hash(i + 3) * 30, w = 56 + hash(i + 8) * 40, h = 60 + hash(i + 12) * 70, base = 280;
    x.fillStyle = '#0f1936'; x.fillRect(bx, base - h, w, h);
    x.fillStyle = '#16244a'; x.fillRect(bx, base - h, 3, h); x.fillRect(bx, base - h, w, 2);
    // telhado quebrado
    x.fillStyle = '#0b1230'; x.beginPath(); x.moveTo(bx - 8, base - h); x.lineTo(bx + w * (0.35 + hash(i) * 0.3), base - h - 34 - hash(i + 2) * 14); x.lineTo(bx + w + 8, base - h); x.fill();
    x.fillStyle = '#16244a'; x.beginPath(); x.moveTo(bx + w * 0.3, base - h - 18); x.lineTo(bx + w * 0.55, base - h - 40); x.lineTo(bx + w * 0.62, base - h - 22); x.fill();
    // buracos e janelas acesas
    x.clearRect(bx + w * 0.55, base - h + 6, 10 + hash(i + 5) * 12, 14);
    for (let k = 0; k < 2; k++) if (hash(i * 7 + k) > 0.35) { const wx = bx + 8 + k * (w - 28), wy = base - h * 0.6; x.fillStyle = '#ff9a3c'; x.fillRect(wx, wy, 6, 9); x.fillStyle = '#ffd36e'; x.fillRect(wx + 1, wy + 1, 4, 3); x.fillStyle = '#0f1936'; x.fillRect(wx + 3, wy, 1, 9); }
    // vigas
    x.fillStyle = '#0b1230'; for (let k = 0; k < 3; k++) x.fillRect(bx + 6 + k * (w / 3), base - h - 10 - hash(i + k) * 14, 2, 14);
  }
  // cerca
  for (let i = 0; i < 18; i++) { const fx = hash(i + 99) * 1280; R(x, fx, 250, 3, 30, '#0b1230'); R(x, fx - 6, 258, 15, 2, '#0b1230'); }
  // névoa
  [c, x] = mk(640, 90); ART.fog = c;
  for (let i = 0; i < 14; i++) {
    const px = hash(i + 20) * 640, py = 30 + hash(i + 50) * 40, r = 40 + hash(i + 80) * 50;
    for (const o of [0, 640, -640]) { const g = x.createRadialGradient(px + o, py, 0, px + o, py, r); g.addColorStop(0, 'rgba(190,210,245,0.20)'); g.addColorStop(1, 'rgba(190,210,245,0)'); x.fillStyle = g; x.fillRect(px + o - r, py - r, r * 2, r * 2); }
  }
}

/* ---------- sprites estáticos com contorno (props) ---------- */
function bake(w, h, fn) {
  const [c, x] = mk(w, h); fn(x);
  const [o, ox] = mk(w, h);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ox.drawImage(c, dx, dy);
  ox.globalCompositeOperation = 'source-in'; ox.fillStyle = OUTLINE; ox.fillRect(0, 0, w, h); ox.globalCompositeOperation = 'source-over';
  ox.drawImage(c, 0, 0); return o;
}
function makeProps() {
  ART.props = {};
  ART.props.deadtree = [0, 1, 2].map(v => bake(56, 80, x => {
    const bx = 28, base = 78;
    LINE(x, bx, base, bx + (v - 1) * 2, base - 44, 5, '#241a1c'); LINE(x, bx + 1, base, bx + (v - 1) * 2 + 1, base - 44, 2, '#3a2a28');
    for (let i = 0; i < 5; i++) {
      const sy = base - 18 - i * 9, dir = i % 2 ? 1 : -1, len = 12 + hash(v * 9 + i) * 12;
      LINE(x, bx + (v - 1) * 0.5, sy, bx + dir * len, sy - 8 - hash(i + v) * 8, 3, '#241a1c');
      LINE(x, bx + dir * len, sy - 8, bx + dir * (len + 6), sy - 16, 2, '#241a1c');
      R(x, bx + dir * len * 0.6 - 1, sy - 6, 5, 2, '#dfeaff');
    }
    R(x, bx - 3, base - 2, 8, 3, '#dfeaff');
  }));
  ART.props.rubble = [0, 1, 2].map(v => bake(40, 22, x => {
    for (let i = 0; i < 6; i++) { const bx = 4 + hash(v * 5 + i) * 26, bw = 6 + hash(i + v) * 9, bh = 4 + hash(i + 3 + v) * 8; R(x, bx, 21 - bh, bw, bh, i % 2 ? '#3b4a6e' : '#2c3b5f'); R(x, bx, 21 - bh, bw, 1, '#6f84b4'); }
    R(x, 2, 18, 36, 3, '#dfeaff');
  }));
  ART.props.barrel = bake(18, 22, x => { R(x, 2, 2, 14, 18, '#6a452a'); R(x, 2, 2, 14, 2, '#8b5e38'); R(x, 2, 6, 14, 1, '#2a1a0e'); R(x, 2, 14, 14, 1, '#2a1a0e'); R(x, 4, 3, 2, 16, '#8b5e38'); R(x, 2, 0, 14, 2, '#eaf2ff'); });
  ART.props.fence = bake(40, 24, x => { for (let i = 0; i < 4; i++) { R(x, 3 + i * 10, 4, 3, 19, '#4a3322'); R(x, 3 + i * 10, 4, 1, 19, '#6a4a30'); } R(x, 2, 9, 36, 2, '#5a3d28'); R(x, 2, 16, 36, 2, '#5a3d28'); R(x, 2, 3, 38, 2, '#eaf2ff'); });
  ART.props.cart = bake(48, 32, x => { R(x, 4, 12, 36, 8, '#5a3d28'); R(x, 4, 12, 36, 2, '#7a5636'); R(x, 6, 8, 3, 6, '#4a3322'); R(x, 36, 6, 3, 8, '#4a3322'); for (const wx of [12, 32]) { x.strokeStyle = '#2a1a0e'; x.lineWidth = 2; x.beginPath(); x.arc(wx, 24, 6, 0, 7); x.stroke(); R(x, wx - 1, 17, 2, 14, '#2a1a0e'); R(x, wx - 6, 23, 12, 2, '#2a1a0e'); } R(x, 2, 9, 40, 3, '#eaf2ff'); });
  ART.props.lamp = bake(14, 50, x => { R(x, 6, 10, 3, 40, '#2c2a33'); R(x, 6, 10, 1, 40, '#55525f'); R(x, 2, 4, 11, 7, '#2c2a33'); R(x, 4, 5, 7, 5, '#ff9a3c'); R(x, 5, 6, 5, 3, '#ffd36e'); R(x, 1, 3, 13, 2, '#2c2a33'); });
  ART.props.banner = bake(26, 70, x => { R(x, 12, 0, 3, 70, '#2c2a33'); R(x, 12, 0, 1, 70, '#55525f'); R(x, 3, 6, 20, 30, '#7a1f24'); R(x, 3, 6, 20, 2, '#a93038'); for (let i = 0; i < 4; i++) R(x, 3 + i * 5, 36 + (i % 2) * 2, 5, 4, '#7a1f24'); R(x, 10, 12, 6, 3, '#d8c070'); R(x, 12, 15, 2, 14, '#d8c070'); R(x, 8, 15, 10, 2, '#d8c070'); });
  ART.props.chest = bake(24, 20, x => { R(x, 2, 8, 20, 11, '#6a452a'); R(x, 2, 8, 20, 2, '#8b5e38'); R(x, 2, 2, 20, 7, '#7a5232'); R(x, 2, 2, 20, 2, '#a07044'); R(x, 2, 8, 20, 1, '#2a1a0e'); R(x, 4, 2, 2, 17, '#b8a46a'); R(x, 18, 2, 2, 17, '#b8a46a'); R(x, 10, 7, 4, 5, '#e6c860'); R(x, 11, 9, 2, 1, '#2a1a0e'); });
  ART.props.chestOpen = bake(24, 24, x => { R(x, 2, 12, 20, 11, '#6a452a'); R(x, 2, 12, 20, 2, '#8b5e38'); R(x, 3, 13, 18, 3, '#1a1008'); R(x, 4, 0, 16, 5, '#7a5232'); R(x, 4, 0, 16, 1, '#a07044'); R(x, 4, 4, 2, 10, '#b8a46a'); R(x, 18, 4, 2, 10, '#b8a46a'); R(x, 4, 4, 16, 8, '#4a3220'); R(x, 2, 12, 20, 1, '#2a1a0e'); });
  ART.props.altar = bake(40, 64, x => {
    R(x, 8, 52, 24, 10, '#2c3b5f'); R(x, 8, 52, 24, 2, '#5a70a0'); R(x, 12, 12, 16, 42, '#34466e'); R(x, 12, 12, 3, 42, '#4a6090'); R(x, 14, 6, 12, 8, '#34466e'); R(x, 16, 2, 8, 6, '#2c3b5f');
    for (let i = 0; i < 4; i++) { R(x, 18, 18 + i * 9, 4, 1, '#59e0d0'); R(x, 19, 16 + i * 9, 2, 5, '#59e0d0'); }
    R(x, 6, 60, 28, 3, '#dfeaff');
  });
  ART.props.flag = bake(26, 60, x => { R(x, 4, 0, 3, 60, '#2c2a33'); R(x, 7, 4, 16, 22, '#2d6a4f'); R(x, 7, 4, 16, 2, '#4a9a74'); R(x, 12, 10, 6, 2, '#dfeaff'); R(x, 14, 8, 2, 12, '#dfeaff'); for (let i = 0; i < 3; i++) R(x, 7 + i * 5, 26, 5, 3, '#2d6a4f'); });
}

/* ---------- desenho de personagens (esqueleto procedural) ---------- */
const [SB, sbx] = mk(112, 112), [SO, sox] = mk(112, 112);
function blit(cx, drawFn, wx, wy, flip, o = {}) {
  sbx.clearRect(0, 0, 112, 112); sbx.save(); sbx.translate(56, 92); drawFn(sbx); sbx.restore();
  // volume: degradê vertical e luz de contorno (lua à direita da tela)
  sbx.globalCompositeOperation = 'source-atop';
  const vg = sbx.createLinearGradient(0, 38, 0, 96); vg.addColorStop(0, 'rgba(210,225,255,0.14)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,24,0.34)');
  sbx.fillStyle = vg; sbx.fillRect(0, 0, 112, 112);
  sox.clearRect(0, 0, 112, 112); sox.drawImage(SB, 0, 0);
  sox.globalCompositeOperation = 'destination-out'; sox.drawImage(SB, flip ? 1 : -1, 1);
  sox.globalCompositeOperation = 'source-in'; sox.fillStyle = o.rim || 'rgba(200,222,255,0.6)'; sox.fillRect(0, 0, 112, 112); sox.globalCompositeOperation = 'source-over';
  sbx.drawImage(SO, 0, 0); sbx.globalCompositeOperation = 'source-over';
  if (o.flash > 0) { sbx.globalCompositeOperation = 'source-atop'; sbx.fillStyle = `rgba(255,255,255,${Math.min(0.85, o.flash * 7)})`; sbx.fillRect(0, 0, 112, 112); sbx.globalCompositeOperation = 'source-over'; }
  if (o.tint) { sbx.globalCompositeOperation = 'source-atop'; sbx.fillStyle = o.tint; sbx.fillRect(0, 0, 112, 112); sbx.globalCompositeOperation = 'source-over'; }
  sox.clearRect(0, 0, 112, 112);
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) sox.drawImage(SB, dx, dy);
  sox.globalCompositeOperation = 'source-in'; sox.fillStyle = o.outline || OUTLINE; sox.fillRect(0, 0, 112, 112); sox.globalCompositeOperation = 'source-over';
  cx.save(); cx.translate(Math.round(wx), Math.round(wy)); if (flip) cx.scale(-1, 1); cx.translate(-56, -92);
  if (o.alpha != null) cx.globalAlpha = o.alpha;
  cx.drawImage(SO, 0, 0); cx.drawImage(SB, 0, 0); cx.restore();
}
function leg(c, hx, hy, a, k, col, boot, l1 = 7, l2 = 7) {
  const kx = hx + Math.sin(a) * l1, ky = hy + Math.cos(a) * l1, b = a - k, fx = kx + Math.sin(b) * l2, fy = ky + Math.cos(b) * l2;
  LINE(c, hx, hy, kx, ky, 3, col); LINE(c, kx, ky, fx, fy, 3, col);
  R(c, fx - 1, fy - 1, 6, 3, boot); R(c, fx - 1, fy - 1, 6, 1, 'rgba(255,255,255,0.18)');
}
/* h: {t, mode, vx, vy, lean, atk:{p,step,dir}, wpn, pal, stage, robe, shield, aim, scale} */
function drawHuman(c, h) {
  const p = h.pal, t = h.t, s = h.scale || 1;
  c.save(); if (s !== 1) c.scale(s, s);
  const run = h.mode === 'run', spd = Math.min(1, Math.abs(h.vx || 0) / 230);
  const ph = t * 13 * (0.55 + spd * 0.5);
  let crouch = 0, lean = 0, bob = 0;
  if (h.mode === 'idle') bob = Math.sin(t * 2.2) * 0.6;
  if (run) { bob = Math.abs(Math.sin(ph)) * -1.4; lean = 1.5; }
  if (h.mode === 'dodge') { crouch = 6; lean = 5; }
  if (h.mode === 'hurt') lean = -3;
  if (h.mode === 'air') lean = h.vy < 0 ? 0.5 : -0.5;
  if (h.atk && h.atk.dir === 'fwd') lean += (h.atk.step === 3 ? 4 : 2) * Math.sin(Math.min(1, h.atk.p) * 3.14);
  const hipY = -14 + crouch * 0.6 + bob, shY = -24 + crouch + bob, headY = -29 + crouch + bob;
  // pernas
  if (!h.robe) {
    if (run) { leg(c, -1, hipY, Math.sin(ph) * 0.95, Math.max(0, Math.cos(ph)) * 1.2, p.leg || p.cloth, p.boots); leg(c, 1, hipY, Math.sin(ph + 3.14) * 0.95, Math.max(0, Math.cos(ph + 3.14)) * 1.2, p.leg || p.cloth, p.boots); }
    else if (h.mode === 'air') { leg(c, -1, hipY, 0.7, 1.1, p.leg || p.cloth, p.boots); leg(c, 1, hipY, -0.2, 0.5, p.leg || p.cloth, p.boots); }
    else if (h.mode === 'wall') { leg(c, -1, hipY, 0.4, 0.2, p.leg || p.cloth, p.boots); leg(c, 1, hipY, 0.9, 0.9, p.leg || p.cloth, p.boots); }
    else if (h.mode === 'dodge') { leg(c, -1, hipY, 1.1, 1.6, p.leg || p.cloth, p.boots, 6, 6); leg(c, 1, hipY, 0.4, 1.3, p.leg || p.cloth, p.boots, 6, 6); }
    else { leg(c, -2, hipY, 0.12, 0.1, p.leg || p.cloth, p.boots); leg(c, 2, hipY, -0.1, 0.05, p.leg || p.cloth, p.boots); }
  }
  // manto / túnica longa
  if (p.cloak) {
    const flow = (run ? 2.6 : 0.8) + (h.mode === 'air' ? 2 : 0) + Math.abs(h.vx || 0) * 0.004, ln = h.robe ? 24 : 17;
    for (let i = 0; i < ln; i++) {
      const f = i / ln, off = flow * f * f * 6 + Math.sin(t * 6 - i * 0.45) * 1.3 * f + (h.mode === 'hurt' ? -f * 3 : 0);
      R(c, -5 - off + lean * 0.4 * (1 - f), shY + i - 1, 8 + off * 0.5, 1, i % 5 === 0 ? p.cloakD : p.cloak);
      if (!h.robe && i > ln - 4) R(c, -5 - off, shY + i - 1, 2, 1, p.cloakD);
    }
    if (h.robe) for (let i = 0; i < 10; i++) R(c, -6 + i * 0.5, shY + 18 + i * 0.7, 12 - i, 1, p.cloak);
  }
  // braço de trás
  const swingB = run ? Math.sin(ph + 3.14) * 0.9 : (h.mode === 'idle' ? 0.1 : 0.3);
  const sx = lean, sy = shY + 2;
  LINE(c, sx - 1, sy, sx - 1 + Math.sin(swingB) * 8, sy + Math.cos(swingB) * 8, 3, p.armD || p.cloakD || p.cloth);
  // tronco
  R(c, -4 + lean, shY, 9, 11, p.cloth); R(c, -4 + lean, shY, 9, 2, p.clothL || p.cloth); R(c, 3 + lean, shY, 2, 11, p.clothD || p.cloth);
  R(c, -4 + lean, shY + 8, 9, 2, p.belt || '#3a2a1e'); R(c, lean, shY + 8, 2, 2, '#c8b070');
  if (p.plate) { R(c, -3 + lean, shY + 1, 7, 6, p.plate); R(c, -3 + lean, shY + 1, 7, 1, '#9aa8c4'); }
  // cabeça
  const hx = lean + 1;
  R(c, hx - 3, headY - 3, 7, 7, p.skin); R(c, hx - 3, headY + 3, 7, 1, p.skinD || p.skin);
  if (p.hood) { R(c, hx - 4, headY - 5, 9, 5, p.hood); R(c, hx - 4, headY - 5, 3, 10, p.hood); R(c, hx + 3, headY - 3, 2, 4, p.hood); }
  else if (p.helm) { R(c, hx - 4, headY - 5, 9, 5, p.helm); R(c, hx - 4, headY - 5, 9, 1, '#aab6d0'); R(c, hx - 4, headY - 1, 2, 4, p.helm); R(c, hx + 1, headY - 1, 1, 4, p.helm); }
  else { R(c, hx - 4, headY - 5, 9, 4, p.hair); R(c, hx - 4, headY - 5, 3, 8, p.hair); R(c, hx + 2, headY - 4, 3, 2, p.hair); R(c, hx - 5, headY - 4, 2, 6, p.hair); }
  if (p.mask) { R(c, hx - 1, headY, 5, 4, p.mask); R(c, hx, headY + 2, 3, 1, '#2a2a30'); }
  if (!p.helm || p.eye) { R(c, hx + 1, headY - 1, 2, 1, h.stage >= 1 ? '#ffb347' : (p.eye || '#fff')); }
  if (h.stage >= 2) { R(c, hx - 3, headY - 9, 2, 5, '#8b8f9d'); R(c, hx + 2, headY - 9, 2, 5, '#8b8f9d'); R(c, hx - 3, headY - 9, 1, 3, '#c9cdd9'); R(c, hx - 2, headY - 5, 1, 1, '#d8a0a0'); }
  if (p.fur) { R(c, hx - 5, shY - 2, 11, 4, p.fur); R(c, hx - 5, shY - 2, 11, 1, '#c8ccd8'); }
  // cachecol
  if (p.scarf) for (let i = 0; i < 7; i++) {
    const f = i / 7, sxs = hx - 3 - i * 1.5 - spd * i * 1.4 - (h.mode === 'air' ? 1.5 * i * 0.4 : 0), sys = shY - 1 + Math.sin(t * 9 - i * 0.9) * 1.3 * f + (h.mode === 'air' && h.vy > 0 ? -i * 0.6 : i * 0.3);
    R(c, sxs, sys, 3, 3, i % 2 ? p.scarf : p.scarfD);
  }
  // braço da frente + arma
  let a = 0.45;
  if (run) a = Math.sin(ph) * 0.9 + 0.3;
  if (h.mode === 'air') a = h.vy < 0 ? -1.2 : 1.2;
  if (h.mode === 'dodge') a = 1.0;
  if (h.aim) a = 1.45;
  if (h.atk) {
    const q = Math.min(1, h.atk.p), e = q < 0.2 ? q / 0.2 * 0.35 : 0.35 + (q - 0.2) / 0.8 * 0.65;
    if (h.atk.dir === 'up') a = 0.6 + (-3.3 - 0.6) * e; else if (h.atk.dir === 'down') a = -0.6 + (0.2 + 0.6) * e;
    else if (h.atk.step === 3 || h.atk.step === 2 && h.wpn === 'axe') a = -1.3 + 2.9 * e;
    else if (h.atk.step % 2) a = -2.7 + 4.2 * e; else a = 2.0 - 4.0 * e + 1.0;
  }
  const a1 = h.aim ? 1.45 : a * 0.75 + 0.1;
  const ex = sx + Math.sin(a1) * 5, ey = sy + Math.cos(a1) * 5, hxp = ex + Math.sin(a) * 5, hyp = ey + Math.cos(a) * 5;
  LINE(c, sx + 1, sy, ex, ey, 3, p.arm || p.cloth); LINE(c, ex, ey, hxp, hyp, 3, p.arm || p.cloth);
  R(c, hxp - 1, hyp - 1, 3, 3, h.stage >= 3 ? '#8b8f9d' : p.skin);
  if (h.stage >= 3) { R(c, hxp + 1, hyp, 2, 1, '#e8ecf5'); R(c, hxp + 1, hyp + 1, 2, 1, '#e8ecf5'); }
  const dx = Math.sin(a), dy = Math.cos(a);
  if (h.wpn === 'sword') { LINE(c, hxp - dx * 2, hyp - dy * 2, hxp - dx * 4, hyp - dy * 4, 3, '#5a3d28'); LINE(c, hxp + dx * 1, hyp + dy * 1, hxp + dx * 17, hyp + dy * 17, 2, '#dfe8f8'); LINE(c, hxp + dx * 1, hyp + dy * 1, hxp + dx * 17, hyp + dy * 17, 1, '#ffffff'); R(c, hxp + dx * 1 - dy * 3 - 1, hyp + dy * 1 + dx * 3 - 1, 3, 3, '#c8b070'); }
  else if (h.wpn === 'axe') { LINE(c, hxp - dx * 3, hyp - dy * 3, hxp + dx * 15, hyp + dy * 15, 2, '#6a452a'); const tx = hxp + dx * 14, ty = hyp + dy * 14; LINE(c, tx - dy * 1, ty + dx * 1, tx + dx * 3 - dy * 5, ty + dy * 3 + dx * 5, 4, '#aeb9d0'); LINE(c, tx + dy * 1, ty - dx * 1, tx + dx * 3 + dy * 5, ty + dy * 3 - dx * 5, 4, '#aeb9d0'); R(c, tx - 1, ty - 1, 3, 3, '#e8eefc'); }
  else if (h.wpn === 'spear') { LINE(c, hxp - dx * 6, hyp - dy * 6, hxp + dx * 24, hyp + dy * 24, 2, '#7a5232'); const tx = hxp + dx * 24, ty = hyp + dy * 24; LINE(c, tx, ty, tx + dx * 8, ty + dy * 8, 3, '#dfe8f8'); LINE(c, tx, ty, tx + dx * 8, ty + dy * 8, 1, '#ffffff'); }
  else if (h.wpn === 'cstaff') { LINE(c, hxp - dx * 8, hyp - dy * 8, hxp + dx * 22, hyp + dy * 22, 2, '#6a452a'); const tx = hxp + dx * 22, ty = hyp + dy * 22; R(c, tx - 2, ty - 2, 5, 5, '#59e0d0'); R(c, tx - 1, ty - 1, 3, 3, '#e8fffb'); R(c, tx - 3, ty + 3, 2, 3, '#d8c070'); }
  else if (h.wpn === 'fist') { R(c, hxp - 3, hyp - 3, 7, 7, '#8c98b0'); R(c, hxp - 2, hyp - 2, 5, 2, '#dfe8f8'); R(c, hxp + dx * 3 - 1, hyp + dy * 3 - 1, 3, 3, '#e8eefc'); }
  else if (h.wpn === 'crossbow') { R(c, hxp - 2, hyp - 1, 12, 3, '#5a3d28'); R(c, hxp + 6, hyp - 5, 2, 11, '#2c2a33'); R(c, hxp + 7, hyp - 5, 1, 11, '#8c98b0'); R(c, hxp - 1, hyp - 1, 9, 1, '#8b5e38'); }
  else if (h.wpn === 'blade') { LINE(c, hxp, hyp, hxp + dx * 14, hyp + dy * 14, 3, '#c9d3e8'); LINE(c, hxp, hyp, hxp + dx * 14, hyp + dy * 14, 1, '#fff'); R(c, hxp - 1, hyp - 1, 3, 3, '#5a3d28'); }
  if (h.shield) { R(c, sx + 3, sy + 1, 7, 13, '#3a4258'); R(c, sx + 3, sy + 1, 7, 2, '#7e8aa3'); R(c, sx + 3, sy + 1, 1, 13, '#7e8aa3'); R(c, sx + 5, sy + 6, 3, 3, '#a93038'); }
  if (p.staff) { LINE(c, hxp, hyp - 14, hxp, hyp + 26, 2, '#6a452a'); R(c, hxp - 2, hyp - 18, 5, 5, '#59e0d0'); R(c, hxp - 1, hyp - 17, 3, 3, '#e8fffb'); }
  if (p.chains) { for (let i = 0; i < 4; i++) { R(c, -4 + i * 3, shY + 10 + (i % 2), 2, 5, '#c0c6d6'); R(c, -4 + i * 3, shY + 14 + (i % 2), 3, 2, '#e8e4d8'); } }
  if (p.quiver) R(c, -7, shY - 3, 3, 12, '#5a3d28');
  c.restore();
}
const PAL_PLAYER = {skin: '#dcaa82', skinD: '#b98860', hair: '#2a1d17', cloth: '#7a7468', clothL: '#8e887a', clothD: '#5a554a', cloak: '#4f6690', cloakD: '#37486e', boots: '#3a2a1e', scarf: '#d4622c', scarfD: '#a8461c', belt: '#3a2a1e', arm: '#7a7468', armD: '#4f6690'};
const PAL_SOLDADO = {skin: '#c9a07c', cloth: '#2c3142', clothL: '#3a4258', clothD: '#1e2230', boots: '#1a1d26', helm: '#7e8aa3', plate: '#566078', cloak: '#8a2b2b', cloakD: '#5e1c1c', arm: '#3a4258', belt: '#5e1c1c'};
const PAL_BESTA = {skin: '#c9a07c', cloth: '#3a3f52', clothL: '#4a5068', clothD: '#2a2e3d', boots: '#1a1d26', hood: '#2c3342', cloak: '#3f4760', cloakD: '#2a3144', arm: '#3a3f52', quiver: true};
const PAL_BOSS = {skin: '#c9a07c', cloth: '#241b20', clothL: '#33262d', clothD: '#171116', boots: '#120e12', hood: '#241b20', mask: '#e8e4d8', cloak: '#2e2128', cloakD: '#1b1317', arm: '#33262d', fur: '#8c8f9a', chains: true, belt: '#6a1f1f', leg: '#241b20', eye: '#ff4040'};
const PAL_NATALIE = {skin: '#a8754f', hair: '#1c1410', cloth: '#7a5a3a', clothL: '#8f6c48', cloak: '#6b7f5a', cloakD: '#4e5f42', boots: '#3a2a1e', scarf: '#d8b04a', scarfD: '#a98a30', arm: '#7a5a3a', staff: true, belt: '#c8a050'};

function drawWolf(c, w) {
  const t = w.t, st = w.state, run = Math.abs(w.vx) > 30 && w.onGround, ph = t * 15;
  const crouch = st === 'wind' ? 3 : 0, air = !w.onGround;
  const fur = w.ghost ? 'rgba(120,230,220,0.8)' : '#6c7590', furD = w.ghost ? 'rgba(60,170,170,0.8)' : '#4a5169', furL = w.ghost ? 'rgba(200,255,250,0.9)' : '#9aa5c2';
  const bob = run ? Math.sin(ph * 2) * 0.8 : 0;
  // pernas traseiras e dianteiras
  const legs = [[-9, 0], [-5, 3.14], [5, 1.5], [8, 4.6]];
  legs.forEach(([lx, off], i) => {
    const a = run ? Math.sin(ph + off) * 0.9 : (air ? (i < 2 ? 0.7 : -0.6) : 0), k = run ? Math.max(0, Math.cos(ph + off)) : (air ? 0.8 : 0);
    const hy = -10 + crouch, fx = lx + Math.sin(a) * 4 + Math.sin(a - k) * 4, fy = hy + Math.cos(a) * 4 + Math.cos(a - k) * 4;
    LINE(c, lx, hy, lx + Math.sin(a) * 4, hy + Math.cos(a) * 4, 3, i % 2 ? furD : fur); LINE(c, lx + Math.sin(a) * 4, hy + Math.cos(a) * 4, fx, fy, 2, i % 2 ? furD : fur); R(c, fx - 1, fy, 4, 2, '#2a2f40');
  });
  // cauda
  LINE(c, -11, -15 + crouch, -19, -18 + crouch + Math.sin(t * 5) * 2, 3, fur); LINE(c, -19, -18 + crouch + Math.sin(t * 5) * 2, -23, -15 + crouch + Math.sin(t * 5) * 3, 2, furL);
  // corpo
  R(c, -12, -19 + crouch + bob, 24, 9, fur); R(c, -11, -20 + crouch + bob, 20, 2, furL); R(c, -11, -12 + crouch + bob, 20, 3, furD); R(c, -8, -9 + crouch + bob, 15, 2, furL);
  for (let i = 0; i < 5; i++) R(c, -9 + i * 4, -22 + crouch + bob, 2, 3, furL);
  // cabeça
  const hy = -21 + crouch + bob + (st === 'lunge' ? 2 : 0), jaw = st === 'lunge' || st === 'wind' ? 3 : 0;
  R(c, 10, hy, 9, 9, fur); R(c, 10, hy, 9, 2, furL); R(c, 17, hy + 3, 7, 4, fur); R(c, 22, hy + 3, 2, 2, '#1a1d26');
  R(c, 17, hy + 7 + jaw, 6, 2, furD); if (jaw) { R(c, 18, hy + 6, 1, 2, '#f0f0f0'); R(c, 21, hy + 6, 1, 2, '#f0f0f0'); }
  R(c, 11, hy - 4, 3, 5, furD); R(c, 15, hy - 4, 3, 5, furD); R(c, 12, hy - 3, 1, 3, '#a87a7a');
  R(c, 14, hy + 2, 3, 2, w.ghost ? '#ffffff' : '#ffd24a'); R(c, 15, hy + 2, 1, 2, '#401000');
}

/* ---------- fogo e brasas ---------- */
function flame(c, x, y, w, h, col, t, ph) {
  for (let r = 0; r < h; r++) {
    const f = r / h, wd = Math.max(1, Math.round(w * (1 - Math.pow(f, 1.4)))), sw = Math.sin(t * 9 + ph + r * 0.35) * 1.6 * f;
    R(c, x - wd / 2 + sw, y - r, wd, 1, col);
  }
}
function drawFire(c, x, y, t, s = 1) {
  R(c, x - 10, y - 2, 20, 3, '#2a1a0e');
  LINE(c, x - 9, y - 1, x + 7, y - 6, 3, '#5a3a22'); LINE(c, x + 9, y - 1, x - 7, y - 6, 3, '#4a2e1a');
  flame(c, x, y - 3, 14 * s, 22 * s + Math.sin(t * 11) * 2, '#c9300f', t, 0);
  flame(c, x - 1, y - 3, 11 * s, 18 * s + Math.sin(t * 13 + 1) * 2, '#ff6a1a', t, 1.3);
  flame(c, x, y - 3, 8 * s, 13 * s + Math.sin(t * 15 + 2) * 2, '#ffb02e', t, 2.2);
  flame(c, x, y - 3, 4 * s, 8 * s + Math.sin(t * 17) * 1.5, '#fff1b0', t, 3.1);
}
