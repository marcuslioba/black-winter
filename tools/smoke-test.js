const fs = require('fs'), vm = require('vm'), path = require('path');
const dir = process.argv[2];
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
  addEventListener: (ev,fn)=>{(L2[ev]=L2[ev]||[]).push(fn)}, Event: function () {}, AudioContext: undefined, Set, Map, Image: function () { this.onload = null; }
};
sandbox.__L2 = L2; sandbox.window = sandbox; sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
const files = ['data', 'audio', 'input', 'player', 'itens', 'level', 'game', 'art', 'sprites', 'render', 'ui'];
let code = files.map(f => fs.readFileSync(path.join(dir, 'js', f + '.js'), 'utf8')).join('\n;\n');
code += `
;(function(){
  const log=(...a)=>console.log(...a);
  P = newPlayer('Teste', 'barbaro'); P.slot=1; beginWorld(false);
  const held = Input.held, pressed = Input.pressed; const KD=(c)=>(globalThis.__L2.keydown||[]).forEach(f=>f({code:c,target:{},preventDefault(){}})); const KU=(c)=>(globalThis.__L2.keyup||[]).forEach(f=>f({code:c,target:{},preventDefault(){}}));
  function frameSim(n, act){
    for(let i=0;i<n;i++){
      Input.poll();
      act && act(i);
      if (G.mode==='play') step(1/60); else if (G.mode==='dialog') { pressed.interact=true; updateDialog(); pressed.interact=false; } else if (G.mode==='dead'){ G.deadT+=1/60; if(G.deadT>1.8) respawn(); }
      render(1/60);
    }
  }
  // 1) andar Ã  direita e pular
  KD('KeyD'); frameSim(240, i=>{ if(i%50===0) KD('Space'); if(i%50===10) KU('Space'); }); KU('KeyD'); KU('Space');
  log('pos apos andar', Math.round(pl.x), Math.round(pl.y), 'hp', P.hp);
  // 2) atacar
  frameSim(120, i=>{ if(i%20===0) KD('KeyJ'); if(i%20===3) KU('KeyJ'); });
  log('ataque ok, enemies', G.enemies.length);
  // 3) menus
  UI.title(); UI.camp(); UI.act('talents'); UI.act('forge'); UI.act('tab','runas'); UI.act('tab','armaduras'); UI.act('items'); UI.act('sheet'); UI.act('pm','equip'); UI.act('eqsel','A,0'); UI.act('peq','W,0'); for (const tb of ['equip','hab','itens','diario','sistema']) UI.act('pm', tb); UI.act('options'); UI.act('controls');
  G.mode='play';
  for (const k of ['barbaro','cacador','guardiao','cacique']) { P = newPlayer('T',k); P.slot=1; beginWorld(false); P.folego=100; refresh(); frameSim(2); KD('KeyF'); frameSim(1); log('dbg', k, 'pressed', Input.pressed.skill, 'cd', pl.skillCd, 'f', P.folego, 'mode', G.mode); frameSim(2); KU('KeyF'); frameSim(60); log('classe', k, 'arma', P.armas[0].id, 'folego', Math.round(P.folego), 'def', Math.round(S.def)); }
  P = newPlayer('Teste', 'barbaro'); P.slot=1; beginWorld(false); G.mode='play';
  // 4) dar Canis, usar poder, wall jump etc.
  P.flags.canis=true; refresh();
  frameSim(60, i=>{ if(i%30===0) KD('KeyK'); if(i%30===3) KU('KeyK'); });
  log('mutacao', P.mut.toFixed(1), 'hpMax', hpMax(P,S));
  // 5) forÃ§ar morte e respawn
  P.hp=1; hurtPlayer(50, pl.x+50, null,'melee'); log('modo', G.mode);
  frameSim(200);
  log('modo apos respawn', G.mode);
  // 6) teleporte para a arena e luta do chefe com invulnerabilidade
  pl.x = 174*TS; pl.y = L.GROUND*TS-40; frameSim(5);
  log('gate', G.gateClosed, 'mode', G.mode);
  frameSim(30);
  G.bossActive=true; pl.iframes=999; P.hp=9999; P.baseHp=9999;
  for(let i=0;i<1200;i++){ if(G.mode==='dialog'){pressed.interact=true;updateDialog();pressed.interact=false;continue;} if(G.mode!=='play')break;
    Input.poll(); held.right = (G.boss? G.boss.x>pl.x:false); held.left=!held.right; pressed.attack = i%12===0; pl.iframes=999; step(1/60); render(1/60);
    if(G.boss){ G.boss.hp -= 1.5; if(G.boss.hp<=0) killEnemy(G.boss); } }
  log('boss morto', P.flags.bossMorto, 'xp', P.xp, 'nivel', P.nivel, 'coins', P.coins);
  // 7) salvar/carregar
  restAtCamp(P); saveGame(1,P); const sv=loadSave(1); log('save ok', !!sv, sv.p.nome);
  UI.act('load','1'); log('load modo', G.mode, 'camp', P.camp);
  // 8) abrir baÃºs
  for(const c of L.chests) openChest(c); log('runas', P.runas.length, 'armas', P.armas.length, 'armaduras', P.armaduras.length);
  UI.act('forge'); UI.act('tab','armas'); UI.act('engrave','W,0,0'); UI.act('upW','0,0'); refresh();
  log('arma', weaponName(P.armas[0]));
  
  // 9) bot de salto na parede no poÃ§o
  P.flags.canis=true; refresh(); G.mode='play'; G.dialog=null; pl.dead=false; P.hp=9999; pl.iframes=999;
  G.enemies=[]; pl.x=126*TS; pl.y=L.GROUND*TS-40; pl.vx=pl.vy=0;
  let d=1, minY=pl.y, up=0, reached=-1;
  KU('KeyA'); KU('KeyD');
  for(let i=0;i<900;i++){
    Input.poll();
    KD(d>0?'KeyD':'KeyA'); KU(d>0?'KeyA':'KeyD');
    if(pl.onGround && pl.t%1<0.1) KD('Space');
    else if(!pl.onGround && pl.wallDir===d) { KD('Space'); d=-d; }
    else KU('Space');
    pl.iframes=999; step(1/60); minY=Math.min(minY,pl.y);
    if(pl.y < 18*TS-40 && pl.x > 129*TS && reached<0) reached=i;
  }
  log('poÃ§o: menor y', Math.round(minY), 'alvo <', 18*TS-30, 'chegou ao corredor no frame', reached);
  // diÃ¡logos: nota lida, gatilho de fala e mÃ¡quina de escrever
  { G.mode='play'; G.dialog=null; P.flags.seen={}; interact({kind:'note', ref:L.notes[0], x:L.notes[0].x, y:L.notes[0].y});
    if (G.mode!=='dialog') throw new Error('nota nÃ£o abriu diÃ¡logo');
    const n=G.dialog.lines.length; let guard=0; while(G.mode==='dialog' && guard++<4000){ KD('KeyE'); Input.poll(); updateDialog(0.5); KU('KeyE'); Input.poll(); }
    log('nota lida em', guard, 'passos,', n, 'falas', G.mode); if (G.mode==='dialog') throw new Error('diÃ¡logo nÃ£o avanÃ§ou');
    G.mode='play'; pl.x = (TRIGGERS[0].x+1)*TS; pl.onGround=true; checkTriggers(); if (G.mode!=='dialog' || !P.flags.seen.rua) throw new Error('gatilho nÃ£o disparou'); G.dialog=null; G.mode='play'; }
  // lembranÃ§as: todas reunidas dÃ£o 1 ponto de talento
  { const pt=P.pontos; P.flags.bossMorto=true; for (const m of L.notes.filter(n=>n.mem)) { G.mode='play'; G.dialog=null; interact({kind:'note', ref:m, x:m.x, y:m.y}); let gd=0; while(G.mode==='dialog' && gd++<500){ KD('KeyE'); Input.poll(); updateDialog(0.5); KU('KeyE'); Input.poll(); } }
    log('lembranÃ§as', memCount(), 'pontos', pt, '->', P.pontos); if (memCount()!==5 || P.pontos!==pt+1) throw new Error('lembranÃ§as falharam'); G.mode='play'; }
  // esquiva grÃ¡tis, FÃºria (+50%, dreno de Vida), forma animal e volta ao tocar a Ãrvore dos Antigos
  { G.mode='play'; G.dialog=null; G.enemies=[]; P.flags.canis=true; pl.dead=false; pl.iframes=999; P.hp=hpMax(P,S); P.folego=100; P.mut=0; refresh();
    pl.x=20*TS; pl.y=26*TS; for(let i=0;i<30;i++) step(1/60); pl.dodgeCd=0;
    Input.poll(); const f0=P.folego; KD('ShiftLeft'); Input.poll(); step(1/60); KU('ShiftLeft'); Input.poll(); if (!(pl.dodgeCd>0)) throw new Error('esquiva nÃ£o ativou'); if (P.folego < f0 - 0.5) throw new Error('esquiva gastou FÃ´lego');
    for(let i=0;i<30;i++) step(1/60);
    Input.poll(); const d0=calcStats(P).danoPct; KD('KeyG'); Input.poll(); step(1/60); KU('KeyG'); Input.poll(); if (!pl.berserk) throw new Error('FÃºria nÃ£o ativou');
    if (S.danoPct < d0 + 49 || S.velAtq < 0.49) throw new Error('bÃ´nus da FÃºria ausente');
    const hp0=P.hp; for(let i=0;i<60;i++) step(1/60); if (!(P.hp < hp0)) throw new Error('FÃºria nÃ£o consome Vida');
    P.hp=3; for(let i=0;i<120 && !pl.feral;i++) step(1/60); if (!pl.feral || P.hp !== 0 || !(pl.feralHp > 0)) throw new Error('nÃ£o virou animal com a Vida em zero'); { const fh=pl.feralHp; pl.iframes=0; G.hitstop=0; hurtPlayer(10, pl.x+60, null, 'melee'); if (!(pl.feralHp < fh) || pl.dead || P.hp !== 0) throw new Error('dano na fera deveria gastar o instinto'); pl.iframes=0; }
    pl.x=L.camps[0].x-10; pl.y=L.camps[0].y-pl.h-1; for(let i=0;i<30;i++) step(1/60); if (pl.feral || pl.berserk) throw new Error('nÃ£o voltou ao normal na Ã¡rvore');
    log('fÃºria ok: bÃ´nus', S.danoPct, 'hp apÃ³s volta', Math.round(P.hp)); pl.iframes=0; }
  // habilidades de classe: golpe brutal, investida, escudo e nÃ©voa debilitante
  { const orig=P.classe; const mkE=()=>{ const e=mkEnemy({type:'soldado', x: pl.x+50, y: pl.y+pl.h-ENEMIES.soldado.h}); G.enemies=[e]; return e; };
    const cast=k=>{ P.classe=k; pl.dead=false; G.mode='play'; pl.feral=pl.berserk=false; pl.skillCd=0; pl.dodgeT=0; pl.powerT=0; pl.dashT=0; pl.facing=1; P.folego=100; refresh(); };
    cast('barbaro'); let e=mkE(); useSkill(); if (!(e.hp < e.hpMax)) throw new Error('golpe brutal nÃ£o acertou');
    cast('cacador'); e=mkE(); useSkill(); if (!(pl.dashT>0)) throw new Error('investida nÃ£o ativou'); for(let i=0;i<40 && pl.dashT>0;i++) step(1/60);
    cast('guardiao'); useSkill(); if (!(pl.shieldT>0)) throw new Error('escudo nÃ£o ativou');
    cast('cacique'); e=mkE(); useSkill(); if (!(e.weak>0 && e.slow>0)) throw new Error('nÃ©voa nÃ£o debilitou');
    P.classe=orig; pl.berserk=pl.feral=false; refresh(); log('habilidades de classe ok'); }
  // loot: drops por sorte, coleta, fabricação, desmonte, fusão, martelo do chefe e bazar
  { G.mode='play'; G.dialog=null; pl.dead=false; G.enemies=[]; G.drops=[]; P.coins=500; P.itens.erva=10; P.itens.resina=10; P.itens.ferro=20; P.itens.couro=10; P.itens.fragmento=8; P.itens.pele=6; P.itens.tecido=6; P.itens.garra=3;
    // tabelas: com muita sorte sai tudo que pode cair
    let cnt={}; for(let i=0;i<400;i++) for (const s of rollDrops('soldado', 500)) cnt[s.t+':'+(s.id||s.elem)]=1; if (!cnt['mat:fragmento'] || !cnt['arma:espada'] || !cnt['rec:forjar_aco']) throw new Error('tabela do soldado incompleta');
    if (rollDrops('lobo', 0).length > 8) throw new Error('lobo dropou demais');
    // sorte aumenta a quantidade média
    let a0=0,a1=0; for(let i=0;i<3000;i++){ a0+=rollDrops('lobo',0).length; a1+=rollDrops('lobo',100).length; } if (!(a1 > a0*1.5)) throw new Error('sorte não aumentou os drops');
    // drop no mundo: material é coletado sozinho, arma precisa de interação
    pl.x=20*TS; pl.y=26*TS; for(let i=0;i<20;i++) step(1/60);
    const antes=P.itens.pele; spawnDrop({t:'mat', id:'pele', q:2, r:'comum'}, cxOf(pl)+30, cyOf(pl)-20); for(let i=0;i<120;i++) step(1/60); if (P.itens.pele !== antes+2) throw new Error('material não foi coletado sozinho ' + JSON.stringify({pele:P.itens.pele, d:G.drops.map(d=>[Math.round(d.x-pl.x),Math.round(d.y-pl.y),d.age.toFixed(1),d.dead]), mode:G.mode, hs:G.hitstop, feral:pl.feral, pdead:pl.dead}));
    const na=P.armas.length; spawnDrop({t:'arma', id:'lanca', r:'incomum'}, cxOf(pl)+8, cyOf(pl)-10); for(let i=0;i<60;i++) step(1/60); if (P.armas.length !== na) throw new Error('arma não pode ser coletada sozinha');
    G.near = nearest(); if (!G.near || G.near.kind!=='drop') throw new Error('arma caída não é interagível'); interact(G.near); if (P.armas.length !== na+1) throw new Error('arma não foi pega');
    // martelo do chefe
    const boss=mkEnemy(L.boss); for (const s of rollDrops('cacador', 0)) spawnDrop(s, cxOf(pl), cyOf(pl)); const mart=G.drops.find(d=>d.spec.id==='martelo'); if(!mart) throw new Error('chefe não dropou o martelo'); collectDrop(mart); if (!P.flags.forjaFerrao || !P.armas.some(w=>w.id==='martelo')) throw new Error('martelo/forja não registrados');
    const antesA=P.arma; P.arma=P.armas.findIndex(w=>w.id==='martelo'); refresh(); if(!S.abalo) throw new Error('martelo sem Abalo'); P.arma=antesA; refresh();
    // fabricar: básica funciona, desconhecida não
    P.itens.erva=10; P.itens.raiz=0; const rr=RECEITAS.find(r=>r.id==='raiz'); if (!fabricar(P, rr, S) || P.itens.raiz!==1) throw new Error('fabricar raiz falhou'); if (fabricar(P, RECEITAS.find(r=>r.id==='elixir'), S)) throw new Error('receita desconhecida fabricou');
    P.receitas.elixir=true; P.itens.erva=5; P.itens.resina=5; P.itens.garra=3; if (!fabricar(P, RECEITAS.find(r=>r.id==='elixir'), S) || P.itens.elixir<1) throw new Error('elixir não fabricou');
    P.itens.ferro=20; P.itens.couro=10; const nw=P.armas.length; if(!fabricar(P, RECEITAS.find(r=>r.id==='arma_espada'), S) || P.armas.length!==nw+1) throw new Error('arma não fabricou');
    // desmontar e fundir
    P.armas=[novaArma('espada',0), novaArma('espada',1), novaArma('machado',0)]; P.arma=0; refresh();
    if (desmontar(P,'W',0).ok) throw new Error('desmontou equipada'); const dm=desmontar(P,'W',2); if(!dm.ok || P.armas.length!==2) throw new Error('desmontar falhou');
    if (!podeFundir(P,'W',0,1)) throw new Error('não pode fundir duas espadas'); let ganhou=0; for(let t=0;t<200;t++){ P.armas=[novaArma('espada',0), novaArma('espada',1)]; P.arma=0; const r=fundir(P,'W',0,1); if(!r.ok || P.armas.length!==1 || P.armas[0].fus!==1 || P.armas[0].rank!==1) throw new Error('fusão errada'); if (P.armas[0].esp) ganhou++; }
    if (ganhou<40 || ganhou>130) throw new Error('chance de especial fora do esperado '+ganhou);
    P.armas=[novaArma('espada',0,'critico'), novaArma('espada',0)]; P.arma=0; refresh(); if (!(S.critico>0)) throw new Error('especial crítico não aplicou'); P.arma=0;
    // runas: fundir 2
    P.runas=[{elem:'fogo',lvl:1},{elem:'fogo',lvl:1}]; if(!fuseRunes(P,'fogo',1) || P.runas.length!==1 || P.runas[0].lvl!==2) throw new Error('fusão de runas');
    // bazar
    P.armas=[novaArma('espada',0)]; P.arma=0; UI.act('bz','W,martelo,3'); if(!P.armas.some(w=>w.id==='martelo' && w.rank===3)) throw new Error('bazar não deu martelo'); UI.act('bz','REC,all,0'); if(!RECEITAS.every(r=>receitaSabida(P,r))) throw new Error('bazar não liberou receitas');
    UI.act('bz','M,pele,10'); UI.act('bz','X,coins,0'); UI.act('bancada'); UI.act('forge'); UI.act('tab','armas'); UI.act('tab','armaduras'); UI.act('items');
    log('loot ok: armas', P.armas.length, 'especiais por fusão', ganhou+'/200'); G.mode='play'; refresh(); }
  log('SMOKE OK');
})();
`;
try { vm.runInContext(code, ctx, {filename: 'bundle.js'}); } catch (e) { console.error('ERRO:', e.stack.split('\n').slice(0, 6).join('\n')); process.exit(1); }

