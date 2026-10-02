'use strict';
/* ===== Dados do jogo: armas, runas, armaduras, talentos, inimigos, textos ===== */
const TS = 32;
const RANKS = ['Ferro', 'Aço', 'Brigandina', 'Damasco'];
const RANK_MULT = [1, 1.3, 1.65, 2.1];
const RANK_SLOTS = [1, 2, 3, 4];
const RANK_COST = [
  {coins: 80,  mat: {ferro: 6}},
  {coins: 160, mat: {aco: 8}},
  {coins: 300, mat: {aco: 12}}
];
const MAT_NAMES = {ferro: 'Ferro', aco: 'Aço', erva: 'Erva', raiz: 'Raiz de Cura', rimora: 'Raiz de Rímora',
  pele: 'Pele de Lobo', garra: 'Garra de Lobo', couro: 'Couro Curtido', fragmento: 'Fragmento de Ferro', tecido: 'Tecido', resina: 'Resina',
  antidoto: 'Antídoto', elixir: 'Elixir da Sorte'};
/* materiais e poções: emoji de reserva (quando não há ícone), tipo e para que servem */
const MAT_INFO = {
  ferro: {emoji: '⚙️', tipo: 'mat', desc: 'Material de ferreiro. Evolui equipamentos.'},
  aco: {emoji: '🔩', tipo: 'mat', desc: 'Material de ferreiro. Evolui equipamentos.'},
  erva: {emoji: '🍃', tipo: 'mat', desc: 'Base das poções.'},
  pele: {emoji: '🐺', tipo: 'mat', desc: 'De lobos. Usada em armaduras de pelo.'},
  garra: {emoji: '🦴', tipo: 'mat', desc: 'De lobos. Usada em armaduras e no Elixir da Sorte.'},
  couro: {emoji: '🟫', tipo: 'mat', desc: 'De soldados e besteiros. Armas e armaduras.'},
  fragmento: {emoji: '🔸', tipo: 'mat', desc: 'De soldados. 4 fundem em 1 Ferro.'},
  tecido: {emoji: '🧵', tipo: 'mat', desc: 'De soldados e besteiros. Armaduras.'},
  resina: {emoji: '🟡', tipo: 'mat', desc: 'De besteiros. Poções, Aço e cajados.'},
  raiz: {emoji: '🌿', tipo: 'pot', desc: 'Tecla de cura: restaura Saúde.'},
  rimora: {emoji: '🧪', tipo: 'pot', desc: 'Restaura Fôlego Tanataú.'},
  antidoto: {emoji: '💚', tipo: 'pot', desc: 'Usado sozinho quando você é envenenado.'},
  elixir: {emoji: '☘️', tipo: 'pot', desc: 'Dá +50% de sorte nos drops por 5 minutos (use no menu Itens).'}
};
const MAT_ORDER = ['raiz', 'rimora', 'antidoto', 'elixir', 'erva', 'resina', 'pele', 'garra', 'couro', 'tecido', 'fragmento', 'ferro', 'aco'];
const RARIDADE = {
  comum: {nome: 'Comum', cor: '#cfd8ea'}, incomum: {nome: 'Incomum', cor: '#6fe08a'}, raro: {nome: 'Raro', cor: '#5aa8ff'},
  epico: {nome: 'Épico', cor: '#c070ff'}, lendario: {nome: 'Lendário', cor: '#ffc040'}
};
/* fusão de equipamentos: +12% por nível de fusão (máx. 3) e chance de nascer uma habilidade especial */
const FUSAO = {max: 3, bonus: 0.12, chanceEsp: 0.4};
/* o que volta ao desmontar, por rank (armaduras ainda devolvem couro e tecido) */
const DESMONTE = [{ferro: 3, fragmento: 2}, {aco: 3, ferro: 2}, {aco: 6, ferro: 2}, {aco: 10}];
const ESPECIAIS = {
  sangria: {nome: 'Sangria', desc: 'Cura 5% do dano que você causa.'},
  trovao: {nome: 'Trovão', desc: 'O último golpe do combo solta um raio que atinge os inimigos em volta.'},
  critico: {nome: 'Golpe Crítico', desc: '15% de chance de causar o dobro de dano.'},
  veloz: {nome: 'Veloz', desc: '+10% de velocidade de ataque.'},
  abalo: {nome: 'Abalo', desc: 'O último golpe do combo atordoa e arremessa os inimigos em volta.'},
  faro: {nome: 'Faro de Tesouro', desc: '+12% de sorte nos drops.'},
  espinhos: {nome: 'Espinhos', desc: 'Devolve 25% do dano a quem te acerta de perto.'},
  vigor: {nome: 'Vigor', desc: '+20 de Fôlego Tanataú máximo.'},
  regen: {nome: 'Regeneração', desc: 'Recupera 0,6 de Saúde por segundo.'},
  couraca: {nome: 'Couraça', desc: '+12% de defesa.'}
};
const ESP_ARMAS = ['sangria', 'trovao', 'critico', 'veloz', 'faro'];
const ESP_ARMADURAS = ['espinhos', 'vigor', 'regen', 'couraca', 'faro'];
/* Receitas. basica = já conhecida; as outras são aprendidas (drops raros, baús, Natalie). custo em materiais; moedas opcional. */
const RECEITAS = [
  {id: 'raiz', nome: 'Raiz de Cura', tipo: 'pocao', basica: true, custo: {erva: 3}, da: {raiz: 1}},
  {id: 'rimora', nome: 'Raiz de Rímora', tipo: 'pocao', basica: true, custo: {erva: 2, resina: 1}, da: {rimora: 1}},
  {id: 'antidoto', nome: 'Antídoto', tipo: 'pocao', custo: {erva: 2, resina: 1}, da: {antidoto: 1}, fonte: 'Drop de lobos e besteiros'},
  {id: 'elixir', nome: 'Elixir da Sorte', tipo: 'pocao', custo: {erva: 3, resina: 2, garra: 1}, da: {elixir: 1}, fonte: 'Drop raro de besteiros'},
  {id: 'fundir_ferro', nome: 'Fundir Ferro (4 fragmentos)', tipo: 'material', basica: true, custo: {fragmento: 4}, da: {ferro: 1}},
  {id: 'forjar_aco', nome: 'Forjar Aço', tipo: 'material', custo: {ferro: 3, resina: 1}, da: {aco: 1}, fonte: 'Drop raro de soldados'},
  {id: 'arma_espada', nome: 'Espada de Ferro', tipo: 'arma', basica: true, moedas: 30, custo: {ferro: 4, couro: 2}, da: {arma: 'espada'}},
  {id: 'arma_machado', nome: 'Machado de Ferro', tipo: 'arma', basica: true, moedas: 40, custo: {ferro: 5, couro: 2}, da: {arma: 'machado'}},
  {id: 'arma_lanca', nome: 'Lança de Ferro', tipo: 'arma', basica: true, moedas: 40, custo: {ferro: 4, couro: 2, resina: 1}, da: {arma: 'lanca'}},
  {id: 'arma_manoplas', nome: 'Manoplas de Ferro', tipo: 'arma', basica: true, moedas: 40, custo: {ferro: 5, couro: 3}, da: {arma: 'manoplas'}},
  {id: 'arma_cajado', nome: 'Cajado de Ferro', tipo: 'arma', basica: true, moedas: 30, custo: {couro: 3, resina: 3, ferro: 1}, da: {arma: 'cajado'}},
  {id: 'arm_gibao', nome: 'Gibão do Sobrevivente', tipo: 'armadura', basica: true, moedas: 20, custo: {couro: 3, tecido: 3}, da: {armadura: 'gibao'}},
  {id: 'arm_couro_lobo', nome: 'Couro de Lobo', tipo: 'armadura', moedas: 60, custo: {pele: 5, couro: 3, tecido: 2, garra: 2}, da: {armadura: 'couro_lobo'}, fonte: 'Drop raro de lobos'}
];
/* Tabelas de drop por inimigo. p = chance (1 = garantido); a sorte multiplica. q = quantidade [min, max]; r = raridade. */
const DROPS = {
  lobo: [
    {t: 'mat', id: 'pele', p: 0.55, q: [1, 2], r: 'comum'}, {t: 'mat', id: 'garra', p: 0.32, r: 'comum'}, {t: 'mat', id: 'erva', p: 0.2, r: 'comum'},
    {t: 'pot', id: 'raiz', p: 0.06, r: 'incomum'}, {t: 'rec', id: 'antidoto', p: 0.03, r: 'incomum'}, {t: 'rec', id: 'arm_couro_lobo', p: 0.035, r: 'raro'},
    {t: 'runa', elem: 'fisico', lvl: 1, p: 0.025, r: 'incomum'}, {t: 'armadura', id: 'couro_lobo', p: 0.012, r: 'raro'}
  ],
  soldado: [
    {t: 'mat', id: 'fragmento', p: 0.5, q: [1, 3], r: 'comum'}, {t: 'mat', id: 'couro', p: 0.35, r: 'comum'}, {t: 'mat', id: 'tecido', p: 0.3, r: 'comum'},
    {t: 'mat', id: 'ferro', p: 0.14, r: 'incomum'}, {t: 'mat', id: 'aco', p: 0.05, r: 'incomum'},
    {t: 'pot', id: 'raiz', p: 0.07, r: 'incomum'}, {t: 'pot', id: 'rimora', p: 0.06, r: 'incomum'},
    {t: 'arma', id: 'espada', p: 0.025, r: 'incomum'}, {t: 'arma', id: 'lanca', p: 0.02, r: 'incomum'}, {t: 'arma', id: 'machado', p: 0.02, r: 'incomum'}, {t: 'arma', id: 'manoplas', p: 0.015, r: 'incomum'},
    {t: 'armadura', id: 'gibao', p: 0.03, r: 'incomum'}, {t: 'rec', id: 'forjar_aco', p: 0.05, r: 'raro'},
    {t: 'runa', elem: 'fogo', lvl: 1, p: 0.03, r: 'incomum'}, {t: 'runa', elem: 'fisico', lvl: 1, p: 0.03, r: 'incomum'}
  ],
  besta: [
    {t: 'mat', id: 'tecido', p: 0.4, r: 'comum'}, {t: 'mat', id: 'resina', p: 0.4, q: [1, 2], r: 'comum'}, {t: 'mat', id: 'couro', p: 0.3, r: 'comum'}, {t: 'mat', id: 'fragmento', p: 0.3, r: 'comum'},
    {t: 'pot', id: 'rimora', p: 0.09, r: 'incomum'}, {t: 'pot', id: 'antidoto', p: 0.05, r: 'incomum'},
    {t: 'rec', id: 'elixir', p: 0.05, r: 'raro'}, {t: 'rec', id: 'antidoto', p: 0.04, r: 'incomum'},
    {t: 'runa', elem: 'veneno', lvl: 1, p: 0.04, r: 'incomum'}, {t: 'arma', id: 'cajado', p: 0.03, r: 'incomum'}, {t: 'arma', id: 'lanca', p: 0.015, r: 'incomum'}
  ],
  cacador: [   // Ferrão: o Martelo é garantido
    {t: 'arma', id: 'martelo', p: 1, r: 'lendario'},
    {t: 'mat', id: 'ferro', p: 1, q: [4, 6], r: 'incomum'}, {t: 'mat', id: 'aco', p: 1, q: [2, 4], r: 'incomum'}, {t: 'mat', id: 'couro', p: 1, q: [3, 5], r: 'comum'},
    {t: 'rec', id: 'forjar_aco', p: 0.6, r: 'raro'}, {t: 'rec', id: 'elixir', p: 0.5, r: 'raro'}, {t: 'runa', elem: 'fogo', lvl: 2, p: 0.5, r: 'raro'}
  ]
};


