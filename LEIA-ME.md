# Inverno Sombrio — estado do projeto

Metroidvania hack and slash 2D (plataforma lateral) em HTML/JS, baseado no cenário de RPG "Inverno Sombrio" de Marcus Lioba. Feito com o Claude.

## Como abrir o jogo
Dê dois cliques em `inverno-sombrio/index.html`. Roda no navegador, sem instalar nada e sem internet.

Controles: A/D mover · Espaço pular · mouse esquerdo ou J atacar (para o lado em que está virado; segure W/S para atacar para cima/baixo) · mouse direito ou K poder de Tanataú · Shift esquiva · F habilidade da classe · E interagir · Q/R curas · Esc pausa. Gamepad também funciona.

## O que já existe (versão inicial do Capítulo 1: Vila Destruída)
- Menu inicial, 3 espaços de save (automático nas Árvores dos Antigos), opções, controles, pausa.
- Escolha de classe: Bárbaro, Caçador, Guardião, Cacique (arma inicial, bônus e habilidade na tecla F).
- Combate: combo, golpes para cima/baixo, esquiva com Fôlego, poder do Canis (Garra Lupina), salto na parede e corrida.
- **Mutação:** poderes de Tanataú enchem a barra, que corta a Saúde máxima. A Árvore dos Antigos limpa quase tudo e deixa uma marca permanente.
- 5 áreas, 3 Árvores dos Antigos, baús, segredo atrás de parede quebrável, minimapa, altar do Canis, NPC Natalie.
- Inimigos: lobo, soldado, besteiro. Chefe: Caçador do Extermínio.
- Armas (espada, machado, lança, manoplas; lança e manoplas em baús das áreas 2 e 3) com ranks Ferro→Damasco e forma ramificada no Aço; runas de Fogo, Veneno e Físico, com fusão e a reação Fogo + Veneno; armaduras (Gibão, Couro de Lobo) com slot de runa.
- Árvore de talentos (5 ramos, 2 pontos por nível, redistribuir custa 20 moedas × nível).
- Visual em pixel art por código, com iluminação dinâmica. Música e efeitos gerados por código (Web Audio).

## Estrutura dos arquivos
- `inverno-sombrio/js/data.js`: armas, armaduras, runas, classes, talentos, inimigos, textos.
- `player.js`: ficha, atributos derivados, mutação, save/load.
- `level.js`: mapa do Capítulo 1.
- `game.js`: simulação (física, combate, IA, chefe, interações).
- `art.js` e `render.js`: pixel art, iluminação, HUD.
- `ui.js`: menus em HTML sobre o canvas.
- `audio.js`, `input.js`.
- `docs/design-inverno-sombrio.md`: **documento de design com todas as decisões** (leia primeiro).
- `docs/prompts-gemini-inverno-sombrio.md`: prompts para gerar artes conceituais no Gemini.
- `docs/guia-sprites.md` e `inverno-sombrio/js/sprites.js`: como gerar e colocar folhas de sprite (PNG) em `inverno-sombrio/assets/sprites/`; sem arquivo, o jogo usa o desenho por código.
- Visual do herói: `heroSheetKey` (js/sprites.js) escolhe a folha por classe, arma e armadura (`cls_<classe>`, `arm_<armadura>_<classe>`, `player_<arma>`). Para uma nova armadura, gere `arm_<id>_<classe>` nas quatro classes e adicione o id na lista do loop em sprites.js e em `tools/build-sprites.py`.
- `tools/build-sprites.py` + `tools/raw/`: imagens cruas geradas no Gemini e o script que remove o fundo magenta e monta as folhas em `inverno-sombrio/assets/sprites/` e `assets/bg/`. Rode `python tools/build-sprites.py` depois de trocar uma imagem crua.
- `tools/smoke-test.js`: teste sem navegador. Rode `node tools/smoke-test.js "<caminho>/inverno-sombrio"`.
- `tools/balance-test.js`: bot que luta contra os inimigos e o chefe com cada classe e mede vitórias e Saúde restante. Rode `node tools/balance-test.js "<caminho>/inverno-sombrio" 10`.

