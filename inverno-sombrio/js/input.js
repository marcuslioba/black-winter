'use strict';
/* ===== Entrada: teclado, mouse e gamepad ===== */
const Input = (() => {
  const keys = {}, mouse = {l: false, r: false};
  let cur = {}, prev = {};
  const pressed = {};
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'power', 'dodge', 'interact', 'heal', 'rimora', 'pause', 'confirm', 'back', 'skill', 'berserk'];
  const KEYMAP = {
    left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'],
    jump: ['Space', 'KeyZ'], attack: ['KeyJ'], power: ['KeyK'], dodge: ['ShiftLeft', 'ShiftRight', 'KeyL'],
    interact: ['KeyE'], skill: ['KeyF'], heal: ['KeyQ'], rimora: ['KeyR'], pause: ['Escape', 'KeyP'], confirm: ['Enter'], back: ['Escape'], berserk: ['KeyG']
  };
  let device = 'kb', padKind = 'xbox';   // último dispositivo usado e tipo do controle (xbox, ps)
  addEventListener('keydown', e => {
    keys[e.code] = true; device = 'kb';
    const typing = e.target && e.target.tagName === 'INPUT' && e.target.type === 'text';
    if (!typing && ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.l = mouse.r = false; });
  const cvEl = () => document.getElementById('cv');
  addEventListener('mousedown', e => {
    if (e.target !== cvEl()) return;
    device = 'kb'; if (e.button === 0) mouse.l = true; if (e.button === 2) mouse.r = true;
  });
  addEventListener('mouseup', e => { if (e.button === 0) mouse.l = false; if (e.button === 2) mouse.r = false; });
  addEventListener('contextmenu', e => e.preventDefault());

  let axisX = 0, usingPad = false;
  function poll() {
    const raw = {};
    for (const a of ACTIONS) raw[a] = (KEYMAP[a] || []).some(k => keys[k]);
    if (mouse.l) raw.attack = true;
    if (mouse.r) raw.power = true;
    axisX = (raw.right ? 1 : 0) - (raw.left ? 1 : 0);
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of pads) {
      if (!gp || !gp.connected) continue;
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (gp.buttons.some(x => x.pressed) || Math.abs(ax) > 0.5 || Math.abs(ay) > 0.5) { device = 'pad'; padKind = /054c|playstation|dualshock|dualsense|wireless controller/i.test(gp.id) ? 'ps' : 'xbox'; }
      if (ax < -0.35 || b(14)) raw.left = true;
      if (ax > 0.35 || b(15)) raw.right = true;
      if (ay < -0.5 || b(12)) raw.up = true;
      if (ay > 0.5 || b(13)) raw.down = true;
      if (Math.abs(ax) > 0.2) axisX = Math.max(-1, Math.min(1, ax));
      else if (raw.left || raw.right) axisX = (raw.right ? 1 : 0) - (raw.left ? 1 : 0);
      if (b(0)) { raw.jump = true; raw.confirm = true; raw.interact = true; }
      if (b(2)) raw.attack = true;
      if (b(1)) { raw.skill = true; raw.back = true; }
      if (b(3)) raw.power = true;
      if (b(4)) raw.heal = true;
      if (b(5)) raw.rimora = true;
      if (b(6)) raw.berserk = true;
      if (b(7)) raw.dodge = true;
      if (b(9)) raw.pause = true;
      break;
    }
    for (const a of ACTIONS) pressed[a] = !!raw[a] && !cur[a];
    cur = raw;
  }
  // suprime bordas até soltar os botões (usado ao abrir/fechar menus)
  function clear() { for (const a of ACTIONS) { cur[a] = true; pressed[a] = false; } mouse.l = mouse.r = false; }
  /* nome do botão de cada ação, conforme o dispositivo em uso */
  const LBL = {
    kb:   {jump: 'Espaço', attack: 'J', power: 'K', skill: 'F', dodge: 'Shift', interact: 'E', heal: 'Q', rimora: 'R', pause: 'Esc', berserk: 'G', confirm: 'Enter', move: 'A / D'},
    xbox: {jump: 'A', attack: 'X', power: 'Y', skill: 'B', dodge: 'RT', interact: 'A', heal: 'LB', rimora: 'RB', pause: 'Menu', berserk: 'LT', confirm: 'A', move: 'analógico'},
    ps:   {jump: '✕', attack: '□', power: '△', skill: '○', dodge: 'R2', interact: '✕', heal: 'L1', rimora: 'R1', pause: 'Options', berserk: 'L2', confirm: '✕', move: 'analógico'}
  };
  const label = a => (LBL[device === 'kb' ? 'kb' : padKind] || LBL.kb)[a] || a;
  return {poll, clear, label, get held() { return cur; }, pressed, get axisX() { return axisX; }, get device() { return device; }, get padKind() { return padKind; }};
})();
/* atalhos para textos: KEY('jump') -> "Espaço" ou "A"; keyText('use {heal}') troca os {marcadores} */
const KEY = a => Input.label(a);
const keyText = s => s.replace(/\{(\w+)\}/g, (m, a) => KEY(a));