const ELEMS = {
  fogo:    {nome: 'Fogo',    emoji: '🔥', cor: '#ff7a2f', gema: 'Rubi',         efeito: 'Queimadura: dano ao longo do tempo'},
  agua:    {nome: 'Água',    emoji: '💧', cor: '#4fa8ff', gema: 'Água-Marinha', efeito: 'Em breve'},
  ar:      {nome: 'Ar',      emoji: '🌪️', cor: '#7fe3b0', gema: 'Esmeralda',    efeito: 'Em breve'},
  terra:   {nome: 'Terra',   emoji: '⛰️', cor: '#b08a52', gema: 'Ônix',         efeito: 'Em breve'},
  veneno:  {nome: 'Veneno',  emoji: '☠️', cor: '#7ed957', gema: 'Jade',         efeito: 'Envenena: dano ao longo do tempo'},
  fisico:  {nome: 'Físico',  emoji: '💎', cor: '#e8e8ff', gema: 'Opala',        efeito: '+8% de dano por nível'}
};

/* step: [duração, multiplicador de dano, empurrão] por golpe do combo */
const WEAPONS = {
  espada:  {nome: 'Espada',  emoji: '🗡️', dano: 12, alcance: 54, alt: 46,
            steps: [[0.30, 1.0, 140], [0.30, 1.0, 140], [0.46, 1.5, 260]],
            ramos: [{nome: 'Lâmina Ligeira', fx: {vel: 0.15}, desc: '+15% velocidade de ataque'},
                    {nome: 'Lâmina Pesada',  fx: {dano: 0.15}, desc: '+15% de dano'}]},
  machado: {nome: 'Machado', emoji: '🪓', dano: 20, alcance: 52, alt: 52,
            steps: [[0.56, 1.0, 240], [0.70, 1.6, 380]],
            ramos: [{nome: 'Machado de Guerra', fx: {dano: 0.15}, desc: '+15% de dano'},
                    {nome: 'Machado Ligeiro',   fx: {vel: 0.15},  desc: '+15% velocidade de ataque'}]},
  lanca:   {nome: 'Lança',   emoji: '🔱', dano: 13, alcance: 80, alt: 26,
            steps: [[0.36, 1.0, 150], [0.36, 1.0, 150], [0.52, 1.5, 270]],
            ramos: [{nome: 'Lança Longa',    fx: {dano: 0.15}, desc: '+15% de dano'},
                    {nome: 'Lança Ligeira',  fx: {vel: 0.15},  desc: '+15% velocidade de ataque'}]},
  cajado:  {nome: 'Cajado',  emoji: '🪄', dano: 10, alcance: 66, alt: 40,
            steps: [[0.34, 1.0, 130], [0.34, 1.0, 130], [0.50, 1.5, 250]],
            ramos: [{nome: 'Cajado Ancestral', fx: {dano: 0.15}, desc: '+15% de dano'},
                    {nome: 'Cajado Ligeiro',   fx: {vel: 0.15},  desc: '+15% velocidade de ataque'}]},
  martelo: {nome: 'Martelo do Ferrão', emoji: '🔨', dano: 26, alcance: 50, alt: 54, unica: true, esp: 'abalo',
            steps: [[0.74, 1.0, 320], [0.95, 1.8, 480]],
            ramos: [{nome: 'Martelo Brutal', fx: {dano: 0.15}, desc: '+15% de dano'},
                    {nome: 'Martelo Ágil', fx: {vel: 0.15}, desc: '+15% velocidade de ataque'}]},
  manoplas: {nome: 'Manoplas', emoji: '🥊', dano: 7, alcance: 38, alt: 40,
            steps: [[0.20, 1.0, 70], [0.20, 1.0, 70], [0.20, 1.1, 80], [0.20, 1.1, 80], [0.34, 1.6, 240]],
            ramos: [{nome: 'Manoplas Furiosas', fx: {vel: 0.15},  desc: '+15% velocidade de ataque'},
                    {nome: 'Manoplas de Aço',   fx: {dano: 0.15}, desc: '+15% de dano'}]}
};