## Decisões importantes (resumo; detalhes no documento de design)
- Sem regras SAGA: combate em tempo real.
- 3 capítulos lineares; cada um é um mapa interligado com segredos. Um Tanataú novo por capítulo: Canis (Cap. 1), Cygnus (Cap. 2), Bennu (Cap. 3). Chefes: Caçador do Extermínio, Tanataú mutado (Anequim ou Telson), Comandante Valdemar.
- Termo oficial: **mutação** (não "maldição").
- Co-op: de 1 a 4 jogadores, em rede local (LAN) e no mesmo PC, com um servidor Node.js local do anfitrião. **Ainda não implementado.** Antes disso, separar a simulação do desenho.
- Natalie se sacrifica no fim e renasce como Elohim (gancho de sequência).

## O que falta / próximos passos
1. Testar uma partida inteira com cada classe e ajustar o equilíbrio (dano, vida, custos, preços).
2. Co-op em rede local e local.
3. Capítulos 2 (Geleira, Cygnus) e 3 (Fortaleza do Império, Bennu).
4. Armas restantes (arco, arcabuz), runas de Água, Ar e Terra e as outras reações.
5. Talentos marcados "em breve" (Tiro Certeiro, Recarga Rápida, Análise de Técnicas, Troca Instintiva).
6. Trocar a arte por sprites do Gemini, se você gerar as imagens.

## Como retomar com o Claude no outro computador
1. Copie esta pasta inteira para o outro computador (pendrive, nuvem ou Git com GitHub).
2. Abra o Claude Code (mesma conta) apontando para esta pasta.
3. Diga: "Leia o LEIA-ME.md e o docs/design-inverno-sombrio.md e vamos continuar o projeto." O Claude não leva os arquivos nem a conversa de um computador para o outro, então esses dois arquivos são o contexto.

## História, abertura e diálogos

- **Abertura em cenas:** `STORY_SLIDES` em `inverno-sombrio/js/data.js` (cada cena escolhe um desenho: `vila`, `ceu`, `lobo`, `mutacao`, `cacador`, `heroi`, `capitulo`). Enter/clique avança, Esc pula. O código está em `render.js` (`startCine`, `drawCine`).
- **Diálogos:** `startDialog([{who, txt}])` em `game.js`. `who: 'H'` vira o nome do herói. O retrato e a voz dependem de quem fala (`speakerKind`): herói, Natalie, Caçador, Canis; qualquer outro nome é narração (sem retrato).
- **Falas que disparam sozinhas:** `TRIGGERS` em `data.js` (uma vez por jogo salvo, quando o herói passa do bloco `x`).
- **Objetos para ler (E):** `NOTES` em `data.js` (cartazes, diários, estátuas); aparecem no mapa com um brilho enquanto não foram lidos.
- Para um capítulo novo, crie suas próprias listas e as ligue no `buildChapterN()` (`notes`) e no `checkTriggers()`.

## Árvore dos Antigos, tutorial e talentos

- **Árvore dos Antigos:** substitui a fogueira como ponto de descanso/salvamento. O sprite (dormente e desperta) está em `assets/sprites/arvore.png`, gerado por `python tools/build-tree.py` a partir de `tools/raw/arvore.jpeg`. O brilho, o balanço, as folhas e a onda de luz ao descansar são feitos em código (`drawTree` em `sprites.js`).
- **Tutorial guiado:** `TUT_STEPS` em `data.js` (um passo por barra ou mecânica, com o retângulo do HUD a destacar). Roda ao começar um jogo novo e pode ser revisto na aba Guia da pausa.
- **Árvore de Talentos:** ramificada, com a Árvore dos Antigos na base e um galho por ramo (`talents()` em `ui.js`). Setas: cima/baixo sobem e descem no galho, esquerda/direita trocam de galho.
- **Tela sem escurecimento:** a iluminação só soma brilho colorido (`lightPass` em `render.js`).
- **Objetos de cenário:** `assets/sprites/cenario.png` (baú, baú aberto, baú rúnico e aberto, altar dormente e desperto, placa, lampião), gerado por `python tools/build-cenario.py` a partir de `tools/raw/cenario.jpeg`. O baú rúnico aparece nos baús secretos, de chefe e de equipamento/runa. O altar acende ao se aproximar e fica meio aceso depois de despertar o Canis. Sem a imagem, o jogo usa o desenho por código.
- **Tiles do chão e das paredes:** `assets/sprites/tiles.png` (tijolos, neve com pingentes, plataforma, espinhos, parede quebrável, portão), gerado por `python tools/build-tiles.py` a partir de `tools/raw/tiles.jpeg`. Os tiles entram no atlas do jogo no lugar dos desenhados por código (`patchAtlas` em `sprites.js`).
- **Props do cenário:** `assets/sprites/props.png` (barril, caixotes, carroça, cerca, entulho, vigas queimadas, muro com arco, lápides, estandarte, bandeira, sacos, postes, chaminé), gerado por `python tools/build-props.py` a partir de `tools/raw/props.jpeg`. Os tipos sorteados pela fase estão em `initArt()` (render.js). Regra do projeto: prefira sempre sprites a desenhos feitos em código.

## Controles, Fôlego e Fúria

- **Botões por dispositivo:** o jogo detecta se você usou teclado ou controle por último e mostra o botão certo no HUD, nos prompts (ícone do botão, colorido no controle) e no tutorial. Xbox: A, B, X, Y, LB, RB, LT, RT; PlayStation: ✕, ○, □, △, L1, R1, L2, R2 (`Input.label` em `input.js`; nos textos use marcadores como `{interact}`).
- **Fôlego Tanataú:** só as habilidades gastam (poder, habilidade da classe e ativar a Fúria). A esquiva é grátis, só com recarga.
- **Fúria bestial:** G / LT. Detalhes em `docs/design-inverno-sombrio.md` (seção Fúria bestial) e no código (`toggleBerserk`, `enterFeral`, `endBerserk` em `game.js`; `drawFuryScreen`, `drawFeral` em `render.js`; modo `fury` em `audio.js`).
- **Habilidade da classe (F no teclado, B no controle):** Bárbaro, Golpe Brutal (golpe pesado à frente); Caçador, Investida (avanço veloz que atravessa inimigos); Guardião, Escudo de Guerra; Cacique, Névoa Debilitante (veneno, lentidão e +30% de dano recebido). A esquiva grátis fica em Shift/L e no RT. Perto de algo interativo, o A do controle só interage (não pula).

## Loot, fabricação e Bazar de Testes

- **Drops:** cada inimigo tem uma tabela em `DROPS` (data.js); a sorte (talentos, armadura, especiais, Elixir) multiplica as chances. Materiais e poções vêm até você; equipamento, runas e receitas ficam no chão com feixe de luz da raridade e são pegos com o botão de interação. O Caçador (Ferrão) sempre dropa o **Martelo do Ferrão**, que abre o rank Damasco.
- **Bancada** (Árvore dos Antigos): receitas básicas liberadas; as outras vêm de drops raros. **Ferreiro:** desmontar, fundir dois equipamentos iguais (+12% por fusão, 40% de chance de habilidade especial) e fundir 2 runas iguais.
- **Bazar de Testes:** NPC ao lado da Natalie, com tudo liberado e de graça.
- Lógica em `js/itens.js`; testes em `tools/smoke-test.js`.
- Pendente: ícones novos (`assets/sprites/icones2.png`, posições já definidas em `ICON2`) e o sprite do mercador (`assets/sprites/mercador.png`); por enquanto há emoji/gema e uma Natalie colorida como reserva.
