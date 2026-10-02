'use strict';
/* ===== Menus (HTML sobre o canvas): título, opções, pausa, fogueira, talentos, ferreiro ===== */
const UI = (() => {
  const root = () => document.getElementById('ui');
  let pmTab = 'ficha', pending = null, skip = false, tab = 'armas', pick = null, back = null, msg = '', slotMode = 'new', fromCamp = false;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

  function show(html, backAction, cls) {
    const r = root(); r.innerHTML = `<div class="panel">${html}</div>`; r.className = cls || ''; r.style.display = 'flex'; back = backAction || null;
    skip = true; Input.clear();
    const first = r.querySelector('button:not(:disabled)'); if (first) first.classList.add('focus');
  }
  function close() { const r = root(); r.style.display = 'none'; r.innerHTML = ''; back = null; Input.clear(); }
  const visible = () => root().style.display === 'flex';
  const btn = (label, a, p = '', cls = '', dis = false) => `<button class="${cls}" data-a="${a}" data-p="${esc(p)}" ${dis ? 'disabled' : ''}>${label}</button>`;

  /* ---- navegação por teclado / gamepad ---- */
  function buttons() { return [...root().querySelectorAll('button:not(:disabled), input[type=range]')]; }
  function focusIdx(i) {
    const b = buttons(); if (!b.length) return;
    b.forEach(x => x.classList.remove('focus'));
    setTimeout(() => root().querySelectorAll('.cls').forEach(x => x.classList.toggle('on', !!x.querySelector('button.focus'))), 0);
    i = (i + b.length) % b.length; b[i].classList.add('focus'); b[i].scrollIntoView({block: 'nearest', inline: 'center'});
    if (b[i].tagName === 'INPUT') b[i].focus(); else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function pollNav() {
    if (!visible()) return;
    if (skip) { skip = false; return; }
    const Pr = Input.pressed, b = buttons(), cur = b.findIndex(x => x.classList.contains('focus'));
    const tabs = [...root().querySelectorAll('.pmtabs button')];
    if (tabs.length && (Pr.berserk || Pr.dodge || Pr.heal || Pr.rimora)) {   // LT/RT (L1/R1) trocam de aba
      const at = tabs.findIndex(x => x.classList.contains('sel')), n = (at + ((Pr.berserk || Pr.heal) ? -1 : 1) + tabs.length) % tabs.length;
      Snd.sfx('menu'); tabs[n].click(); return;
    }
    if (root().querySelector('.classes') && (Pr.left || Pr.right) && cur >= 0) { Snd.sfx('menu'); focusIdx(cur + (Pr.right ? 1 : -1)); return; }
    if (cur >= 0 && cur < 25 && b[cur].classList.contains('tnode') && (Pr.left || Pr.right || Pr.up || Pr.down)) {   // anda pela árvore: cima/baixo = nível, esquerda/direita = galho
      const bi = Math.floor(cur / 5), k = cur % 5; let n = cur;
      if (Pr.up && k < 4) n = cur + 1; else if (Pr.down && k > 0) n = cur - 1; else if (Pr.down && k === 0) n = 25;
      else if (Pr.left && bi > 0) n = cur - 5; else if (Pr.right && bi < 4) n = cur + 5;
      if (n !== cur) { Snd.sfx('menu'); focusIdx(n); const f = buttons()[n]; if (f && f.classList.contains('tnode')) f.click(); } return;
    }
    const typing = document.activeElement && document.activeElement.type === 'text';
    if (Pr.down && !typing) { focusIdx(cur + 1); Snd.sfx('menu'); }
    else if (Pr.up && !typing) { focusIdx(cur - 1); Snd.sfx('menu'); }
    else if ((Pr.left || Pr.right) && cur >= 0 && b[cur].type === 'range' && !typing) {
      b[cur].value = Math.max(0, Math.min(100, +b[cur].value + (Pr.right ? 10 : -10))); b[cur].dispatchEvent(new Event('input'));
    } else if (Pr.confirm && cur >= 0) {
      if (b[cur].tagName === 'BUTTON') b[cur].click();
    } else if (Pr.confirm && typing) { const d = root().querySelector('[data-default]'); if (d) d.click(); }
    else if (Pr.back && back) { Snd.sfx('menu'); act(back, ''); }
  }

  /* ---- ações ---- */
  function act(a, p) {
    Snd.init(); if (a !== 'vol') Snd.sfx('menu');
    switch (a) {
      case 'title': title(); break;
      case 'slots': slots(p); break;
      case 'newslot': nameEntry(+p); break;
      case 'startnew': {
        const nm = (document.getElementById('nm').value || '').trim() || 'Sobrevivente';
        pending = {slot: +p, nome: nm.slice(0, 16)}; classPick(); break;
      }
      case 'pickclass': {
        P = newPlayer(pending.nome, p); P.slot = pending.slot;
        close(); startCine(STORY_SLIDES, () => { beginWorld(false); G.fade = 1; setBanner('Capítulo 1 · Vila Destruída'); Snd.setMode('explore'); openingScene(); });
        break;
      }
      case 'load': {
        const sv = loadSave(+p); if (!sv) return;
        P = Object.assign(newPlayer(sv.p.nome, sv.p.classe || 'cacador'), sv.p); P.slot = +p; if (!P.classe) P.classe = 'cacador';
        P.flags = Object.assign({canis: false, baus: {}, bossMorto: false, natalie: false, mortes: 0, seen: {}, lidas: {}}, sv.p.flags);
        P.itens = Object.assign(newPlayer('x').itens, sv.p.itens); P.receitas = sv.p.receitas || {}; P.elixirT = 0;
        close(); beginWorld(true); setBanner(L.rooms[0].nome); Snd.setMode('explore'); break;
      }
      case 'del': deleteSave(+p); slots(slotMode); break;
      case 'options': options(); break;
      case 'vol': break;
      case 'shake': CFG.shake = !CFG.shake; saveCfg(CFG); options(); break;
      case 'controls': controls(); break;
      case 'resume': close(); G.mode = 'play'; Input.clear(); break;
      case 'pause': pause(); break;
      case 'tutorial': close(); startTutorial(); break;
      case 'sheet': sheet(); break;
      case 'pm': pmTab = p; if (p === 'equip') eqSel = null; pauseMenu(); break;
      case 'eqsel': { const [k, i] = p.split(','); eqSel = {kind: k, i: +i}; pauseMenu(); setTimeout(() => { const b = root().querySelector('button.eqslot.sel'); if (b) { buttons().forEach(x => x.classList.remove('focus')); b.classList.add('focus'); } }, 0); break; }
      case 'peq': { const [k, i] = p.split(','); if (fromCamp) { if (k === 'W') P.arma = +i; else P.armadura = +i; refresh(); Snd.sfx('ok'); } pauseMenu(); break; }
      case 'quit': close(); G = null; L = null; P = null; Snd.setMode('menu'); title(); break;
      case 'closecamp': close(); G.mode = 'play'; Input.clear(); Snd.setMode(G.bossActive ? 'boss' : 'explore'); break;
      case 'camp': camp(); break;
      case 'rest': {
        if (G && L) { G.restFx = {camp: P.camp, t0: G.time}; treeLeavesSpawn(L.camps[P.camp].x, L.camps[P.camp].y, G.time, 36, true); }
        const antes = restAtCamp(P); pl.recursoUsado = false; pl.poison = null; respawnEnemies(); saveGame(P.slot, P); refresh();
        Snd.sfx('save'); msg = `Você descansou e o progresso foi salvo. Mutação limpa (${Math.round(antes)}% → ${Math.round(P.mut)}%). Marca atual: ${P.marca.toFixed(1)}%.`;
        camp(); break;
      }
      case 'talents': talents(); break;
      case 'tsel': tsel = p; talents(); break;
      case 'buy': {
        const t = TALENTS.find(x => x.id === p);
        if (t && !P.talentos[t.id] && P.pontos >= t.custo && (!t.req || P.talentos[t.req]) && !t.soon) { P.pontos -= t.custo; P.talentos[t.id] = true; refresh(); Snd.sfx('ok'); }
        talents(); break;
      }
      case 'resetT': {
        const c = 20 * P.nivel;
        if (P.coins >= c) { P.coins -= c; for (const t of TALENTS) if (P.talentos[t.id]) P.pontos += t.custo; P.talentos = {}; refresh(); msg = 'Pontos devolvidos.'; } else msg = 'Moedas insuficientes.';
        talents(); break;
      }
      case 'forge': forge(); break;
      case 'tab': tab = p; pick = null; forge(); break;
      case 'equipW': P.armas.length > +p && (P.arma = +p); refresh(); forge(); break;
      case 'equipA': P.armadura = +p; refresh(); forge(); break;
      case 'upW': case 'upA': {
        const item = a === 'upW' ? P.armas[+p.split(',')[0]] : P.armaduras[+p.split(',')[0]], ramo = p.split(',')[1];
        const c = rankUpCost(item.rank); if (!c || !canPay(P, c)) break;
        if (item.rank === 2 && !P.flags.forjaFerrao) { msg = 'O Damasco exige o Martelo do Ferrão.'; forge(); break; }
        pay(P, c); item.rank++;
        if (a === 'upW' && item.rank === 1 && ramo !== undefined && ramo !== '') item.ramo = +ramo;
        if (a === 'upW') while (item.runas.length > RANK_SLOTS[item.rank]) P.runas.push(item.runas.pop());
        refresh(); Snd.sfx('level'); msg = 'Evoluído!'; forge(); break;
      }
      case 'branchW': pick = {kind: 'branch', i: +p}; forge(); break;
      case 'pickRune': pick = {kind: p.split(',')[0], i: +p.split(',')[1]}; forge(); break;
      case 'engrave': {
        const [kind, i, ri] = p.split(','); const r = P.runas[+ri]; if (!r) break;
        if (kind === 'W') { const w = P.armas[+i]; if (w.runas.length < RANK_SLOTS[w.rank]) { w.runas.push(r); P.runas.splice(+ri, 1); } }
        else { const ar = P.armaduras[+i]; if (!ar.runa) { ar.runa = r; P.runas.splice(+ri, 1); } }
        pick = null; refresh(); Snd.sfx('ok'); forge(); break;
      }
      case 'unengraveW': { const [i, k] = p.split(',').map(Number); const w = P.armas[i]; P.runas.push(w.runas.splice(k, 1)[0]); refresh(); forge(); break; }
      case 'unengraveA': { const ar = P.armaduras[+p]; if (ar.runa) { P.runas.push(ar.runa); ar.runa = null; } refresh(); forge(); break; }
      case 'fuse': { const [e, l] = p.split(','); if (fuseRunes(P, e, +l)) { Snd.sfx('level'); msg = 'Runas fundidas!'; } forge(); break; }
      case 'craft': if (P.itens.erva >= 3) { P.itens.erva -= 3; P.itens.raiz++; Snd.sfx('pickup'); msg = '+1 Raiz de Cura'; } items(); break;
      case 'items': items(); break;
      case 'bancada': bancada(); break;
      case 'fab': { const r = RECEITAS.find(x => x.id === p); const res = r && fabricar(P, r, S); if (res) { Snd.sfx('save'); msg = 'Fabricado: ' + res; refresh(); } else msg = 'Faltam materiais.'; bancada(); break; }
      case 'elixir': if (P.itens.elixir > 0) { P.itens.elixir--; P.elixirT = 300; refresh(); Snd.sfx('level'); msg = 'Sorte +50% por 5 minutos.'; } if (root().querySelector('.pmtabs')) pauseMenu(); else items(); break;
      case 'desm': { const [k, i] = p.split(','); const r = desmontar(P, k, +i); msg = r.msg; if (r.ok) Snd.sfx('pickup'); refresh(); forge(); break; }
      case 'fusepick': { const [k, i] = p.split(','); pick = {kind: 'fuse', k, i: +i}; msg = 'Escolha o segundo item igual para fundir (ele será consumido).'; forge(); break; }
      case 'fusecancel': pick = null; forge(); break;
      case 'fusedo': { const [k, i, j] = p.split(','); const r = fundir(P, k, +i, +j); msg = r.msg; if (r.ok) Snd.sfx(r.ganhou ? 'power' : 'level'); pick = null; refresh(); forge(); break; }
      case 'bazar': bazar(); break;
      case 'bzTab': bzTab = p; bazar(); break;
      case 'bzEsp': bzEsp = !bzEsp; bazar(); break;
      case 'bazarSair': close(); G.mode = 'play'; Input.clear(); break;
      case 'bz': {
        const [k, id, n] = p.split(',');
        if (k === 'W' || k === 'A') {
          const pool = k === 'W' ? ESP_ARMAS : ESP_ARMADURAS, esp = bzEsp && !(k === 'W' && WEAPONS[id].esp) ? pool[Math.floor(Math.random() * pool.length)] : null;
          msg = 'Recebido: ' + grantItem(P, {t: k === 'W' ? 'arma' : 'armadura', id, rank: +n, esp}) + (esp ? ' com ' + ESPECIAIS[esp].nome : '');
        } else if (k === 'R') msg = 'Recebido: ' + grantItem(P, {t: 'runa', elem: id, lvl: +n});
        else if (k === 'M') msg = 'Recebido: ' + grantItem(P, {t: 'mat', id, q: +n});
        else if (k === 'REC') { if (id === 'all') RECEITAS.forEach(r => P.receitas[r.id] = true); else P.receitas[id] = true; msg = 'Receita aprendida.'; }
        else if (k === 'X') {
          if (id === 'coins') P.coins += 1000; else if (id === 'pontos') P.pontos += 10; else if (id === 'nivel') { addXp(P, 300); }
          else if (id === 'canis') { P.flags.canis = true; } else if (id === 'forja') P.flags.forjaFerrao = true; else if (id === 'elixir') P.elixirT = 300;
          else if (id === 'curar') { P.mut = 0; P.marca = 0; refresh(); P.hp = hpMax(P, S); P.folego = folegoMax(P, S); }
          msg = 'Pronto.';
        }
        refresh(); Snd.sfx('pickup'); bazar(); break;
      }
      case 'continueEnd': close(); pl.x = L.exitX - 120; G.mode = 'play'; Input.clear(); break;
    }
  }
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#ui button'); if (!b || b.disabled) return;
    act(b.dataset.a, b.dataset.p);
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if (t && t.dataset && t.dataset.a === 'vol') {
      CFG[t.dataset.p] = +t.value / 100; saveCfg(CFG); Snd.setVol(CFG.music, CFG.sfx);
      if (t.dataset.p === 'sfx') Snd.sfx('hit');
    }
  });
  addEventListener('pointerdown', () => { Snd.init(); if (!G) Snd.setMode('menu'); }, {once: true});
  addEventListener('keydown', () => { Snd.init(); if (!G) Snd.setMode('menu'); }, {once: true});

  /* ---- telas ---- */
  function title() {
    msg = '';
    show(`<h1 class="logo">INVERNO SOMBRIO<small>CAPÍTULO I · VILA DESTRUÍDA</small></h1>
      <p class="tagline">O frio não perdoa. O poder cobra.</p>
      <div class="col">
        ${btn('Novo jogo', 'slots', 'new')}${btn('Continuar', 'slots', 'load')}
        ${btn('Co-op (em breve)', 'x', '', '', true)}
        ${btn('Opções', 'options')}${btn('Controles', 'controls')}
      </div>
      <p class="sub" style="margin-top:14px;text-align:center">Mouse, teclado (setas, Enter, Esc) ou gamepad.</p>
      <p class="credit">Baseado no RPG de Marcus Lioba</p>`, null, 'title-screen');
  }
  function slots(mode) {
    slotMode = mode;
    let h = `<h2>${mode === 'new' ? 'Novo jogo: escolha um espaço' : 'Continuar: escolha um espaço'}</h2><div class="col">`;
    for (let i = 1; i <= 3; i++) {
      const sv = loadSave(i);
      if (sv) {
        const p = sv.p, min = Math.floor((p.tempo || 0) / 60);
        h += `<div class="slot"><span><b>Espaço ${i}</b> · ${esc(p.nome)} · ${CLASSES[p.classe || 'cacador'].nome} Nv ${p.nivel} · ${min} min · ${p.flags && p.flags.bossMorto ? 'Cap. 1 concluído' : 'Cap. 1'}</span>
          <span>${mode === 'new' ? btn('Sobrescrever', 'newslot', i) : btn('Carregar', 'load', i)}${btn('Apagar', 'del', i)}</span></div>`;
      } else h += `<div class="slot"><span><b>Espaço ${i}</b> · vazio</span><span>${mode === 'new' ? btn('Novo', 'newslot', i) : btn('—', 'x', '', '', true)}</span></div>`;
    }
    h += `</div><div class="row">${btn('Voltar', 'title', '', '')}</div>`;
    show(h, 'title');
  }
  function nameEntry(slot) {
    show(`<h2>Nome do sobrevivente</h2><p class="sub">Ninguém conhece o seu nome ainda. Escolha como o mundo vai te chamar.</p>
      <div class="row"><input type="text" id="nm" maxlength="16" placeholder="Seu nome" autofocus></div>
      <div class="row">${btn('Começar', 'startnew', slot, 'primary')}${btn('Voltar', 'slots', 'new')}</div>`, 'slots');
    root().querySelector('button').setAttribute('data-default', '1');
    const i = document.getElementById('nm'); i.focus(); root().querySelector('button.focus') && root().querySelector('button.focus').classList.remove('focus');
  }
  let portraitRaf = 0;
  function startPortraits() {
    cancelAnimationFrame(portraitRaf);
    const t0 = performance.now();
    const tick = () => {
      const cvs = root().querySelectorAll('canvas.portrait');
      if (!cvs.length) return;
      const t = (performance.now() - t0) / 1000;
      cvs.forEach(c => drawPortrait(c.getContext('2d'), c.dataset.k, t, c.dataset.armor));
      portraitRaf = requestAnimationFrame(tick);
    };
    tick();
  }
  function classPick() {
    const cards = Object.keys(CLASSES).map(k => { const c = CLASSES[k], w = WEAPONS[c.arma];
      return `<div class="cls"><canvas class="portrait" data-k="${k}" width="144" height="144"></canvas><div class="clsh">${c.emoji} <b>${c.nome}</b></div><p class="small">${c.desc}</p>
        <ul>${c.bonus.map(b => '<li>' + b + '</li>').join('')}<li>Arma: ${w.nome}</li></ul><p class="small">${c.skillDesc}</p>
        ${btn('Escolher ' + c.nome, 'pickclass', k, 'primary')}</div>`; }).join('');
    show(`<h2>Escolha sua classe</h2><p class="sub">A classe muda o estilo de luta, o equipamento inicial e a habilidade de classe. Os talentos continuam livres.</p><div class="classes" id="classes">${cards}</div><div class="row">${btn('Voltar', 'slots', 'new')}</div>`, 'slots', 'class-select');
    const cl = document.getElementById('classes'); if (cl) cl.addEventListener('wheel', ev => { ev.preventDefault(); cl.scrollLeft += ev.deltaY + ev.deltaX; }, {passive: false});
    startPortraits();
  }
  function story(lines, cb, i = 0) {
    const last = i >= lines.length - 1;
    show(`<div class="story"><p>${esc(lines[i])}</p></div>
      <div class="row">${btn(last ? 'Começar' : 'Continuar', 'x', '', 'primary')}</div>`);
    const b = root().querySelector('button[data-a=x]'); b.onclick = ev => { ev.stopPropagation(); Snd.sfx('menu'); last ? cb() : story(lines, cb, i + 1); };
  }
  function options() {
    show(`<h2>Opções</h2>
      <div class="row"><label>Música</label><input type="range" min="0" max="100" value="${Math.round(CFG.music * 100)}" data-a="vol" data-p="music"></div>
      <div class="row"><label>Efeitos</label><input type="range" min="0" max="100" value="${Math.round(CFG.sfx * 100)}" data-a="vol" data-p="sfx"></div>
      <div class="row">${btn('Tremor de tela: ' + (CFG.shake ? 'ligado' : 'desligado'), 'shake')}</div>
      <div class="row">${btn('Voltar', G ? 'pause' : 'title')}</div>`, G ? 'pause' : 'title');
    const b0 = buttons()[0]; if (b0) b0.classList.add('focus');
  }
  function controls() {
    show(`<h2>Controles</h2><table>${CONTROLS.map(c => `<tr><td><b>${c[0]}</b></td><td>${c[1]}</td></tr>`).join('')}</table>
      <div class="row">${btn('Voltar', G ? 'pause' : 'title')}</div>`, G ? 'pause' : 'title');
  }
  /* ---- menu de pausa (ficha, equipamento, habilidades, itens, diário) ---- */
  function pause() { fromCamp = false; pmTab = 'ficha'; pauseMenu(); }
  function sheet() { pauseMenu(); }
  const pmTabs = [['ficha', '✠ Ficha'], ['equip', '⚔ Equipamento'], ['hab', '✦ Habilidades'], ['itens', '❖ Itens'], ['diario', '✎ Diário'], ['guia', '? Guia'], ['sistema', '⚙ Sistema']];
  const bar = (frac, col, txt) => `<div class="pbar"><i style="width:${Math.max(0, Math.min(1, frac)) * 100}%;background:${col}"></i><span>${txt}</span></div>`;
  const stat = (k, v, hint = '') => `<tr><td>${k}</td><td><b>${v}</b></td><td class="small">${hint}</td></tr>`;
  function pmFicha() {
    const C = CLASSES[P.classe], w = P.armas[P.arma], wd = WEAPONS[w.id];
    const mx = hpMax(P, S), base = Math.round(hpBase(P, S)), fm = folegoMax(P, S), st = mutStage(P);
    const dano = Math.round(wd.dano * S.armaDanoMult * (1 + S.danoPct / 100)), vel = Math.round((S.velAtq + S.armaVel) * 100);
    const red = Math.round(S.def / (100 + S.def) * 100);
    const stages = ['Humano', 'Marcas leves', 'Traços do animal', 'Mutação profunda'];
    return `<div class="cols2"><div>
      <h3>${C.emoji} ${esc(P.nome)} · ${C.nome} · Nível ${P.nivel}</h3>
      ${bar(P.hp / mx, '#c0392b', `Saúde ${Math.max(0, Math.round(P.hp))} / ${mx} (base ${base})`)}
      ${bar(P.folego / fm, '#2fc7b4', `Fôlego Tanataú ${Math.round(P.folego)} / ${fm}`)}
      ${bar(P.mut / 100, '#a05cff', `Mutação ${Math.round(P.mut)}% · ${stages[st]}`)}
      ${bar(P.xp / 100, '#f2cc60', `XP ${Math.floor(P.xp)} / 100 para o nível ${P.nivel + 1}`)}
      <p class="small">Marca permanente da mutação: <b>${P.marca.toFixed(1)}%</b> (reduz a Saúde máxima de forma definitiva, até 25%).</p>
      <p class="small">★ Pontos de talento: <b>${P.pontos}</b> (gaste na Árvore dos Antigos) · 🪙 Moedas: <b>${P.coins}</b></p></div>
      <div><h3>Atributos</h3><table>
        ${stat('Dano por golpe', dano, `${wd.nome}, com talentos`)}
        ${stat('Velocidade de ataque', (vel >= 0 ? '+' : '') + vel + '%')}
        ${stat('Velocidade de movimento', (S.velMove >= 0 ? '+' : '') + Math.round(S.velMove * 100) + '%', P.flags.canis ? 'Canis: +22% de corrida' : '')}
        ${stat('Defesa', Math.round(S.def), `reduz ${red}% do dano`)}
        ${stat('Recarga da esquiva', (0.45 * S.dodgeCdMult).toFixed(2) + ' s', 'Não gasta Fôlego')}
        ${stat('Cura de itens', '+' + S.curaPct + '%')}
        ${stat('Sorte nos drops', '+' + S.sorte + '%', P.elixirT > 0 ? 'Elixir ativo' : 'talentos, itens e elixir')}
        ${stat('Corte de Saúde pela mutação', Math.round((1 - S.mutCortePct / 100) * 100) + '%', 'menor é melhor')}
      </table></div></div>`;
  }
  /* habilidade especial do equipamento, em uma linha */
  const espHtml = item => { const e = espDe(item); return e ? `<div class="small esp">✦ <b>${e.nome}</b>: ${e.desc}</div>` : ''; };
  let eqSel = null;
  const eqSlot = (kind, i, icon, eqp, sel) => `<button class="eqslot ${eqp ? 'eqp' : ''} ${sel ? 'sel' : ''}" data-a="eqsel" data-p="${kind},${i}" title="">${icon}</button>`;
  function pmEquip() {
    const rn = r => `${ico('rune', r.elem, ELEMS[r.elem].emoji, 24)}${ELEMS[r.elem].gema} nv${r.lvl}`;
    if (!eqSel) eqSel = {kind: 'W', i: P.arma};
    const sel = eqSel, aw = P.armas[P.arma], aa = P.armaduras[P.armadura];
    const wSlot = (w, i) => eqSlot('W', i, ico('weapon', w.id, WEAPONS[w.id].emoji, 44), i === P.arma, sel.kind === 'W' && sel.i === i);
    const aSlot = (a, i) => eqSlot('A', i, ico('armor', a.id, ARMORS[a.id].emoji, 44), i === P.armadura, sel.kind === 'A' && sel.i === i);
    const rSlot = (r, i) => eqSlot('R', i, ico('rune', r.elem, ELEMS[r.elem].emoji, 44) + `<i class="lv">${r.lvl}</i>`, false, sel.kind === 'R' && sel.i === i);
    const empty = n => Array.from({length: n}, () => '<span class="eqslot empty"></span>').join('');
    // detalhe do item selecionado
    let det = '', eqBtn = '';
    if (sel.kind === 'W' && P.armas[sel.i]) {
      const w = P.armas[sel.i], wd = WEAPONS[w.id];
      det = `<b>${weaponName(w)}</b> ${sel.i === P.arma ? '<span class="tag">equipada</span>' : ''}
        <div class="small">Dano base ${Math.round(wd.dano * RANK_MULT[w.rank])} · alcance ${wd.alcance} · combo de ${wd.steps.length} golpes · slots de runa ${w.runas.length}/${RANK_SLOTS[w.rank]}</div>
        <div class="small">Runas: ${w.runas.length ? w.runas.map(rn).join(' · ') : 'nenhuma'}</div>
        ${espHtml(w)}
        ${w.ramo != null ? `<div class="small">Forma: ${wd.ramos[w.ramo].nome} (${wd.ramos[w.ramo].desc})</div>` : ''}`;
      if (fromCamp && sel.i !== P.arma) eqBtn = btn('Equipar arma', 'peq', 'W,' + sel.i, 'primary');
    } else if (sel.kind === 'A' && P.armaduras[sel.i]) {
      const a = P.armaduras[sel.i], ad = ARMORS[a.id];
      det = `<b>${ad.nome} (${RANKS[a.rank]})${fusTxt(a)}</b> ${sel.i === P.armadura ? '<span class="tag">equipada</span>' : ''}
        <div class="small">Defesa ${Math.round(ad.def * RANK_MULT[a.rank] * (1 + FUSAO.bonus * (a.fus || 0)))} · ${ad.desc}</div>
        ${espHtml(a)}
        <div class="small">Runa de defesa: ${a.runa ? rn(a.runa) + ' (resistência a ' + ELEMS[a.runa.elem].nome + ')' : 'nenhuma'}</div>`;
      if (fromCamp && sel.i !== P.armadura) eqBtn = btn('Vestir armadura', 'peq', 'A,' + sel.i, 'primary');
    } else if (sel.kind === 'R' && P.runas[sel.i]) {
      const r = P.runas[sel.i], e = ELEMS[r.elem];
      det = `<b>${e.gema} nível ${r.lvl}</b> <span class="tag">${e.nome}</span><div class="small">${e.efeito}</div><div class="small">Engaste e fusão de runas: no Ferreiro, nas fogueiras.</div>`;
    } else det = '<div class="small">Selecione um item.</div>';
    return `<div class="eqwrap">
      <div class="eqleft">
        <canvas class="portrait big" data-k="${P.classe}" data-armor="${aa.id}" width="144" height="144"></canvas>
        <div class="eqkey">
          <div><div class="small">Arma</div>${eqSlot('W', P.arma, ico('weapon', aw.id, WEAPONS[aw.id].emoji, 44), true, sel.kind === 'W' && sel.i === P.arma)}</div>
          <div><div class="small">Armadura</div>${eqSlot('A', P.armadura, ico('armor', aa.id, ARMORS[aa.id].emoji, 44), true, sel.kind === 'A' && sel.i === P.armadura)}</div>
        </div>
        <div class="small">Defesa ${Math.round(S.def)} · Dano ${Math.round(WEAPONS[aw.id].dano * S.armaDanoMult * (1 + S.danoPct / 100))}</div>
      </div>
      <div class="eqright">
        <h3>Armas</h3><div class="eqgrid">${P.armas.map(wSlot).join('')}${empty(Math.max(0, 6 - P.armas.length))}</div>
        <h3>Armaduras</h3><div class="eqgrid">${P.armaduras.map(aSlot).join('')}${empty(Math.max(0, 6 - P.armaduras.length))}</div>
        <h3>Runas soltas</h3><div class="eqgrid">${P.runas.map(rSlot).join('')}${empty(Math.max(0, 6 - P.runas.length))}</div>
        <div class="eqdetail">${det}${eqBtn ? `<div class="row">${eqBtn}</div>` : ''}
          ${fromCamp ? '' : '<div class="small">Trocar equipamento só é possível nas Árvores dos Antigos.</div>'}</div>
      </div></div>`;
  }
  function pmHab() {
    const C = CLASSES[P.classe], cost = Math.round(25 * (1 - S.poderCustoPct / 100));
    const lock = '<span class="tag" style="background:#6b2fa6">bloqueado</span>';
    let h = `<h3>Poderes</h3><div class="card"><b>🐺 Garra Lupina (Canis)</b> ${P.flags.canis ? '' : lock}
      <div class="small">Tecla K / botão direito. Custa ${cost} Fôlego e enche a mutação. Investida que causa 2,1× de dano e cura ${Math.round(S.canisCura)} de Saúde por inimigo atingido.</div></div>
      <div class="card"><b>${C.emoji} ${C.skill}</b> <span class="tag">${C.nome}</span><div class="small">Tecla F. ${C.skillDesc}</div></div>
      <div class="card"><b>🧗 Salto na parede e corrida</b> ${P.flags.canis ? '' : lock}<div class="small">Poder de exploração do Canis: livre, não gera mutação.</div></div>
      <h3>Talentos aprendidos</h3>`;
    const own = TALENTS.filter(t => P.talentos[t.id]);
    h += own.length ? own.map(t => `<div class="card"><b>${t.nome}</b> <span class="tag">${TALENT_BRANCHES[t.ramo]}</span><div class="small">${t.desc}</div></div>`).join('') : '<p class="small">Nenhum ainda.</p>';
    const nxt = TALENTS.filter(t => !P.talentos[t.id] && !t.soon && (!t.req || P.talentos[t.req]));
    h += `<h3>Próximos disponíveis</h3><p class="small">${nxt.length ? nxt.map(t => `${t.nome} (${t.custo}★)`).join(' · ') : 'Nenhum.'}</p>`;
    return h;
  }
  /* tabela de materiais e poções (todas as de MAT_ORDER) */
  function matTable() {
    const usos = {raiz: `Q: cura ${Math.round(40 * (1 + S.curaPct / 100))} de Saúde`, rimora: 'R: restaura 60 de Fôlego'};
    return `<table>${MAT_ORDER.map(m => { const inf = MAT_INFO[m]; return `<tr><td>${ico('item', m, inf.emoji + ' ', 28)}${MAT_NAMES[m]}</td><td><b>${P.itens[m] || 0}</b></td><td class="small">${usos[m] || inf.desc}</td></tr>`; }).join('')}</table>`;
  }
  const elixirBtn = () => P.itens.elixir > 0 ? `<div class="row">${btn(P.elixirT > 0 ? 'Elixir ativo: renovar por 5 min' : 'Usar Elixir da Sorte (+50% de sorte, 5 min)', 'elixir')}</div>` : '';
  function pmItens() {
    return `${matTable()}${elixirBtn()}
      ${P.sombra ? `<p class="small">⚠️ Sua sombra guarda ${P.sombra.coins} 🪙 e ${P.sombra.xp} XP no local da última queda.</p>` : ''}
      <p class="small">Fabricar e desmontar: na Bancada e no Ferreiro, nas Árvores dos Antigos.</p>`;
  }
  function pmDiario() {
    const f = P.flags, ok = v => v ? '✔' : '◻';
    const visited = L ? L.rooms.map((r, i) => `${G.visited[i] ? '✔ ' + r.nome : '◻ ???'}`).join('<br>') : '';
    const baus = Object.keys(f.baus || {}).length, totalBaus = L ? L.chests.length : 0;
    const lem = MEMORIAS_C1.map(m => f.lidas && f.lidas[m.id] ? `✔ <b>${esc(m.nome)}</b>: ${esc(m.resumo)}` : '◻ ???').join('<br>');
    return `<h3>Capítulo 1 · Vila Destruída</h3><div class="card"><div class="small">
      ${ok(f.natalie)} Falar com Natalie, junto à Árvore dos Antigos da vila<br>${ok(f.canis)} Despertar o Canis no Altar do Lobo (Mercado)<br>
      ${ok(f.bossMorto)} Derrotar o Caçador do Extermínio na Arena<br>${ok(f.bossMorto)} Seguir a leste, rumo à fortaleza do Império</div></div>
      <h3>Lembranças (${memCount()} / ${MEMORIAS_C1.length})</h3><div class="card"><div class="small">${lem}</div></div>
      <div class="cols2"><div><h3>Áreas</h3><p class="small">${visited}</p></div>
      <div><h3>Estatísticas</h3><table>${stat('Tempo de jogo', Math.floor(P.tempo / 60) + ' min')}${stat('Quedas', f.mortes)}${stat('Baús abertos', baus + ' / ' + totalBaus)}${stat('Marca da mutação', P.marca.toFixed(1) + '%')}</table></div></div>`;
  }
  function pmGuia() {
    const sec = (t, body) => `<div class="card"><h3>${t}</h3><div class="small guia">${body}</div></div>`;
    return `<div class="row">${btn('▶ Rever o tutorial guiado', 'tutorial', '', 'primary')}</div>
      ${sec('Barras', '<b style="color:#ff7a6a">Vida</b>: chega a zero e você cai (perde moedas e XP no local). A parte roxa é Saúde máxima cortada pela mutação; a escura é a Marca permanente.<br><b style="color:#2fc7b4">Fôlego Tanataú</b>: só as habilidades gastam (poder do Tanataú, habilidade da classe e ativar a Fúria). A esquiva é grátis. Volta sozinho.<br><b style="color:#b98aff">Mutação</b>: sobe a cada poder de Tanataú e corta a Vida máxima. Limpe na Árvore dos Antigos.<br><b style="color:#f2cc60">XP</b>: cada nível dá 2 pontos de talento.')}
      ${sec('Combate', 'Combo de 3 golpes. Segure W/S para atacar para cima/baixo (no ar, para baixo). A esquiva dá invulnerabilidade breve e não gasta Fôlego (só tem recarga). Inimigos têm postura: golpes seguidos os atordoam, mas eles resistem a ficar atordoados sem parar. Cada inimigo tem fraquezas: o fogo, por exemplo, machuca mais os lobos.')}
      ${sec('Poderes de Tanataú', KEY('power') + ' usa o poder do Tanataú desperto (Canis: Garra Lupina e salto na parede). ' + KEY('skill') + ' usa a habilidade da sua classe: Bárbaro, golpe brutal; Caçador, investida veloz; Guardião, escudo de guerra; Cacique, névoa que enfraquece e atrasa os inimigos. Poderes enchem a mutação, então use quando valer a pena.')}
      ${sec('Fúria bestial', 'Depois de despertar o Canis, ' + KEY('berserk') + ' liga a Fúria: dano, velocidade de ataque e de movimento e defesa sobem 50%, e a Vida é consumida sem parar. Aperte de novo para encerrar. A Vida cai rápido (cerca de 12 segundos do máximo). Quando chega a zero, você vira 100% animal (lobo): a Vida fica em zero e uma barra fina de instinto, dentro dela, mostra a resistência da fera (cada golpe recebido gasta o instinto e sobe a mutação; se acabar, você cai). Na forma animal você não usa itens nem habilidades, mas continua forte, e só volta ao normal ao tocar uma Árvore dos Antigos. Ativar custa 25 de Fôlego e sobe a mutação.')}
      ${sec('Árvore dos Antigos', 'Aperte E perto dela para descansar: salva o jogo, cura, limpa a mutação (deixa uma Marca) e os inimigos reaparecem. Ali você também gasta talentos, usa o ferreiro (evoluir armas, engastar runas) e troca equipamento.')}
      ${sec('Itens e runas', 'Q: Raiz de Cura (Vida). R: Rímora (Fôlego). Ervas fazem poções (talento Fazer Poções). Ferro e aço evoluem armas e armaduras. Runas dão elementos (fogo, veneno...) e se engastam no ferreiro.')}
      ${sec('Explorar', 'Chamas azuis são lembranças (E). Cartazes, diários e estátuas contam a história. Baús têm itens, e algumas paredes rachadas escondem segredos. O Diário mostra o seu progresso.')}
      <h3>Controles</h3><div class="card"><table>${CONTROLS.map(c => `<tr><td><b>${c[0]}</b></td><td>${c[1]}</td></tr>`).join('')}</table></div>`;
  }
  function pmSistema() {
    return `<div class="col">${btn('Opções (som, tremor)', 'options')}${btn('Controles', 'controls')}${btn('Sair para o menu', 'quit')}</div>`;
  }
  function pauseMenu() {
    refresh();
    const body = {ficha: pmFicha, equip: pmEquip, hab: pmHab, itens: pmItens, diario: pmDiario, guia: pmGuia, sistema: pmSistema}[pmTab]();
    const bk = fromCamp ? 'camp' : 'resume';
    const hadPortrait = pmTab === 'equip';
    show(`<div class="row pmtabs">${pmTabs.map(t => btn(t[1], 'pm', t[0], pmTab === t[0] ? 'sel' : '')).join('')}</div>
      ${Input.device === 'pad' ? `<div class="small padhint">${KEY('berserk')} / ${KEY('dodge')}: trocar de aba</div>` : ''}
      <div class="pmbody">${body}</div>
      <div class="row">${btn(fromCamp ? 'Voltar à árvore' : 'Continuar', bk, '', 'primary')}</div>`, bk);
    if (hadPortrait) startPortraits();
    const st = root().querySelector('.pmtabs button.sel'); if (st) { buttons().forEach(x => x.classList.remove('focus')); st.classList.add('focus'); }
  }
  function camp() {
    refresh(); fromCamp = true;
    show(`<h2>🌳 Árvore dos Antigos</h2>
      <p class="sub">${msg || 'Aqui você descansa, salva e se prepara.'}</p>
      <p>Mutação <b>${Math.round(P.mut)}%</b> · Marca <b>${P.marca.toFixed(1)}%</b> · Saúde ${Math.round(P.hp)}/${hpMax(P, S)}</p>
      <div class="col">
        ${btn('Descansar e salvar', 'rest', '', 'primary')}
        ${btn('Talentos' + (P.pontos ? ` (★ ${P.pontos})` : ''), 'talents')}
        ${btn('Bancada (fabricar)', 'bancada')}
        ${btn('Ferreiro, fusão e runas', 'forge')}
        ${btn('Itens', 'items')}
        ${btn('Ficha', 'sheet')}
        ${btn('Voltar à aventura', 'closecamp')}
      </div>`, 'closecamp');
    Snd.setMode('camp'); msg = '';
  }
  /* árvore de talentos: a Árvore dos Antigos na base, cinco galhos em leque, um nó por talento */
  let tsel = null;
  const TCOL = {guerreiro: '#e8803a', cacador: '#8ad04a', guardiao: '#6fa8ff', natureza: '#4fe0a8', tanatau: '#c98aff'};
  const TGLY = {guerreiro: '⚔', cacador: '✦', guardiao: '⛨', natureza: '❦', tanatau: '☾'};
  function treePos(bi, k) {   // posição (em unidades 1000x430) do nó k do galho bi
    const th = (-52 + bi * 26) * Math.PI / 180, r = 100 + k * 54;
    return [500 + r * Math.sin(th) * 1.4, 366 - r * Math.cos(th)];
  }
  function talents() {
    const brs = Object.keys(TALENT_BRANCHES);
    if (!tsel || !TALENTS.find(t => t.id === tsel)) tsel = (TALENTS.find(t => !P.talentos[t.id] && (!t.req || P.talentos[t.req]) && !t.soon) || TALENTS[0]).id;
    const state = t => P.talentos[t.id] ? 'own' : t.soon ? 'soon' : (!t.req || P.talentos[t.req]) ? (P.pontos >= t.custo ? 'can' : 'avail') : 'locked';
    let svg = '', nodes = '', labels = '';
    brs.forEach((br, bi) => {
      const col = TCOL[br], ts = TALENTS.filter(x => x.ramo === br);
      let prev = [500, 374], prevOwn = true;
      ts.forEach((t, k) => {
        const [x, y] = treePos(bi, k), st = state(t), lit = st === 'own';
        const w = lit ? 7 : st === 'locked' || st === 'soon' ? 3 : 4.5, c = lit ? col : st === 'can' || st === 'avail' ? col + '88' : '#3a3f4b';
        svg += `<line x1="${prev[0]}" y1="${prev[1]}" x2="${x}" y2="${y}" stroke="#000" stroke-width="${w + 4}" stroke-linecap="round"/><line x1="${prev[0]}" y1="${prev[1]}" x2="${x}" y2="${y}" stroke="${c}" stroke-width="${w}" stroke-linecap="round" ${lit ? `filter="url(#glow)"` : ''}/>`;
        nodes += `<button class="tnode ${st} ${tsel === t.id ? 'cur' : ''}" style="--c:${col};left:${x / 10}%;top:${y / 3.8}%" data-a="tsel" data-p="${t.id}" title="${esc(t.nome)}">${st === 'own' ? TGLY[br] : t.custo}</button>`;
        prev = [x, y];
      });
      const [lx, ly] = treePos(bi, 4);
      labels += `<div class="tlabel" style="color:${col};left:${lx / 10}%;top:${ly / 3.8}%">${TGLY[br]} ${TALENT_BRANCHES[br]}</div>`;
    });
    const t = TALENTS.find(x => x.id === tsel), st = state(t), col = TCOL[t.ramo];
    const req = t.req ? TALENTS.find(x => x.id === t.req) : null;
    const stTxt = {own: '✔ Aprendido', can: 'Disponível', avail: `Faltam pontos (custo ${t.custo})`, locked: `Bloqueado: aprenda antes «${req ? req.nome : ''}»`, soon: 'Em breve (chega em outro capítulo)'}[st];
    const h = `<h2>Árvore de Talentos <span class="sub">★ ${P.pontos} ponto(s) · cada nível dá 2</span></h2><p class="sub tmsg">${msg || 'Cada galho nasce da Árvore dos Antigos. Aprenda de baixo para cima.'}</p>
      <div class="ttree"><div class="troot"></div><svg viewBox="0 0 1000 380" preserveAspectRatio="none"><defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${svg}</svg>${labels}${nodes}</div>
      <div class="tdetail" style="--c:${col}"><div><b class="tn">${esc(t.nome)}</b> <span class="tag">${TALENT_BRANCHES[t.ramo]}</span> <span class="tag">custo ${t.custo}</span></div>
        <div class="td">${esc(t.desc)}</div><div class="small ts ${st}">${stTxt}</div></div>
      <div class="row">${btn(st === 'own' ? '✔ Aprendido' : `Aprender (${t.custo})`, 'buy', t.id, 'primary', st !== 'can')}${btn(`Redistribuir (${20 * P.nivel} moedas)`, 'resetT')}${btn('Voltar', 'camp')}</div>`;
    msg = ''; show(h, 'camp');
    const cur = root().querySelector('button.tnode.cur'); if (cur) { buttons().forEach(x => x.classList.remove('focus')); cur.classList.add('focus'); }
  }
  function runeTag(r) { return `${ico('rune', r.elem, ELEMS[r.elem].emoji)}${ELEMS[r.elem].gema} nv${r.lvl}`; }
  /* botões de desmontar e fundir de um equipamento (kind 'W' ou 'A') */
  function fusDesmBtns(kind, i, item) {
    const lista = kind === 'W' ? P.armas : P.armaduras, atual = kind === 'W' ? P.arma : P.armadura;
    let h = '';
    if (pick && pick.kind === 'fuse' && pick.k === kind) {
      if (pick.i === i) h += btn('✖ Cancelar fusão', 'fusecancel');
      else if (podeFundir(P, kind, pick.i, i)) h += btn('Fundir com o escolhido', 'fusedo', `${kind},${pick.i},${i}`, 'primary');
      return h;
    }
    const temPar = lista.some((o, j) => j !== i && o.id === item.id && ((item.fus || 0) < FUSAO.max) && ((o.fus || 0) < FUSAO.max));
    if (temPar) h += btn('Fundir…', 'fusepick', `${kind},${i}`);
    if (i !== atual && lista.length > 1) h += btn('Desmontar (' + Object.keys(desmonteDe(kind, item)).map(m => desmonteDe(kind, item)[m] + ' ' + MAT_NAMES[m]).join(', ') + ')', 'desm', `${kind},${i}`);
    return h;
  }
  function forge() {
    refresh();
    let h = `<h2>Ferreiro e runas</h2><p class="sub">${msg}</p><div class="row">${['armas', 'armaduras', 'runas'].map(t => btn(t[0].toUpperCase() + t.slice(1), 'tab', t, tab === t ? 'sel' : '')).join('')}</div>`;
    if (tab === 'armas') {
      P.armas.forEach((w, i) => {
        const slots = RANK_SLOTS[w.rank], c = rankUpCost(w.rank), wd = WEAPONS[w.id];
        h += `<div class="card"><b>${ico('weapon', w.id, wd.emoji)}${weaponName(w)}</b> ${i === P.arma ? '<span class="tag">equipada</span>' : ''}
          <div class="small">Dano ${Math.round(wd.dano * RANK_MULT[w.rank] * (1 + FUSAO.bonus * (w.fus || 0)))} · combo de ${wd.steps.length} golpes · slots ${w.runas.length}/${slots}</div>${espHtml(w)}
          <div class="row">${w.runas.map((r, k) => btn('✖ ' + runeTag(r), 'unengraveW', i + ',' + k)).join('')}
          ${w.runas.length < slots ? btn('+ Engastar runa', 'pickRune', 'W,' + i, '', !P.runas.length) : ''}</div>`;
        if (pick && pick.kind === 'W' && pick.i === i) h += `<div class="row">${P.runas.map((r, ri) => btn(runeTag(r), 'engrave', `W,${i},${ri}`)).join('')}</div>`;
        h += `<div class="row">${i !== P.arma ? btn('Equipar', 'equipW', i) : ''}${fusDesmBtns('W', i, w)}`;
        if (c && w.rank === 2 && !P.flags.forjaFerrao) h += `<span class="small">Damasco: requer o Martelo do Ferrão (derrote o Caçador).</span>`;
        else if (c) {
          if (w.rank === 0) {
            if (pick && pick.kind === 'branch' && pick.i === i) h += wd.ramos.map((rm, k) => btn(`${rm.nome}: ${rm.desc}`, 'upW', i + ',' + k, '', !canPay(P, c))).join('');
            else h += btn(`Evoluir para ${RANKS[1]} (${costText(c)})`, 'branchW', i, '', !canPay(P, c));
          } else h += btn(`Evoluir para ${RANKS[w.rank + 1]} (${costText(c)})`, 'upW', i + ',', '', !canPay(P, c));
        } else h += '<span class="small">Rank máximo</span>';
        h += `</div></div>`;
      });
    } else if (tab === 'armaduras') {
      P.armaduras.forEach((a, i) => {
        const ad = ARMORS[a.id], c = rankUpCost(a.rank);
        h += `<div class="card"><b>${ico('armor', a.id, ad.emoji)}${ad.nome} (${RANKS[a.rank]})${fusTxt(a)}</b> ${i === P.armadura ? '<span class="tag">equipada</span>' : ''}
          <div class="small">Defesa ${Math.round(ad.def * RANK_MULT[a.rank] * (1 + FUSAO.bonus * (a.fus || 0)))} · ${ad.desc}</div>${espHtml(a)}
          <div class="row">${a.runa ? btn('✖ ' + runeTag(a.runa) + ' (resistência a ' + ELEMS[a.runa.elem].nome + ')', 'unengraveA', i) : btn('+ Runa de defesa', 'pickRune', 'A,' + i, '', !P.runas.length)}</div>`;
        if (pick && pick.kind === 'A' && pick.i === i && !a.runa) h += `<div class="row">${P.runas.map((r, ri) => btn(runeTag(r), 'engrave', `A,${i},${ri}`)).join('')}</div>`;
        h += `<div class="row">${i !== P.armadura ? btn('Equipar', 'equipA', i) : ''}${fusDesmBtns('A', i, a)}${c && a.rank === 2 && !P.flags.forjaFerrao ? '<span class="small">Damasco: requer o Martelo do Ferrão.</span>' : c ? btn(`Evoluir para ${RANKS[a.rank + 1]} (${costText(c)})`, 'upA', i + ',', '', !canPay(P, c)) : '<span class="small">Rank máximo</span>'}</div></div>`;
      });
    } else {
      h += `<p class="sub">Runas soltas. Fundir 2 runas iguais do mesmo nível gera uma de nível acima (máx. 3). Elementos ativos neste capítulo: Fogo, Veneno e Físico.</p>`;
      const groups = {}; P.runas.forEach(r => { const k = r.elem + ',' + r.lvl; groups[k] = (groups[k] || 0) + 1; });
      const keys = Object.keys(groups);
      if (!keys.length) h += '<p>Nenhuma runa solta.</p>';
      h += keys.map(k => { const [e, l] = k.split(','); return `<div class="slot"><span>${ico('rune', e, ELEMS[e].emoji)}<b>${ELEMS[e].gema}</b> nv ${l} ×${groups[k]} <span class="small">${ELEMS[e].efeito}</span></span>${btn('Fundir 2 → nv ' + (+l + 1), 'fuse', k, '', groups[k] < 2 || +l >= 3)}</div>`; }).join('');
    }
    h += `<div class="row">${btn('Voltar', 'camp')}</div>`;
    msg = ''; show(h, 'camp');
  }
  function items() {
    refresh();
    show(`<h2>Itens</h2><p class="sub">${msg}</p>${matTable()}${elixirBtn()}<div class="row">${btn('Voltar', 'camp')}</div>`, 'camp');
    msg = '';
  }
  /* ---- Bancada: fabricar poções, materiais, armas e armaduras ---- */
  const custoHtml = r => Object.keys(r.custo).map(m => { const tem = P.itens[m] || 0, ok = tem >= r.custo[m]; return `<span class="${ok ? 'okc' : 'faltac'}">${ico('item', m, '', 18)}${MAT_NAMES[m]} ${tem}/${r.custo[m]}</span>`; }).join(' · ') + (r.moedas ? ` · <span class="${P.coins >= r.moedas ? 'okc' : 'faltac'}">🪙 ${P.coins}/${r.moedas}</span>` : '');
  const daHtml = r => r.da.arma ? WEAPONS[r.da.arma].nome : r.da.armadura ? ARMORS[r.da.armadura].nome : Object.keys(r.da).map(m => `${r.da[m] + (r.tipo === 'pocao' && S.pocoes ? 1 : 0)}× ${MAT_NAMES[m]}`).join(', ');
  function bancada() {
    refresh(); fromCamp = true;
    let h = `<h2>Bancada de fabricação</h2><p class="sub">${msg || 'Os materiais caem dos inimigos. Algumas receitas só se descobrem em drops raros.'}</p><div class="rcs">`;
    for (const [tipo, titulo] of [['pocao', 'Poções'], ['material', 'Materiais'], ['arma', 'Armas'], ['armadura', 'Armaduras']]) {
      h += `<h3>${titulo}</h3>`;
      for (const r of RECEITAS.filter(x => x.tipo === tipo)) {
        if (receitaSabida(P, r)) h += `<div class="card rec"><div><b>${r.nome}</b> <span class="small">→ ${daHtml(r)}</span><div class="small">${custoHtml(r)}</div></div>${btn('Fabricar', 'fab', r.id, 'primary', !custoOk(P, r))}</div>`;
        else h += `<div class="card rec dim"><div><b>???</b> <span class="small">Receita desconhecida</span><div class="small">Dica: ${r.fonte || 'explore e derrote inimigos'}</div></div></div>`;
      }
    }
    h += `</div><div class="row">${btn('Voltar', 'camp')}</div>`;
    show(h, 'camp'); msg = '';
  }
  /* ---- Bazar de testes: tudo liberado e de graça ---- */
  let bzTab = 'armas', bzEsp = false;
  function bazar() {
    refresh();
    const tabs = [['armas', 'Armas'], ['armaduras', 'Armaduras'], ['runas', 'Runas'], ['mats', 'Materiais'], ['rec', 'Receitas'], ['extras', 'Extras']];
    let h = `<h2>🎒 Bazar de Testes</h2><p class="sub">${msg || 'Tudo liberado e de graça, só para testar. Os itens vão direto para a sua mochila.'}</p>
      <div class="row pmtabs">${tabs.map(t => btn(t[1], 'bzTab', t[0], bzTab === t[0] ? 'sel' : '')).join('')}</div><div class="rcs">`;
    const rankBtns = (k, id) => RANKS.map((rk, i) => btn(rk, 'bz', `${k},${id},${i}`)).join('');
    if (bzTab === 'armas' || bzTab === 'armaduras') {
      h += `<div class="row">${btn(bzEsp ? '✔ Com habilidade especial aleatória' : '☐ Com habilidade especial aleatória', 'bzEsp', '', bzEsp ? 'sel' : '')}</div>`;
      if (bzTab === 'armas') for (const id in WEAPONS) { const wd = WEAPONS[id]; h += `<div class="card rec"><div><b>${ico('weapon', id, wd.emoji + ' ', 28)}${wd.nome}</b> <span class="small">dano ${wd.dano} · combo ${wd.steps.length}${wd.esp ? ' · ' + ESPECIAIS[wd.esp].nome : ''}</span></div><div class="row">${rankBtns('W', id)}</div></div>`; }
      else for (const id in ARMORS) { const ad = ARMORS[id]; h += `<div class="card rec"><div><b>${ico('armor', id, ad.emoji + ' ', 28)}${ad.nome}</b> <span class="small">defesa ${ad.def}</span></div><div class="row">${rankBtns('A', id)}</div></div>`; }
    } else if (bzTab === 'runas') {
      for (const e in ELEMS) h += `<div class="card rec"><div><b>${ico('rune', e, ELEMS[e].emoji + ' ', 28)}${ELEMS[e].gema} · ${ELEMS[e].nome}</b></div><div class="row">${[1, 2, 3].map(l => btn('nv ' + l, 'bz', `R,${e},${l}`)).join('')}</div></div>`;
    } else if (bzTab === 'mats') {
      for (const m of MAT_ORDER) h += `<div class="card rec"><div><b>${ico('item', m, MAT_INFO[m].emoji + ' ', 28)}${MAT_NAMES[m]}</b> <span class="small">você tem ${P.itens[m] || 0}</span></div><div class="row">${btn('+10', 'bz', `M,${m},10`)}${btn('+50', 'bz', `M,${m},50`)}</div></div>`;
    } else if (bzTab === 'rec') {
      h += `<div class="row">${btn('Aprender TODAS as receitas', 'bz', 'REC,all,0', 'primary')}</div>`;
      for (const r of RECEITAS) h += `<div class="card rec"><div><b>${r.nome}</b> <span class="small">${receitaSabida(P, r) ? '✔ conhecida' : r.fonte || ''}</span></div>${receitaSabida(P, r) ? '' : btn('Aprender', 'bz', `REC,${r.id},0`)}</div>`;
    } else {
      h += `<div class="col">${btn('+1000 moedas', 'bz', 'X,coins,0')}${btn('+10 pontos de talento', 'bz', 'X,pontos,0')}${btn('+3 níveis', 'bz', 'X,nivel,0')}${btn('Despertar o Canis (poderes, parede e Fúria)', 'bz', 'X,canis,0')}
        ${btn('Liberar o Damasco (Forja do Ferrão)', 'bz', 'X,forja,0')}${btn('Ativar Elixir da Sorte (5 min)', 'bz', 'X,elixir,0')}${btn('Curar tudo e limpar a mutação', 'bz', 'X,curar,0')}</div>`;
    }
    h += `</div><div class="row">${btn('Sair do bazar', 'bazarSair')}</div>`;
    show(h, 'bazarSair'); msg = '';
  }
  function end() {
    const min = Math.floor(P.tempo / 60);
    show(`<h1>Fim da versão inicial</h1><p class="sub">Capítulo 1 · Vila Destruída concluído</p>
      <p>${esc(P.nome)}, nível ${P.nivel}, ${min} minutos de jogo, ${P.flags.mortes} queda(s).</p>
      <p>O Caçador do Extermínio caiu, mas o rei sabe que os expulsos estão vivos, e o Comandante Valdemar vem atrás de você. A fortaleza do reino espera ao leste. Os capítulos 2 (Geleira, com Cygnus) e 3 (Fortaleza, com Bennu) vêm a seguir.</p>
      <div class="row">${btn('Continuar explorando', 'continueEnd', '', 'primary')}${btn('Menu principal', 'quit')}</div>`);
  }
  return {show, close, pollNav, title, camp, pause, end, story, act, bazar};
})();