const ARMORS = {
  gibao:      {nome: 'Gibão do Sobrevivente', emoji: '🧥', def: 10, fx: {},
               desc: 'Couro e lã remendados. Sem bônus especial.'},
  couro_lobo: {nome: 'Couro de Lobo', emoji: '🐺', def: 16, fx: {folegoRegenPct: 30, canisCura: 3, sorte: 8},
               desc: 'Fôlego regenera 30% mais rápido. A Garra Lupina cura +3. +8% de sorte.'}
};

const TALENT_BRANCHES = {
  guerreiro: 'Guerreiro', cacador: 'Caçador', guardiao: 'Guardião', natureza: 'Natureza', tanatau: 'Tanataú e Mutação'
};
/* fx(s): modifica o objeto de atributos. soon: ainda sem efeito neste capítulo */
const TALENTS = [
  {id: 'g1', ramo: 'guerreiro', nome: 'Golpe Forte', custo: 1, desc: '+12% de dano.', fx: s => s.danoPct += 12},
  {id: 'g2', ramo: 'guerreiro', nome: 'Chance de Combo', custo: 1, req: 'g1', desc: '+15% velocidade de ataque.', fx: s => s.velAtq += 0.15},
  {id: 'g3', ramo: 'guerreiro', nome: 'Bravata', custo: 2, req: 'g2', desc: 'O último golpe do combo arremessa o inimigo longe.', fx: s => s.bravata = true},
  {id: 'g4', ramo: 'guerreiro', nome: 'Ódio', custo: 2, req: 'g3', desc: '+30% de dano com a Saúde abaixo de 40%.', fx: s => s.odio = true},
  {id: 'g5', ramo: 'guerreiro', nome: 'Fusão Espírito/Arma', custo: 3, req: 'g4', desc: 'Todas as runas da arma ganham +1 nível (máx. 3).', fx: s => s.runaBonus += 1},

  {id: 'c1', ramo: 'cacador', nome: 'Passo Leve', custo: 1, desc: '+10% velocidade de movimento.', fx: s => s.velMove += 0.10},
  {id: 'c2', ramo: 'cacador', nome: 'Ataque Surpresa', custo: 1, req: 'c1', desc: '+50% de dano em inimigos que ainda não notaram você.', fx: s => s.surpresa = true},
  {id: 'c3', ramo: 'cacador', nome: 'Olfato e Visão', custo: 2, req: 'c2', desc: 'O minimapa mostra inimigos próximos e segredos. +15% de sorte nos drops.', fx: s => { s.olfato = true; s.sorte += 15; }},
  {id: 'c4', ramo: 'cacador', nome: 'Tiro Certeiro', custo: 2, req: 'c3', desc: 'Armas de distância causam mais dano. (Arcos e arcabuzes chegam nos próximos capítulos.)', soon: true, fx: () => {}},
  {id: 'c5', ramo: 'cacador', nome: 'Recarga Rápida', custo: 3, req: 'c4', desc: 'Recarrega armas de distância mais rápido. (Em breve.)', soon: true, fx: () => {}},

  {id: 'u1', ramo: 'guardiao', nome: 'Pele Dura', custo: 1, desc: '+15% de Saúde máxima.', fx: s => s.hpPct += 15},
  {id: 'u2', ramo: 'guardiao', nome: 'Resistir', custo: 1, req: 'u1', desc: 'Reduz em 60% o dano de um golpe. Recarga de 12 s.', fx: s => s.resistir = true},
  {id: 'u3', ramo: 'guardiao', nome: 'Vingança', custo: 2, req: 'u2', desc: 'Devolve 40% do dano de golpes corpo a corpo ao agressor.', fx: s => s.vinganca = true},
  {id: 'u4', ramo: 'guardiao', nome: 'Recurso', custo: 2, req: 'u3', desc: 'Uma vez por sala, ao zerar a Saúde, volta com 35%.', fx: s => s.recurso = true},
  {id: 'u5', ramo: 'guardiao', nome: 'Análise de Técnicas', custo: 3, req: 'u4', desc: 'Copia o ataque de um inimigo por alguns segundos. (Em breve.)', soon: true, fx: () => {}},

  {id: 'n1', ramo: 'natureza', nome: 'Herbário', custo: 1, desc: 'Itens de cura curam 35% a mais. +10% de sorte nos drops.', fx: s => { s.curaPct += 35; s.sorte += 10; }},
  {id: 'n2', ramo: 'natureza', nome: 'Fazer Poções', custo: 1, req: 'n1', desc: 'Toda poção fabricada na Bancada rende uma unidade a mais.', fx: s => s.pocoes = true},
  {id: 'n3', ramo: 'natureza', nome: 'Venenos', custo: 2, req: 'n2', desc: 'Runas de Veneno ganham +1 nível.', fx: s => s.venenoBonus += 1},
  {id: 'n4', ramo: 'natureza', nome: 'Receptador de Energia', custo: 2, req: 'n3', desc: 'Projéteis que te atingem causam 50% do dano e te dão +10 de Fôlego.', fx: s => s.receptador = true},
  {id: 'n5', ramo: 'natureza', nome: 'Cura Profunda', custo: 3, req: 'n4', desc: 'A Árvore dos Antigos limpa 100% da mutação e a marca cresce 40% mais devagar.', fx: s => { s.curaProfunda = true; s.marcaPct -= 40; }},

  {id: 't1', ramo: 'tanatau', nome: 'Fôlego Ampliado', custo: 1, desc: '+25 de Fôlego Tanataú máximo.', fx: s => s.folegoMax += 25},
  {id: 't2', ramo: 'tanatau', nome: 'Tolerância', custo: 1, req: 't1', desc: 'A mutação corta 25% menos a Saúde máxima.', fx: s => s.mutCortePct += 25},
  {id: 't3', ramo: 'tanatau', nome: 'Troca Instintiva', custo: 2, req: 't2', desc: 'Troca de Tanataú sem custo. (Faz efeito a partir do capítulo 2.)', soon: true, fx: () => {}},
  {id: 't4', ramo: 'tanatau', nome: 'Marca Menor', custo: 2, req: 't3', desc: 'A marca permanente da mutação cresce 50% mais devagar.', fx: s => s.marcaPct -= 50},
  {id: 't5', ramo: 'tanatau', nome: 'Domínio', custo: 3, req: 't4', desc: 'Poderes de Tanataú gastam 25% menos Fôlego.', fx: s => s.poderCustoPct += 25}
];

/* Classes: estilo de luta, bônus, talento inicial gratuito e habilidade ativa (tecla F / RT) */
const CLASSES = {
  barbaro:  {nome: 'Bárbaro', emoji: '🪓', arma: 'machado', talento: 'g1', skill: 'Golpe Brutal', skillCost: 30,
             passado: 'Lenhador das tribos do norte, o seu povo já fora expulso uma vez, e agora foi de novo.',
             desc: 'Força bruta. Começa com machado, mais Saúde, mas é mais lento.',
             bonus: ['+10% Saúde', '-5% velocidade de movimento', 'Talento inicial: Golpe Forte'],
             skillDesc: 'Golpe Brutal: um golpe pesado à frente, com enorme dano, que arremessa os inimigos (30 Fôlego).',
             fx: s => { s.hpPct += 10; s.velMove -= 0.05; }},
  cacador:  {nome: 'Caçador', emoji: '🏹', arma: 'espada', talento: 'c1', skill: 'Investida', skillCost: 14,
             passado: 'Batedor da expedição, foi você quem guiou todos até um portão que já estava trancado.',
             desc: 'Ágil e preciso. Ataca rápido e esquiva gastando menos Fôlego.',
             bonus: ['+8% velocidade de ataque', 'Esquiva recarrega mais rápido', 'Talento inicial: Passo Leve'],
             skillDesc: 'Investida: avanço veloz que atravessa os inimigos, com invulnerabilidade breve e dano leve (14 Fôlego).',
             fx: s => { s.velAtq += 0.08; s.dodgeCdMult = 0.65; }},
  guardiao: {nome: 'Guardião', emoji: '🛡️', arma: 'espada', talento: 'u1', skill: 'Escudo de Guerra', skillCost: 30,
             passado: 'Guarda da muralha, foi expulso por recusar o aço contra a própria gente.',
             desc: 'Defesa extraordinária. Resiste a golpes e protege com o escudo.',
             bonus: ['+10 de defesa', '-5% velocidade de ataque', 'Talento inicial: Pele Dura'],
             skillDesc: 'Escudo de Guerra: por 2 s reduz 70% do dano recebido (30 Fôlego).',
             fx: s => { s.defBonus += 10; s.velAtq -= 0.05; }},
  cacique:  {nome: 'Cacique', emoji: '🌿', arma: 'cajado', talento: 'n1', skill: 'Névoa Debilitante', skillCost: 28,
             passado: 'Ancião das ervas, já conhecia a floresta e os monges, e ninguém quis ouvir o seu aviso.',
             desc: 'Mestre das ervas e dos espíritos. Luta com cajado e começa com mais itens e uma runa de Veneno.',
             bonus: ['+20 Fôlego máximo', '-5% de dano', 'Começa com runa de Veneno e mais ervas'],
             skillDesc: 'Névoa Debilitante: envenena, deixa lentos e vulneráveis (+30% de dano recebido) os inimigos próximos por 5 s (28 Fôlego).',
             fx: s => { s.folegoMax += 20; s.danoPct -= 5; }}
};

