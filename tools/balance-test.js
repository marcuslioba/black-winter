/* Bot de equilÃ­brio: luta contra o chefe com cada classe e mede vitÃ³rias e SaÃºde restante.
   Uso: node tools/balance-test.js "<caminho>/inverno-sombrio" [tentativas] */
const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = process.argv[2], N = +process.argv[3] || 10;
const noop = () => {}; const L2 = {};
const ctxProxy = new Proxy({}, {get: (t, k) => k === 'measureText' ? () => ({width: 50}) : k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({addColorStop: noop}) : (k in t ? t[k] : noop), set: (t, k, v) => { t[k] = v; return true; }});
const el = () => ({style: {}, dataset: {}, classList: {add: noop, remove: noop}, getContext: () => ctxProxy, querySelector: () => null, querySelectorAll: () => [], addEventListener: noop, innerHTML: '', width: 960, height: 540});
const els = {};
const doc = {createElement: () => el(), getElementById: id => els[id] || (els[id] = el()), addEventListener: noop, activeElement: null};
const store = {};
const sandbox = {
  document: doc, window: null, console, Math, Date, performance: {now: () => Date.now()},
  localStorage: {getItem: k => store[k] || null, setItem: (k, v) => store[k] = v, removeItem: k => delete store[k]},
  navigator: {getGamepads: () => []}, setInterval: noop, setTimeout, requestAnimationFrame: noop, cancelAnimationFrame: noop,
  addEventListener: (ev, fn) => { (L2[ev] = L2[ev] || []).push(fn); }, Event: function () {}, AudioContext: undefined, Set, Map, Image: function () { this.onload = null; }
};
sandbox.__L2 = L2; sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.__N = N;
const ctx = vm.createContext(sandbox);
const files = ['data', 'audio', 'input', 'player', 'itens', 'level', 'game', 'art', 'sprites', 'render', 'ui'];
let code = files.map(f => fs.readFileSync(path.join(dir, 'js', f + '.js'), 'utf8')).join('\n;\n');
code += `
;(function(){ const process_dbg = false;
  const b0 = () => G.boss ? G.boss.state + ' x' + (G.boss.x|0) + ' hp' + (G.boss.hp|0) : 'none';
  const held = Input.held, pressed = Input.pressed;
  const key = (c, on) => (globalThis.__L2[on ? 'keydown' : 'keyup'] || []).forEach(f => f({code: c, target: {}, preventDefault() {}}));
  const move = d => { key('KeyD', d > 0); key('KeyA', d < 0); Input.poll(); };
  function fight(classe, arma) {
    P = newPlayer('Bot', classe); P.slot = 1; P.flags.canis = true; P.nivel = 3; P.xp = 0;
    if (arma) P.armas = [{id: arma, rank: 0, ramo: null, runas: []}];
    refresh(); beginWorld(false); P.hp = hpMax(P, S);
    pl.x = 174 * TS; pl.y = L.GROUND * TS - 40;
    for (let i = 0; i < 40; i++) { Input.poll(); step(1/60); }
    G.bossActive = true;
    let t = 0;
    while (t < 90 * 60) {
      t++;
      if (G.mode === 'dialog') { pressed.interact = true; updateDialog(); pressed.interact = false; continue; }
      if (G.mode !== 'play') return {win: false, t: t / 60, boss: G.boss ? G.boss.hp : 0};
      if (P.flags.bossMorto) return {win: true, t: t / 60, hp: P.hp};
      Input.poll();
      for (const k of Object.keys(held)) held[k] = false;
      if (t % 600 === 0 && process_dbg) console.log('dbg', t, G.mode, b0(), pl.x | 0, G.bossActive);
      const b = G.boss, dx = b.x - pl.x, ad = Math.abs(dx), wdr = WEAPONS[P.armas[P.arma].id].alcance;
      const danger = (b.state === 'dash' && b.phase <= 1) || (b.state === 'leap' && b.phase === 0 && ad < 140);
      const projNear = G.projs.some(p => !p.from && Math.abs(p.x - pl.x) < 90 && Math.abs(p.y - cyOf(pl)) < 30);
      if ((danger && ad < 150 || projNear) && P.folego >= S.dodgeCost) pressed.dodge = true;
      if (ad > wdr + 10) move(dx > 0 ? 1 : -1);
      else { move(0); pl.facing = dx > 0 ? 1 : -1; pressed.attack = t % 10 === 0; }
      if (t % 75 === 0 && P.hp < hpMax(P, S) * 0.5 && P.itens.raiz > 0) pressed.heal = true;
      step(1/60);
    }
    return {win: false, t: 90, boss: G.boss ? G.boss.hp : 0};
  }

  function mob(classe, sp) {
    P = newPlayer('Bot', classe); P.slot = 1; refresh(); beginWorld(false); P.hp = hpMax(P, S);
    G.enemies = [mkEnemy(sp)]; const e = G.enemies[0];
    pl.x = e.x - (e.type === 'besta' ? 70 : 160); pl.y = e.y + e.h - pl.h; pl.facing = 1;
    const hp0 = P.hp;
    for (let t = 0; t < 40 * 60; t++) {
      if (G.mode !== 'play') return {dead: true, lost: hp0};
      if (process_dbg && e.type === 'besta' && t % 120 === 0) console.log('besta', t, e.state, e.x|0, e.y|0, 'hp', e.hp, 'pl', pl.x|0, pl.y|0, 'ground', pl.onGround);
      if (e.dead) return {dead: false, lost: hp0 - P.hp, t};
      Input.poll(); for (const k of Object.keys(held)) held[k] = false;
      const dx = e.x - pl.x, ad = Math.abs(dx), wdr = WEAPONS[P.armas[P.arma].id].alcance;
      const incoming = (e.state === 'wind' || e.state === 'lunge') && ad < 130;
      if (incoming && P.folego >= S.dodgeCost && t % 40 === 0) pressed.dodge = true;
      if (ad > wdr + 6) move(dx > 0 ? 1 : -1); else { move(0); pl.facing = dx > 0 ? 1 : -1; pressed.attack = t % 10 === 0; }
      step(1/60);
    }
    return {dead: false, lost: hp0 - P.hp, timeout: true};
  }
  const sps = new Map(); for (const s of buildChapter1().spawns) sps.set(s.type, s);
  for (const c of ['barbaro', 'guardiao']) for (const [type, sp] of sps) {
    let lost = 0, deaths = 0; const n = 6;
    for (let i = 0; i < n; i++) { const r = mob(c, sp); lost += r.lost; if (i===0 && c==='barbaro') console.log('  ttk', type, r.t, r.timeout); if (r.dead) deaths++; }
    console.log(c.padEnd(9), type.padEnd(8), 'HP perdido medio', Math.round(lost / n), 'mortes', deaths + '/' + n);
  }
  for (const c of ['barbaro', 'cacador', 'guardiao', 'cacique']) {
    let w = 0, hp = 0, tt = 0;
    for (let i = 0; i < __N; i++) { const r = fight(c); if (process_dbg) console.log(JSON.stringify(r), P.hp, G.mode); if (r.win) { w++; hp += r.hp; tt += r.t; } }
    console.log(c.padEnd(9), 'vitorias', w + '/' + __N, w ? 'HP medio ' + Math.round(hp / w) + ' tempo medio ' + (tt / w).toFixed(0) + 's' : '');
  }
})();
`;
try { vm.runInContext(code, ctx, {filename: 'bundle.js'}); } catch (e) { console.error('ERRO:', e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }

