'use strict';
/* ===== Áudio gerado por código (Web Audio): trilha dinâmica, reverb e efeitos com camadas =====
   Não usa arquivos de som. Os efeitos são montados em camadas (corpo grave + ruído filtrado + estalo + reverb),
   a voz usa formantes, e a música do chefe sobe de intensidade conforme a vida dele cai. */
const Snd = (() => {
  let ctx = null, master, musicG, sfxG, noiseBuf, droneG, windG, windFilter, timer = null, verb, verbSend, musicSend;
  let mode = 'none', step = 0, nextT = 0, intensity = 0, tAmbient = 0, bossStinger = 0;
  const vol = {music: 0.5, sfx: 0.7};
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const R = (a, b) => a + Math.random() * (b - a);
  const MINOR = [0, 3, 5, 7, 8, 10, 12, 15];           // menor natural, para sinos e melodia
  const ROOTS = [45, 41, 43, 40];                        // explorar (A, F, G, E)
  const BOSS_ROOTS = [38, 38, 41, 37];
  const FURY_ROOTS = [45, 45, 48, 43];                   // fúria (A, A, C, G): movimento e urgência                   // chefe (D, D, F, Db: tensão)
  const MODES = {
    menu:    {bpm: 50,  drone: 0.10, wind: 0.10, bells: 0.35, pad: 0.7, drums: false},
    explore: {bpm: 56,  drone: 0.07, wind: 0.14, bells: 0.16, pad: 0.55, drums: false},
    camp:    {bpm: 58,  drone: 0.04, wind: 0.05, bells: 0.55, pad: 0.4, drums: false, arp: true},
    boss:    {bpm: 96,  drone: 0.16, wind: 0.10, bells: 0,    pad: 0,   drums: true,  boss: true},
    fury:    {bpm: 150, drone: 0.12, wind: 0.02, bells: 0, pad: 0, drums: true, fury: true},
    none:    {bpm: 60,  drone: 0, wind: 0, bells: 0, pad: 0, drums: false}
  };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(comp); comp.connect(ctx.destination);
    musicG = ctx.createGain(); sfxG = ctx.createGain(); musicG.connect(master); sfxG.connect(master);
    // reverb por convolução: resposta gerada (cauda de ruído que escurece)
    const rl = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, rl, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < rl; i++) { const k = i / rl; lp += ((Math.random() * 2 - 1) - lp) * (0.9 - 0.75 * k); d[i] = lp * Math.pow(1 - k, 2.6) * 2.2; } }
    verb = ctx.createConvolver(); verb.buffer = ir; const vg = ctx.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
    verbSend = ctx.createGain(); verbSend.gain.value = 0.35; verbSend.connect(verb); sfxG.connect(verbSend);
    musicSend = ctx.createGain(); musicSend.gain.value = 0.5; musicSend.connect(verb);
    applyVol();
    const len = ctx.sampleRate * 2; noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // vento com rajadas
    const ns = ctx.createBufferSource(); ns.buffer = noiseBuf; ns.loop = true;
    windFilter = ctx.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 420; windFilter.Q.value = 0.7;
    windG = ctx.createGain(); windG.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.09; const lg = ctx.createGain(); lg.gain.value = 240; lfo.connect(lg); lg.connect(windFilter.frequency); lfo.start();
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = 0.23; const lg2 = ctx.createGain(); lg2.gain.value = 0.35; lfo2.connect(lg2); const gust = ctx.createGain(); gust.gain.value = 0.65; lg2.connect(gust.gain); lfo2.start();
    ns.connect(windFilter); windFilter.connect(gust); gust.connect(windG); windG.connect(musicG); ns.start();
    // zumbido grave (dois dentes de serra desafinados + quinta)
    droneG = ctx.createGain(); droneG.gain.value = 0;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 200;
    [[55, -6], [55, 7], [82.41, 3], [110, -4]].forEach(([f, det]) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(); });
    lp.connect(droneG); droneG.connect(musicG);
    nextT = ctx.currentTime + 0.2;
    timer = setInterval(schedule, 80);
    setMode(mode === 'none' ? 'menu' : mode);
  }
  function applyVol() { if (!ctx) return; musicG.gain.value = vol.music; sfxG.gain.value = vol.sfx; }
  function setVol(m, s) { vol.music = m; vol.sfx = s; applyVol(); }
  function setMode(m) {
    mode = m; step = 0; if (!ctx) return;
    const c = MODES[m] || MODES.none, t = ctx.currentTime;
    droneG.gain.cancelScheduledValues(t); droneG.gain.linearRampToValueAtTime(c.drone, t + 1.5);
    windG.gain.cancelScheduledValues(t); windG.gain.linearRampToValueAtTime(c.wind, t + 1.5);
    if (m === 'boss') { intensity = 0; bossStinger = ctx.currentTime; }
  }
  /* 0..1: quanto o chefe já perdeu de vida. Acelera o andamento e acrescenta camadas. */
  function setIntensity(v) { intensity = Math.max(0, Math.min(1, v)); }

  /* ---------- blocos de som ---------- */
  function tone(f, dur, type = 'sine', v = 0.2, slide = null, when = 0, dest = null, send = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.012, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxG); if (send && dest) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(musicSend); }
    o.start(t); o.stop(t + dur + 0.05);
  }
  /* ruído filtrado com ataque e queda; a freq. varre de f0 a f1 */
  function noise(dur, v = 0.2, f0 = 2000, f1 = null, when = 0, dest = null, type = 'bandpass', q = 0.9, att = 0.003) {
    if (!ctx) return;
    const t = ctx.currentTime + when, s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noiseBuf; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest || sfxG); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  /* voz com formantes (grunhido humano) */
  function voice(f0, dur, v = 0.25, form = [650, 1150], slide = 0.7, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * slide, t + dur);
    const vib = ctx.createOscillator(); vib.frequency.value = 22; const vg = ctx.createGain(); vg.gain.value = f0 * 0.03; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.025); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    form.forEach((fc, i) => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = fc; b.Q.value = 5; const bg = ctx.createGain(); bg.gain.value = i ? 0.6 : 1; o.connect(b); b.connect(bg); bg.connect(g); });
    g.connect(sfxG); o.start(t); o.stop(t + dur + 0.05);
    noise(dur * 0.8, v * 0.25, 1800, 900, when, null, 'bandpass', 1.2);
  }
  function bell(f, dur = 2.2, v = 0.1, when = 0, dest = null) {
    if (!ctx) return;
    const t = ctx.currentTime + when, d = dest || musicG;
    [[1, 1], [2.756, 0.45], [5.4, 0.25], [8.93, 0.12]].forEach(([r, a], i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * r;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur / (1 + i * 0.7));
      o.connect(g); g.connect(d); const s = ctx.createGain(); s.gain.value = 0.9; g.connect(s); s.connect(musicSend); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  /* pad de cordas: dois dentes de serra desafinados, ataque lento */
  function pad(f, dur, v, when, dest, cut = 700) {
    if (!ctx) return;
    const t = ctx.currentTime + when, g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(cut * 0.5, t); lp.frequency.linearRampToValueAtTime(cut, t + dur * 0.5);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    [-9, 8].forEach(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(lp); o.start(t); o.stop(t + dur + 0.1); });
    lp.connect(g); g.connect(dest || musicG); const s = ctx.createGain(); s.gain.value = 0.7; g.connect(s); s.connect(musicSend);
  }
  /* cordas agudas com tremolo (tensão) */
  function tremStrings(f, dur, v, when, rate = 8) {
    if (!ctx) return;
    const t = ctx.currentTime + when, g = ctx.createGain(), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2.2; bp.Q.value = 0.8;
    const trem = ctx.createGain(); trem.gain.value = 0.5; const lfo = ctx.createOscillator(); lfo.frequency.value = rate; const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(trem.gain); lfo.start(t); lfo.stop(t + dur + 0.1);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + dur * 0.35); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    [-12, 0, 12].forEach(det => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det; o.connect(bp); o.start(t); o.stop(t + dur + 0.1); });
    bp.connect(trem); trem.connect(g); g.connect(musicG); const s = ctx.createGain(); s.gain.value = 0.8; g.connect(s); s.connect(musicSend);
  }
  function drum(f, v, when, dest) { tone(f * 1.9, 0.05, 'triangle', v * 0.5, f, when, dest); tone(f, 0.38, 'sine', v, f * 0.55, when, dest, 0.5); noise(0.07, v * 0.35, 900, 300, when, dest, 'lowpass'); }

  /* ---------- trilha ---------- */
  function schedule() {
    if (!ctx || mode === 'none') return;
    const c = MODES[mode];
    const bpm = c.boss ? c.bpm + 30 * intensity : c.bpm, sd = 60 / bpm / 4;   // semicolcheia
    while (nextT < ctx.currentTime + 0.35) {
      const t = nextT - ctx.currentTime, bar = Math.floor(step / 16) % 4, s16 = step % 16;
      if (c.boss) bossStep(t, bar, s16, sd);
      else if (c.fury) furyStep(t, bar, s16, sd);
      else {
        const root = ROOTS[bar];
        if (s16 === 0) { pad(mtof(root), sd * 15, 0.05 * c.pad, t, musicG, 600); pad(mtof(root + 7), sd * 15, 0.03 * c.pad, t, musicG, 500); }
        if (s16 === 8 && c.pad > 0.5) pad(mtof(root + 12 + (bar % 2 ? 3 : 0)), sd * 7, 0.03, t, musicG, 900);
        if (c.arp && s16 % 2 === 0) tone(mtof(root + 12 + [0, 7, 12, 7, 3, 10, 12, 7][(s16 / 2) % 8]), sd * 3, 'triangle', 0.06, null, t, musicG, 0.7);
        else if (!c.arp && s16 % 2 === 0 && Math.random() < c.bells * 0.35) bell(mtof(root + 12 + MINOR[Math.floor(Math.random() * MINOR.length)]), 2.6, 0.07, t);
      }
      step++; nextT += sd;
    }
    // sons de ambiente ocasionais (uivo distante, rangido)
    if ((mode === 'explore' || mode === 'menu') && ctx.currentTime > tAmbient) { tAmbient = ctx.currentTime + R(14, 30); if (Math.random() < 0.6) howl(0.4, R(0.5, 1) * 0.5); }
  }
  /* música de ação da Fúria: bumbo e caixa fortes, baixo em semicolcheias, riff e cordas em tremolo */
  function furyStep(t, bar, s16, sd) {
    const root = FURY_ROOTS[bar];
    if (s16 % 4 === 0 || s16 === 10) drum(56, 0.72, t, musicG);
    if (s16 === 4 || s16 === 12) { noise(0.14, 0.34, 3200, 900, t, musicG, 'bandpass', 1.1, 0.002); tone(190, 0.1, 'triangle', 0.3, 110, t, musicG); }
    if (s16 % 2 === 0) noise(0.03, 0.06, 9000, null, t, musicG, 'highpass');
    if (bar === 3 && s16 >= 12) drum(86 - (s16 - 12) * 7, 0.42, t, musicG);                 // rufar de tambores no fim do ciclo
    const bn = root - 12 + (s16 % 8 === 6 ? 12 : s16 % 8 === 7 ? 1 : 0);
    tone(mtof(bn), sd * 0.9, 'sawtooth', 0.14, null, t, musicG);                              // baixo pulsante
    const riff = [0, null, 0, null, 3, null, 0, 5, null, 3, null, 7, 5, null, 3, null][s16];
    if (riff != null) { tone(mtof(root + 12 + riff), sd * 1.6, 'square', 0.06, null, t, musicG); tone(mtof(root + 24 + riff), sd * 1.4, 'sawtooth', 0.025, null, t, musicG); }
    if (s16 === 0) tremStrings(mtof(root + 24), sd * 15, 0.05, t, 10);
    if (s16 === 0 && bar === 0) noise(sd * 14, 0.12, 400, 6000, t, musicG, 'bandpass', 0.7, sd * 12);
    if (s16 === 0 || s16 === 8) tone(mtof(root + 19), sd * 3, 'sawtooth', 0.045, null, t, musicG, 0.6);
  }
  function bossStep(t, bar, s16, sd) {
    const root = BOSS_ROOTS[bar], I = intensity;
    // coração / tambor de guerra
    if (s16 === 0 || s16 === 10) drum(58, 0.62, t, musicG);
    if (s16 === 3 || s16 === 13) drum(72, 0.34, t, musicG);
    if (I > 0.35 && (s16 === 6 || s16 === 14)) drum(86, 0.3, t, musicG);
    if (s16 === 4 || s16 === 12) { noise(0.12, 0.2, 2200, 700, t, musicG, 'bandpass', 1.4); }
    if (s16 % 2 === 1 || I > 0.6) noise(0.03, 0.05 + I * 0.04, 8000, null, t, musicG, 'highpass');
    // baixo em colcheias com segunda menor (dissonância)
    if (s16 % 2 === 0) {
      const n = root - 12 + [0, 0, 1, 0, 0, 0, -1, 0][(s16 / 2) % 8];
      tone(mtof(n), sd * 1.9, 'sawtooth', 0.12 + I * 0.06, null, t, musicG);
    }
    // cordas de tensão: agrupamento de semitons com tremolo, mais agudo conforme a vida cai
    if (s16 === 0) {
      tremStrings(mtof(root + 24), sd * 15, 0.045 + I * 0.04, t, 7 + I * 4);
      tremStrings(mtof(root + 25), sd * 15, 0.03 + I * 0.04, t, 8 + I * 4);
      if (I > 0.5) tremStrings(mtof(root + 31), sd * 15, 0.03 + (I - 0.5) * 0.1, t, 9);
    }
    // ataque metálico no início do compasso e subida (riser) a cada 4 compassos
    if (s16 === 0 && bar === 0) { noise(sd * 14, 0.14, 300, 5200, t, musicG, 'bandpass', 0.7, sd * 12); }
    if (s16 === 0 && I > 0.5) { bell(mtof(root + 36), 1.4, 0.05 + I * 0.04, t, musicG); }
    if (s16 === 8 && bar % 2 === 1) tone(mtof(root + 1 + 12), sd * 7, 'sawtooth', 0.04, mtof(root + 12), t, musicG, 0.8);
  }

  /* uivo de lobo: glissando com vibrato e muito reverb */
  function howl(v = 0.4, dist = 1) {
    if (!ctx) return;
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), bp = ctx.createBiquadFilter(); o.type = 'triangle';
    const f = R(300, 380), dur = R(2.4, 3.4);
    o.frequency.setValueAtTime(f * 0.8, t); o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur * 0.35); o.frequency.setValueAtTime(f * 1.5, t + dur * 0.5); o.frequency.exponentialRampToValueAtTime(f * 1.05, t + dur);
    const vib = ctx.createOscillator(); vib.frequency.value = 5.2; const vg = ctx.createGain(); vg.gain.value = 9; vib.connect(vg); vg.connect(o.frequency); vib.start(t); vib.stop(t + dur + 0.1);
    bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.2;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v * 0.18 * dist, t + 0.5); g.gain.setValueAtTime(v * 0.18 * dist, t + dur * 0.6); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(bp); bp.connect(g); g.connect(sfxG); const s = ctx.createGain(); s.gain.value = 1.6; g.connect(s); s.connect(verb);
    o.start(t); o.stop(t + dur + 0.1);
    noise(dur * 0.9, v * 0.03 * dist, 2200, 1200, 0, null, 'bandpass', 2);
  }
  function growl(v = 0.3) {
    if (!ctx) return;
    const t = ctx.currentTime, dur = R(0.45, 0.7), o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.setValueAtTime(R(62, 80), t); o.frequency.linearRampToValueAtTime(52, t + dur);
    lp.type = 'lowpass'; lp.frequency.value = 520; const am = ctx.createOscillator(); am.frequency.value = R(24, 32); const ag = ctx.createGain(); ag.gain.value = 0.45; am.connect(ag); const tr = ctx.createGain(); tr.gain.value = 0.55; ag.connect(tr.gain);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.08); g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(tr); tr.connect(g); g.connect(sfxG); o.start(t); am.start(t); o.stop(t + dur + 0.05); am.stop(t + dur + 0.05);
    noise(dur, v * 0.45, 700, 380, 0, null, 'bandpass', 1.5, 0.06);
  }
  /* impacto em armadura: baque surdo + estalo seco + dois ressoos curtos (nada de sino) */
  const armor = (v = 0.24, when = 0) => {
    tone(R(105, 140), 0.1, 'sine', v * 1.3, 50, when);
    noise(0.045, v * 1.2, R(2800, 3600), R(1400, 1900), when, null, 'bandpass', 2.2, 0.001);
    noise(0.12, v * 0.5, 700, 260, when, null, 'lowpass', 0.8, 0.002);
    tone(R(880, 1000), 0.09, 'triangle', v * 0.32, R(820, 900), when);
    tone(R(1450, 1650), 0.06, 'triangle', v * 0.2, null, when + 0.004);
  };
  /* escudo / lâmina contra aço: um pouco mais vivo, mas ainda curto e abafado */
  const clang = (f = 520, v = 0.2, when = 0) => {
    tone(R(150, 190), 0.08, 'sine', v * 1.1, 70, when);
    noise(0.05, v * 1.1, R(3000, 4200), R(1800, 2600), when, null, 'bandpass', 2.5, 0.001);
    [[1, 0.6, 0.16], [2.35, 0.4, 0.1], [3.9, 0.22, 0.06]].forEach(([r, a, d]) => tone(f * r * R(0.985, 1.015), d, 'triangle', v * a * 0.5, null, when));
    noise(0.1, v * 0.35, 900, 300, when, null, 'lowpass', 0.8, 0.002);
  };

  /* ---------- efeitos ---------- */
  function sfx(name, variant) {
    if (!ctx) return;
    switch (name) {
      case 'slash':
        noise(0.17, 0.3, 700, 3600, 0, null, 'bandpass', 1.1, 0.05); noise(0.14, 0.14, 2600, 900, 0.04, null, 'bandpass', 0.8, 0.03); noise(0.1, 0.1, 300, 150, 0, null, 'lowpass', 0.7, 0.02); break;
      case 'hit':
        if (variant === 'metal') armor(0.26);
        else if (variant === 'wolf') { tone(150, 0.12, 'sine', 0.34, 48); noise(0.09, 0.22, 1400, 400, 0, null, 'lowpass'); voice(R(420, 520), 0.22, 0.2, [900, 1700], 0.55); }
        else { tone(140, 0.14, 'sine', 0.36, 45); noise(0.1, 0.26, 1600, 350, 0, null, 'lowpass'); noise(0.03, 0.18, 3800, 2000, 0, null, 'highpass'); }
        break;
      case 'hurt':
        voice(R(190, 230), 0.34, 0.34, [620, 1050], 0.6); tone(120, 0.14, 'sine', 0.3, 48); noise(0.12, 0.2, 1300, 300, 0, null, 'lowpass'); break;
      case 'jump':
        noise(0.1, 0.07, 1400, 2400, 0, null, 'bandpass', 0.6, 0.03); voice(R(230, 260), 0.1, 0.07, [700, 1300], 1.25); break;
      case 'land':
        tone(95, 0.11, 'sine', 0.22, 40); noise(0.12, 0.16, 900, 250, 0, null, 'lowpass'); noise(0.07, 0.05, 3000, 1500, 0.01, null, 'highpass'); break;
      case 'step':
        noise(0.07, R(0.035, 0.055), R(1500, 2300), R(700, 1100), 0, null, 'bandpass', 0.9, 0.006); tone(R(70, 90), 0.05, 'sine', 0.05, 45); break;
      case 'dodge':
        noise(0.22, 0.2, 500, 2800, 0, null, 'bandpass', 0.7, 0.06); noise(0.1, 0.06, 3000, 5000, 0, null, 'highpass', 0.7, 0.02); break;
      case 'power':
        tone(110, 0.5, 'sawtooth', 0.2, 600); noise(0.4, 0.22, 500, 3200, 0, null, 'bandpass', 0.8, 0.12); growl(0.25); tone(55, 0.5, 'sine', 0.3, 30); break;
      case 'pickup':
        bell(1320, 0.7, 0.12, 0, sfxG); bell(1980, 0.8, 0.09, 0.07, sfxG); break;
      case 'save':
        [392, 494, 587, 784].forEach((f, i) => bell(f, 1.6, 0.13, i * 0.11, sfxG)); break;
      case 'death':
        voice(180, 0.9, 0.35, [550, 900], 0.35); tone(60, 1.2, 'sine', 0.4, 28); noise(1.0, 0.18, 800, 120, 0, null, 'lowpass', 0.7, 0.05); break;
      case 'menu': tone(620, 0.05, 'triangle', 0.09); noise(0.03, 0.04, 4000, null, 0, null, 'highpass'); break;
      case 'ok': bell(880, 0.5, 0.1, 0, sfxG); bell(1320, 0.6, 0.08, 0.06, sfxG); break;
      case 'boss':
        tone(48, 2.4, 'sine', 0.55, 26); noise(1.0, 0.3, 120, 3400, 0, null, 'bandpass', 0.6, 0.9); noise(1.8, 0.4, 900, 90, 1.0, null, 'lowpass', 0.7, 0.01);
        tone(mtof(38 + 12), 2.2, 'sawtooth', 0.14, null, 0.9); tone(mtof(39 + 12), 2.2, 'sawtooth', 0.1, null, 0.9); armor(0.4, 1.0); break;
      case 'bolt': // besta/flecha: estalo da corda + sibilo
        tone(210, 0.1, 'triangle', 0.3, 90); noise(0.03, 0.3, 3500, 1800, 0, null, 'highpass'); noise(0.25, 0.1, 4500, 1500, 0.02, null, 'bandpass', 2, 0.03); break;
      case 'level': [523, 659, 784, 1047].forEach((f, i) => bell(f, 1.4, 0.14, i * 0.1, sfxG)); break;
      case 'explode':
        tone(70, 0.5, 'sine', 0.55, 24); noise(0.9, 0.45, 1600, 90, 0, null, 'lowpass', 0.6, 0.004); noise(0.5, 0.2, 5000, 800, 0.02, null, 'bandpass', 0.8); break;
      case 'growl': growl(0.3); break;
      case 'snarl': growl(0.38); voice(R(300, 380), 0.2, 0.12, [800, 1500], 0.6); break;
      case 'howl': howl(0.6, 1); break;
      case 'clang': clang(R(520, 680), 0.24); break;
      case 'fury': // ativação da Fúria: rugido grave, estrondo e subida
        growl(0.6); voice(110, 0.9, 0.35, [500, 900], 0.5); tone(52, 1.0, 'sine', 0.55, 28); tone(70, 0.5, 'sine', 0.5, 24, 0.05);
        noise(0.9, 0.34, 300, 4200, 0, null, 'bandpass', 0.7, 0.5); noise(0.6, 0.3, 1800, 90, 0.35, null, 'lowpass', 0.7, 0.004); break;
      case 'feral': // transformação total em animal
        howl(0.9, 1); growl(0.7); voice(95, 1.2, 0.4, [450, 800], 0.4, 0.1); tone(44, 1.6, 'sine', 0.6, 24); noise(1.2, 0.4, 200, 5000, 0, null, 'bandpass', 0.6, 0.6); noise(0.8, 0.4, 1200, 80, 0.5, null, 'lowpass', 0.7, 0.004); break;
      case 'talk': { // sílaba falada, uma por poucas letras do diálogo
        const tk = {natalie: [R(300, 340), [820, 2100], 0.1], hero: [R(165, 190), [600, 1250], 0.11], boss: [R(78, 92), [450, 900], 0.15], lobo: [R(95, 120), [500, 1100], 0.14], nota: [R(210, 230), [700, 1500], 0.05]}[variant] || [R(190, 220), [650, 1200], 0.1];
        voice(tk[0], 0.07 + Math.random() * 0.04, tk[2], tk[1], R(0.85, 1.15)); break;
      }
      case 'page': noise(0.18, 0.1, 2500, 900, 0, null, 'bandpass', 0.8, 0.04); noise(0.1, 0.06, 4500, 2000, 0.05, null, 'highpass'); break;
    }
  }
  return {init, setMode, sfx, setVol, setIntensity, get mode() { return mode; }};
})();