const ENEMIES = {
  lobo:    {nome: 'Lobo Faminto',   emoji: '🐺', w: 34, h: 22, hp: 48, xp: 18, coins: [2, 6],   fraq: {fogo: 1.3}, res: {}},
  soldado: {nome: 'Soldado do Império', emoji: '🛡️', w: 24, h: 34, hp: 90, xp: 28, coins: [5, 12],  fraq: {}, res: {veneno: 0.6}},
  besta:   {nome: 'Besteiro', emoji: '🏹', w: 24, h: 34, hp: 58, xp: 24, coins: [5, 11], fraq: {}, res: {}},
  cacador: {nome: 'Caçador do Extermínio', emoji: '🧔', w: 28, h: 42, hp: 880, xp: 160, coins: [110, 130], fraq: {fogo: 1.25}, res: {veneno: 0.5}, boss: true}
};

/* abertura em cenas: scene escolhe o desenho, warm = tom quente de memória, snow = nevasca */
const STORY_SLIDES = [
  {scene: 'vila', warm: 1, snow: 0, txt: 'Dentro de altas muralhas, um rei protegia o seu povo da civilização lá de fora. Ele sabia que viria um inverno rigoroso, e por isso mandava expedições buscar alimento e suprimentos para guardar.'},
  {scene: 'ceu', warm: 0, snow: 2, txt: 'O inverno chegou, e os estoques começaram a acabar. Então os senhores das terras organizaram a maior expedição de todas, com um plano que ninguém contou aos que partiram.'},
  {scene: 'muralha', warm: 0, snow: 2, txt: 'Quando a expedição saiu, os portões foram trancados atrás dela. Setenta por cento do povo foi deixado lá fora para morrer, para que os de dentro sobrevivessem. Muitos voltaram até a muralha. Os portões nunca se abriram.'},
  {scene: 'lobo', warm: 0, snow: 1, txt: 'Alguns sobreviveram e se embrenharam na floresta. Lá, encontraram os Tanataús, monges que aprenderam poderes especiais vivendo entre os animais: o Lobo, o Cisne, a Fênix. Eles acolheram os expulsos e os treinaram.'},
  {scene: 'mutacao', warm: 0, snow: 1, txt: 'Quem devia ter morrido ficou mais forte. Mas todo poder cobra o seu preço: quem usa o dom dos animais muta, e há quem nunca volte a ser gente.'},
  {scene: 'cacador', warm: 0, snow: 1, txt: 'O rei soube que eles viviam, e quer apagar o passado. Criou o Extermínio, caçadores de Tanataús e de seus discípulos. Os sobreviventes, porém, se preparam para tomar o reino de volta.'},
  {scene: 'heroi', warm: 0, snow: 1, txt: '{passado} Você sobreviveu, {nome}, e agora está sozinho entre as cinzas de uma vila de expulsos. Mas algo dentro de você já está acordando.'},
  {scene: 'capitulo', warm: 0, snow: 1, card: ['CAPÍTULO I', 'VILA DESTRUÍDA']}
];

/* Falas avulsas que disparam uma vez, quando o herói passa do ponto x (em blocos). who 'H' = o herói */
const TRIGGERS = [
  {id: 'rua', x: 42, lines: [
    {who: 'H', txt: 'A rua inteira queimou. Os telhados caíram para dentro, como se alguém tivesse esmagado as casas.'},
    {who: 'H', txt: 'Aquele fosso adiante... alguém cavou para segurar os cavalos do Extermínio. Melhor pular com cuidado.'}]},
  {id: 'mercado', x: 88, lines: [
    {who: 'H', txt: 'Soldados do Império, patrulhando um mercado vazio. Eles não estão pilhando. Estão procurando alguém.'},
    {who: 'H', txt: 'Natalie falou de um altar por aqui. Se o Lobo ainda atende, eu preciso dele.'}]},
  {id: 'poco', x: 122, lines: [
    {who: 'H', txt: 'Um poço fundo, e as paredes têm marcas de garra. Alguma coisa subia por aqui, e subia depressa.'},
    {who: 'H', txt: 'Com o poder de Canis eu consigo me agarrar na parede e saltar. É só manter o ritmo.'}]},
  {id: 'arena', x: 158, lines: [
    {who: 'H', txt: 'Fumaça de acampamento. E um cheiro doce, de carne curada... Não quero saber de onde vem.'},
    {who: 'H', txt: 'Há uma Árvore dos Antigos logo à frente. Vou descansar sob ela antes de entrar lá.'}]}
];

/* Objetos para ler (E). Posição em blocos; y = nível do chão onde ficam */
const NOTES = [
  {id: 'cartaz', x: 16, y: 28, nome: 'Cartaz', lines: [
    {who: 'Cartaz do Extermínio', txt: 'PROCURAM-SE: Tanataús e discípulos. Recompensa de duzentas moedas de ouro por cabeça, viva ou não.'},
    {who: 'Cartaz do Extermínio', txt: 'Quem abrigar um deles terá a casa queimada. Em nome do Rei, o Comandante Valdemar.'},
    {who: 'H', txt: 'Alguém rabiscou um lobo por cima do selo. E por baixo escreveu: "ainda estamos aqui".'}]},
  {id: 'diario', x: 46, y: 28, nome: 'Diário', lines: [
    {who: 'Diário de um aldeão', txt: 'Nos deram sacos de grão para duas semanas e mandaram sair em expedição. Quando olhei para trás, os portões da muralha já estavam fechando.'},
    {who: 'Diário de um aldeão', txt: 'Batemos por três dias. Ninguém abriu. Foi a primeira vez que entendi que não era uma expedição, era uma sentença.'},
    {who: 'Diário de um aldeão', txt: 'Construímos esta vila com o que sobrou. Os monges de pelo e garra nos ensinaram a ficar de pé. Hoje vieram homens de armadura perguntando por eles. Eles acharam a vila sem procurar. Alguém contou, e eu não tenho coragem de escrever o nome. Se alguém ler isto: o rei quer que a gente nunca tenha existido.'}]},
  {id: 'estatua', x: 92, y: 28, nome: 'Estátua', lines: [
    {who: 'Estátua de Canis', txt: 'O Lobo não manda na matilha. Ele corre à frente e abre caminho. Quem o segue aprende a não ter medo da noite.'},
    {who: 'Estátua de Canis', txt: 'Mas toda corrida cobra o seu fôlego. E o corpo de quem corre muito, um dia, esquece como parar.'}]},
  {id: 'bilhete', x: 134, y: 18, nome: 'Bilhete', lines: [
    {who: 'Bilhete amassado', txt: 'Ordem do Caçador: ninguém sobe o Poço. Quem escapar da vila passa por aqui, e ele quer cada um vivo, para os troféus.'},
    {who: 'Bilhete amassado', txt: 'P.S.: o Caçador não dorme mais. Dizem que ele guarda no peito o dente do último lobo que matou. Não olhem nos olhos dele.'}]},
  {id: 'trofeus', x: 166, y: 28, nome: 'Troféus', lines: [
    {who: 'Parede de Troféus', txt: 'Peles de lobo. Penas de cisne, brancas, presas com pregos. Uma pena de fogo, ainda quente, que ninguém sabe dizer de quê.'},
    {who: 'Parede de Troféus', txt: 'No meio dos troféus, presa por um prego, uma fita azul de cabelo. Não está desbotada. É nova.'},
    {who: 'H', txt: 'É o par da minha. Lia... ela esteve aqui, e eles a levaram viva. Se tivessem matado, não guardariam a fita limpa.'},
    {who: 'H', txt: 'Cada troféu foi um monge, e cada monge tinha um nome. Eu vou aprender todos eles. Começando pelo dela.'}]}
];

const CONTROLS = [
  ['Mover', 'A / D  ou  setas  ·  analógico esquerdo'],
  ['Pular', 'Espaço  ·  A'],
  ['Atacar', 'Botão esquerdo do mouse  ou  J  ·  X'],
  ['Atacar para cima / baixo', 'Segure W / S (no ar, para baixo) e ataque'],
  ['Poder de Tanataú', 'Botão direito do mouse  ou  K  ·  Y'],
  ['Habilidade da classe', 'F  ·  B'],
  ['Fúria bestial (liga/desliga)', 'G  ·  LT'],
  ['Esquiva (grátis)', 'Shift  ou  L  ·  RT'],
  ['Interagir', 'E  ·  A perto de algo'],
  ['Raiz de Cura / Rímora', 'Q / R  ·  LB / RB'],
  ['Pausa', 'Esc  ou  P  ·  Start']
];

/* Lembranças: brilho azul no cenário; flashbacks que revelam o passado. Cinco por capítulo (lines pode ser função) */
const MEMORIAS_C1 = [
  {id: 'm1', mem: true, x: 28, y: 28, nome: 'A fita azul', resumo: 'O dia do portão. Você soltou a mão de Lia.', lines: () => [
    {who: 'Lembrança', txt: CLASSES[P.classe].passado},
    {who: 'Lembrança', txt: 'O portão rangia. A multidão empurrava, e você segurava a mão pequena de Lia com toda a força.'},
    {who: 'Lia', txt: 'Fica comigo! Não me solta!'},
    {who: 'Lembrança', txt: 'Ela tirou a fita azul do cabelo e enfiou na sua mão. "Guarda pra mim", pediu. Foi a última coisa que a sua mão sentiu dela.'},
    {who: 'H', txt: 'Eu soltei. Eu soltei a mão dela.'}]},
  {id: 'm2', mem: true, x: 56, y: 28, nome: 'O pão repartido', resumo: 'A mãe que mentiu "eu já comi".', lines: [
    {who: 'Lembrança', txt: 'Terceiro dia do lado de fora. Só havia meio pão, e a sua mãe o repartiu em três.'},
    {who: 'Mãe', txt: 'Eu já comi, meu bem. Podem ficar com o meu pedaço.'},
    {who: 'Lembrança', txt: 'Ela não tinha comido. Não passou da segunda noite de neve.'},
    {who: 'H', txt: 'Foi ali que eu aprendi que a gente também mente por amor.'}]},
  {id: 'm3', mem: true, x: 102, y: 28, nome: 'O martelo do Ferrão', resumo: 'O ferreiro que não cobrou a sua primeira lâmina.', lines: [
    {who: 'Lembrança', txt: 'Na forja desta vila, o ferreiro Ferrão ria alto e batia o ferro até ele cantar. Foi ele quem fez a sua primeira lâmina.'},
    {who: 'Ferrão', txt: 'Não é pra pagar, criança. Ferro bom é o que volta inteiro pra casa.'},
    {who: 'H', txt: 'Na noite do ataque ele sumiu. Eu nunca achei o corpo. Nem aqui, nem na forja.'}]},
  {id: 'm4', mem: true, x: 146, y: 18, nome: 'A mão na muralha', resumo: 'Valdemar levanta a mão. Uma capa verde salta a muralha.', lines: [
    {who: 'Lembrança', txt: 'Do alto do portão, um homem de armadura levantou a mão. Os guardas obedeceram, e as portas se fecharam. Capitão Valdemar.'},
    {who: 'Lembrança', txt: 'Ao lado dele, uma mulher de capa verde subiu no parapeito e saltou para o lado de fora, para dentro da neve e do escuro.'},
    {who: 'Lembrança', txt: 'Valdemar gritou um nome de mulher, e a voz dele quebrou no meio.'},
    {who: 'H', txt: 'Uma capa verde... Eu já vi aquela capa em algum lugar.'}]},
  {id: 'm5', mem: true, needBoss: true, x: 192, y: 28, nome: 'A cantiga de Lia', resumo: 'A cantiga que Lia cantava para dormir.', lines: [
    {who: 'Lembrança', txt: 'Todas as noites Lia cantava a mesma cantiga do reino, baixinho, até o frio ceder um pouco.'},
    {who: 'Lia', txt: 'Lobo, lobo, volta cedo; a neve cobre o medo. Se a noite for comprida, canta que eu te acho, na ida e na vinda.'},
    {who: 'H', txt: 'Se ela estiver viva, vai estar cantando. Eu vou te achar, Lia. Dessa vez eu não solto.'}]}
];


/* Tutorial guiado sobre o HUD. rect em coordenadas do canvas da interface (960x540); 'mapa' é calculado na hora */
const TUT_STEPS = [
  {rect: [13, 13, 306, 24], title: 'Vida (barra vermelha)', txt: 'Quando chega a zero, você cai. Ao cair, perde as moedas e o XP no local: volte lá para recuperar. A parte roxa na ponta direita é Saúde máxima que a mutação cortou, e a parte escura é a Marca permanente.'},
  {rect: [13, 35, 330, 16], title: 'Fôlego Tanataú (barra verde)', txt: 'É a energia dos seus poderes. Só as habilidades gastam Fôlego: o poder do Tanataú ({power}), a habilidade da classe ({skill}) e a ativação da Fúria ({berserk}). A esquiva ({dodge}) não gasta nada, só tem uma pequena recarga. O Fôlego volta sozinho quando você para de usar habilidades.'},
  {rect: [13, 49, 330, 12], title: 'Mutação (barra roxa)', txt: 'Sobe toda vez que você usa um poder de Tanataú ou ativa a Fúria. Quanto mais alta, menor a sua Vida máxima. Descansar na Árvore dos Antigos limpa quase toda a mutação, mas deixa uma Marca permanente que cresce devagar.'},
  {rect: [13, 63, 150, 26], title: 'Nome, nível e XP', txt: 'Derrotar inimigos dá XP (barra amarela). Cada nível dá 2 pontos de talento, que você gasta na Árvore de Talentos, na Árvore dos Antigos.'},
  {rect: [134, 62, 76, 22], title: 'Moedas', txt: 'Inimigos e baús dão moedas. Elas pagam a evolução das armas e armaduras no ferreiro, e a redistribuição dos talentos.'},
  {rect: [13, 88, 205, 26], title: 'Itens de uso rápido', txt: '{heal} usa a Raiz de Cura (recupera Vida). {rimora} usa a Rímora (recupera Fôlego). Ervas, ferro e aço aparecem na pausa, na aba Itens, e servem para fabricar e evoluir.'},
  {rect: [326, 14, 106, 74], title: 'Poderes e habilidade', txt: '{power} é o poder de Tanataú: Garra Lupina, depois que você despertar o Canis. {skill} é a habilidade da sua classe. O anel em volta do ícone mostra a recarga. Poderes enchem a barra de mutação.'},
  {rect: [428, 14, 50, 74], title: 'Fúria bestial', txt: 'Depois de despertar o Canis, {berserk} liga a Fúria: dano, velocidade de ataque, velocidade de movimento e defesa sobem 50%, mas a Vida é consumida sem parar. Aperte de novo para encerrar. Se a Vida chegar a zero, você vira 100% animal (um lobo) e só volta ao normal ao tocar uma Árvore dos Antigos.'},
  {rect: 'mapa', title: 'Minimapa', txt: 'Mostra as áreas da fase. Os quadrados acendem conforme você explora, e o ponto brilhante é você. Um traço verde marca uma Árvore dos Antigos.'},
  {rect: null, title: 'Árvore dos Antigos', txt: 'Chegue perto de uma Árvore dos Antigos e aperte {interact}. Ali você descansa (salva o jogo, cura, limpa a mutação e os inimigos reaparecem), gasta pontos de talento, usa o ferreiro e troca de arma e armadura. É o único lugar para trocar equipamento.'},
  {rect: null, title: 'Combate', txt: 'Ataque com {attack}, em combo de três golpes. Segure cima ou baixo para atacar para cima ou para baixo. A esquiva ({dodge}) dá um instante de invulnerabilidade. Inimigos têm postura: golpes seguidos os atordoam, mas eles resistem a ficar atordoados sem parar.'},
  {rect: null, title: 'Explorar', txt: 'Chamas azuis são lembranças do seu passado: aproxime-se e aperte {interact}. Cartazes e diários contam a história. Baús dão itens e runas, e algumas paredes rachadas escondem segredos. Quando o Canis despertar, você poderá se agarrar nas paredes e saltar.'}
];


/* Identidade de cada Tanataú: cor, animal e espírito. Usada pela Fúria (cores de tela, aura, barra de vida).
   rgb/claro = componentes "r,g,b" para rgba(); sprite = folha do espírito (por enquanto só o lobo existe) */
const TANATAUS = {
  canis:  {nome: 'Canis',  animal: 'Lobo',  cor: '#4fe6d2', rgb: '60,225,205',  claro: '#c4fff6', claroRgb: '196,255,246', escuro: '#0a4a46', sprite: 'lobo'},
  cygnus: {nome: 'Cygnus', animal: 'Cisne', cor: '#9fd8ff', rgb: '150,210,255', claro: '#f2fbff', claroRgb: '242,251,255', escuro: '#1c4a78', sprite: 'lobo'},
  bennu:  {nome: 'Bennu',  animal: 'Fênix', cor: '#ffb040', rgb: '255,160,50',  claro: '#fff0b8', claroRgb: '255,240,184', escuro: '#7a2c0a', sprite: 'lobo'}
};
/* o Tanataú escolhido pelo jogador (hoje só o Canis existe) */
const TAN = () => TANATAUS[(typeof P !== 'undefined' && P && P.tanatau) || 'canis'];

/* dificuldade: dano dos inimigos em cima do jogador */
const ENEMY_DMG = 1.18;
