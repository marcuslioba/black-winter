# Inverno Sombrio — Documento de Design (v0.1)

Metroidvania hack and slash em plataforma lateral 2D, para navegador (HTML/JS + canvas), de 1 a 4 jogadores em co-op (rede local e mesmo PC).
Baseado no cenário de Marcus Lioba. **Sem as regras SAGA**: o combate é em tempo real.

## Decisões fechadas

| Tema | Decisão |
|---|---|
| Gênero e visão | Metroidvania hack and slash, plataforma lateral |
| Plataforma | Navegador no PC (arquivo HTML) |
| Visual | Pixel art gerada por código (sprites animados com contorno, iluminação dinâmica, cenário em camadas) no estilo Dead Cells. Emojis só na interface |
| Controles | Teclado para mover; mouse para atacar; suporte a gamepad |
| Ataque (mouse) | Ataca para o lado em que o personagem está virado; o cursor não importa |
| Combate | Combo de 3 golpes, golpe para cima e para baixo, esquiva sem custo (só recarga) |
| Barras | **Saúde** e **Fôlego Tanataú** (só as habilidades gastam: poderes de Tanataú, habilidade da classe e Fúria; a esquiva é grátis) |
| Mutação | Cada ataque ou golpe especial de Tanataú enche a **barra de mutação**; ela corta a **Saúde máxima** |
| Mutação — reversão | A Árvore dos Antigos limpa quase tudo e deixa uma **marca da mutação** permanente, com piso mínimo de Saúde garantido |
| Mutação — visual | O corpo ganha traços do animal por níveis; a história e os NPCs reagem |
| Poder de exploração | **Livre**: não gera mutação. Só ataques e golpes especiais mutam |
| Tanataús | Um desbloqueado por capítulo; depois o jogador troca a qualquer momento |
| Classes | O jogador escolhe no início: Bárbaro, Caçador, Guardião ou Cacique. Cada uma muda arma inicial, bônus e a habilidade da tecla F. Os talentos continuam livres |
| Estrutura | 3 capítulos; cada um é um mapa interligado (15 a 25 salas), com segredos e volta pela Árvore dos Antigos |
| Protagonista | Sobrevivente sem nome; o jogador escolhe o nome |
| Progressão | Níveis (100 XP), pontos de evolução e **árvore de talentos** (as ideias das classes do guia viram talentos) |
| Itens e economia | Conjunto enxuto, com moeda e ferreiro |
| Morte | Volta à Árvore dos Antigos; perde moedas e XP, que dá para recuperar no local |
| Salvamento | 3 espaços, automático nas Árvores dos Antigos (localStorage); minimapa das salas visitadas |
| Primeira entrega | Capítulo 1 jogável; depois os outros dois |

## Capítulos

| Cap. | Área | Tanataú ganho | Poder de exploração | Chefe |
|---|---|---|---|---|
| 1 | Vila Destruída | **Canis (Lobo)** | Corrida e salto na parede | Caçador do Extermínio |
| 2 | Geleira | **Cygnus (Cisne)** | Congela água e cria plataformas de gelo | Tanataú mutado (Anequim ou Telson) |
| 3 | Fortaleza do Império | **Bennu (Fênix)** | Derrete barreiras de gelo e dá impulso de fogo no ar | Comandante Valdemar |

## Poderes (tradução do guia para tempo real)
- **Canis:** regenera Saúde ao acertar golpes; golpe especial rápido.
- **Cygnus:** golpe que congela o inimigo por instantes.
- **Bennu:** deixa o alvo queimando (dano ao longo do tempo). Seu poder de **Cura Mutações** é o gancho do capítulo 3: permite purificar mutação em troca de um recurso.

## Itens (do guia, versão enxuta)
- Curas em 3 níveis: Raiz, Erva, Poção de Cura.
- Rímora: restaura Fôlego Tanataú.
- Antídoto (veneno).
- Elixires permanentes e raros (aumentam a Saúde máxima).
- Runas elementais (as joias do guia): ver a seção "Sistema de armas, evolução e runas".
- Ferreiro: evolui armas com Ferro, Aço, Brigandina e Damasco.

## Sistema de armas, evolução e runas

### Tipos de arma (6)
| Arma | Ritmo e alcance | Combo | Observação |
|---|---|---|---|
| Espada | Médio, alcance médio | 3 golpes | Equilibrada |
| Machado | Lento, golpe pesado | 2 golpes | Quebra escudos e barreiras frágeis |
| Lança | Médio, alcance longo | 3 estocadas | Acerta à distância e para cima |
| Manoplas | Rápido, alcance curto | 5 golpes | Combos longos, bom contra grupos |
| Arco | Disparo para o lado em que está virado | Tiro carregado | Gasta Fôlego por flecha |
| Arcabuz | Lento, tiro forte | 1 tiro, recarga | Dano alto, munição limitada |

Cada arma evolui separadamente. Troca-se de arma na Árvore dos Antigos.

### Evolução (ferreiro)
- **Ranks:** Ferro → Aço → Brigandina → Damasco, cada um exige materiais e moedas. O rank sobe dano, alcance ou velocidade e dá mais slots de runa.
- **Ramificação:** em cada rank o jogador escolhe uma de duas formas (por exemplo, mais dano ou mais velocidade). O visual e o nome da arma mudam.
- **Slots de runa:** Ferro 1, Aço 2, Brigandina 3, Damasco 4.

### Runas
- **Obtenção:** achadas no mapa, soltas por inimigos e chefes, e vendidas pelo ferreiro.
- **Nível:** 1 a 3. Fundir 3 runas iguais do mesmo nível gera uma de nível acima.
- **Engastar e remover:** de graça na Árvore dos Antigos. Nada se perde ao trocar.
- **Efeito:** o elemento da runa dá dano extra e um efeito de status. Mais runas do mesmo elemento aumentam a chance e a duração.

### Elementos (6, do guia)
| Elemento | Runa | Efeito |
|---|---|---|
| Fogo | Rubi | Queimadura (dano ao longo do tempo) |
| Água | Água-Marinha | Molhado; cura leve ao acertar |
| Ar | Esmeralda | Empurra e acelera o ataque |
| Terra | Ônix | Atordoa e quebra defesas |
| Veneno | Jade | Envenena (dano ao longo do tempo) |
| Físico | Opala | Mais dano bruto |

### Reações entre elementos
| Combinação | Reação |
|---|---|
| Fogo + Água | Vapor: cega o inimigo por instantes |
| Fogo + Veneno | Explosão tóxica: dano em área |
| Água + Ar | Gelo: congela o inimigo (combina com Cygnus) |
| Água + Veneno | Contágio: o veneno salta para inimigos próximos |
| Terra + Ar | Tempestade de areia: derruba e causa dano |
| Terra + Fogo | Lava: chão em chamas por alguns segundos |
Os inimigos têm fraquezas e resistências a elementos. Alguns chefes exigem uma reação para abrir a guarda. Os elementos também interagem com o mapa (fogo derrete barreira de gelo, água congela com gelo).

## Armaduras

### Estrutura
- **Conjuntos completos:** cada armadura é um conjunto único e inteiro, sem divisão em peças (capacete, peitoral etc.). O jogador equipa um conjunto por vez.
- **Foco dos bônus:** Fôlego Tanataú e mutação. A defesa base sobe só com o rank e o conjunto, sem sistema de peso.
- **Evolução:** no ferreiro, com os mesmos ranks das armas (Ferro, Aço, Brigandina, Damasco). O rank sobe a defesa e a intensidade dos bônus.
- **Runa de defesa:** 1 slot por conjunto. Dá resistência ao elemento da runa (ver "Runas").

### Conjuntos (proposta)
| Conjunto | Origem | Tema e bônus |
|---|---|---|
| Gibão do Sobrevivente | Inicial | Sem bônus especial. Defesa baixa |
| Couro de Lobo | Capítulo 1 (Canis) | Fôlego Tanataú regenera mais rápido; golpes de Canis curam um pouco mais |
| Pelagem do Cisne | Capítulo 2 (Cygnus) | Resistência a gelo e água; a mutação sobe mais devagar perto de gelo |
| Casco da Tartaruga | Capítulo 2 (Caretta, inimigos) | Reduz o ganho de mutação; mais defesa; esquiva com recarga maior |
| Brasas da Fênix | Capítulo 3 (Bennu) | Resistência a fogo; a Árvore dos Antigos limpa mais mutação; golpes de Bennu queimam por mais tempo |
| Couraça do Extermínio | Capítulo 3 (Império) | Defesa alta e Saúde alta, mas a mutação sobe mais rápido e o Fôlego regenera devagar |
| Escamas do Tubarão | Chefe do capítulo 2 | A mutação aumenta o dano: quanto mais mutado, mais forte, com menos Saúde máxima |

Cada conjunto muda de visual conforme o nível de mutação (traços do animal).

## Árvore de talentos

### Regras
- **5 ramos** de nós ligados: um nó só abre se o anterior do ramo estiver comprado. Os talentos vêm das classes do guia.
- **Pontos:** número fixo por nível (proposta: 2 pontos por nível; 100 XP por nível). Cada nó custa 1 a 3 pontos.
- **Redistribuição:** possível, **pagando moedas**, na Árvore dos Antigos. O custo sobe com o nível do personagem (proposta: 20 moedas × nível) e devolve todos os pontos.
- Os talentos não substituem os atributos: o jogo não tem FOR/DES/INT, tudo vem da árvore, das armas e das armaduras.

### Ramos (proposta de nós, em ordem)
| Ramo | Origem no guia | Nós |
|---|---|---|
| **Guerreiro** | Bárbaro, Lutador, Gladiador | 1. Golpe Forte (+dano) → 2. Chance de Combo (o combo acelera a cada acerto) → 3. Bravata (golpe que arremessa o inimigo) → 4. Ódio (dano sobe quando a Saúde está baixa) → 5. Fusão Espírito/Arma (a runa da arma ganha +1 nível) |
| **Caçador** | Caçador, Atirador | 1. Passo Leve (+velocidade) → 2. Ataque Surpresa (dano extra em inimigo desprevenido) → 3. Olfato e Visão (mostra segredos e inimigos no minimapa) → 4. Tiro Certeiro (armas de distância causam mais dano) → 5. Recarga Rápida |
| **Guardião** | Guardião, Mercenário | 1. Pele Dura (+Saúde) → 2. Resistir (reduz o dano de um golpe, com recarga) → 3. Vingança (devolve parte do dano ao agressor) → 4. Recurso (uma vez por sala, ao zerar a Saúde, recupera parte dela) → 5. Análise de Técnicas (copia o ataque de um inimigo por alguns segundos) |
| **Natureza** | Cacique, Médium | 1. Herbário (itens de cura curam mais) → 2. Fazer Poções (cria Raízes e Ervas na Árvore dos Antigos com materiais) → 3. Venenos (runa de Veneno ganha +1 nível) → 4. Receptador de Energia (absorve projéteis e devolve como dano) → 5. Cura Profunda (a Árvore dos Antigos limpa mais mutação) |
| **Tanataú e Mutação** | Tanataús do guia | 1. Fôlego Ampliado (+Fôlego máx.) → 2. Tolerância (a mutação corta menos a Saúde máxima) → 3. Troca Instintiva (troca de Tanataú sem custo) → 4. Marca Menor (a marca permanente da mutação cresce mais devagar) → 5. Domínio (os golpes especiais gastam menos Fôlego). Cada Tanataú ganha ainda 3 talentos próprios, que abrem conforme o capítulo. |

Os nós finais (5) dão efeitos raros e só abrem depois dos 4 anteriores.

## Co-op em rede local (LAN) e no mesmo PC (1 a 4 jogadores)

### Conexão
- **Somente rede local (LAN):** os jogadores precisam estar na mesma rede (Wi-Fi ou cabo). Não há online pela internet nesta versão.
- **Anfitrião:** um jogador roda um **servidor local pequeno (Node.js)** no PC dele. O servidor serve o jogo e sincroniza os jogadores. Os convidados abrem o endereço mostrado pelo anfitrião (por exemplo `http://192.168.0.10:3000`) no navegador. Um arquivo HTML aberto direto do disco **não** consegue hospedar partida; por isso o servidor é necessário.
- **Salas:** o anfitrião cria a sala e informa o endereço ou um código curto; até **4 jogadores no total** na sala.
- **Local + rede juntos:** cada PC pode ter 1 ou 2 jogadores locais (teclado e mouse mais um gamepad, ou gamepads). A sala soma no máximo 4.
- **Autoridade:** o servidor do anfitrião roda a simulação (inimigos, dano, loot). Os clientes enviam os controles e desenham o estado recebido. Isso evita divergências entre os PCs.

### Regras de jogo
- **Ficha própria:** cada jogador tem nome, Saúde, Fôlego Tanataú, mutação, armas, armaduras, runas, moedas, XP e árvore de talentos próprios.
- **Mapa compartilhado:** salas, segredos, Árvores dos Antigos e chefes são os mesmos para todos. Os baús e itens do chão são de quem pegar primeiro. As moedas e o XP vão para quem derrotou o inimigo.
- **Tanataús:** cada jogador escolhe o seu e muta por conta própria. Podem usar o mesmo Tanataú. O poder de exploração de qualquer jogador abre o caminho para o grupo.
- **Reações de elemento** funcionam entre jogadores: elementos de ataques de jogadores diferentes reagem entre si.
- **Fogo amigo:** desligado.
- **Entrada e saída:** um jogador pode entrar ou sair durante a partida. Ao entrar, aparece na sala atual ou na Árvore dos Antigos.

### Câmera e tela
- Câmera que segue o grupo, com zoom que abre quando os jogadores se afastam, até um limite. Cada PC mostra a sua tela, centrada no grupo.
- Se um jogador ficar muito longe, é levado ao jogador mais próximo depois de alguns segundos.
- A interface mostra as barras (Saúde, Fôlego, mutação) de cada jogador, com cor e emoji do jogador.

### Queda e reviver
- Quando a Saúde de um jogador zera, ele cai. Um aliado o revive segurando o botão de interação por alguns segundos.
- Se **todos** caírem, o grupo volta à última Árvore dos Antigos, e cada jogador perde suas moedas e XP, que podem ser recuperados no local da queda (cada um recupera o seu).

### Árvore dos Antigos e salvamento
- **Anfitrião:** guarda o save do grupo (mapa, chefes derrotados, Árvores dos Antigos, progresso da história) em 3 espaços. Quando o anfitrião salva, a sala salva.
- **Convidado:** guarda a **própria ficha** (talentos, armas, armaduras, runas, moedas) no navegador dele e leva a ficha para qualquer sala que entre. O progresso da história e o mapa ficam com o anfitrião.
- Cada jogador usa o ferreiro, a árvore de talentos e a troca de runas pelo próprio menu. Enquanto um jogador usa o menu, o jogo continua para os outros, mas o personagem dele fica parado e protegido.

### Equilíbrio
- Inimigos e chefes ganham Saúde e agressividade conforme o número de jogadores (proposta: +60% de Saúde por jogador extra).
- Chefes podem ter fases que exigem ações em dupla (por exemplo, duas reações de elemento ao mesmo tempo).

### Riscos técnicos
- Um navegador não abre servidor. O anfitrião precisa ter Node.js instalado e executar um comando (ou um atalho `.bat` que vou fornecer).
- O firewall do Windows pode pedir permissão na primeira vez.
- A ficha do convidado fica no navegador dele; se ele limpar os dados do navegador, perde a ficha (posso adicionar exportar e importar ficha).

## Inimigos
- Feras do inverno (lobos).
- Soldados do Império e do Extermínio (espada, besta e arma de fogo).
- Tanataús renegados.
- Os outros Tanataús (Tarpan, Colubra, Telson, Dinictis, Caretta, Anequim, Lorenzini) aparecem só como inimigos e chefes.

## História (resumo)
Um rei vivia dentro de muralhas, protegido da civilização de fora. Sabendo de um inverno rigoroso, mandava expedições coletar alimento e suprimentos. Quando os estoques começaram a acabar, os senhores das terras organizaram uma grande expedição com um plano oculto: trancar os portões atrás dela para que o povo morresse lá fora e os de dentro sobrevivessem (cerca de 70% da população). Muitos morreram tentando voltar. Alguns sobreviveram e foram viver na floresta, onde descobriram os poderes dos animais com os **Tanataús**, monges que aprenderam habilidades especiais vivendo com eles. Treinados pelos monges, os sobreviventes ficaram mais fortes e se preparam para tomar o reino de volta. O rei, sabendo disso, criou o **Extermínio** para caçá-los e apagar o passado. Usar o poder de Tanataú **muta** o corpo. O jogador é um dos expulsos. A **Natalie** é a NPC guia: ela se sacrifica no fim e renasce como **Elohim**, gancho para uma sequência.

## Pendências (valores propostos por mim, para você ajustar)
- Números de balanceamento (dano, Saúde, quanto cada poder muta, preços) e nomes das salas.
- Nome do sobrevivente: escolhido pelo jogador.
- Falas e roteiro de cada capítulo.
## Fúria bestial (modo berserk)
- **Ativação:** tecla G / LT (L2), depois de despertar um Tanataú (hoje o Canis). Custa 25 de Fôlego e sobe a mutação em 12. Apertar de novo encerra.
- **Efeito:** dano, velocidade de ataque, velocidade de movimento, defesa e regeneração de Fôlego sobem **50%**. Em troca, a **Vida é consumida** sem parar (8% da máxima por segundo, cerca de 12 s do máximo até zero).
- **Forma animal:** se a Vida chegar a zero, o herói vira **100% animal** (o lobo do Canis). A Vida fica em **zero** e o animal tem uma barra de **instinto** (30% da Vida máxima): os golpes gastam o instinto e sobem a mutação em 4; se o instinto acabar, o herói cai. Ele mantém os bônus, mas não usa itens, poderes, habilidade nem interage com o mundo. **Só volta ao normal ao tocar uma Árvore dos Antigos** (volta com 40% da Vida).
- **Apresentação (na identidade do Tanataú):** música de ação própria (modo `fury` no áudio), tela com virada de cor **na cor do animal**, batimento nas bordas, linhas de velocidade, onda de choque, rastro e uma **aura com o espírito do animal** (translúcido, atrás do herói; maior e mais forte na forma animal). Canis: ciano, espírito de lobo.
- Cada novo Tanataú terá a sua Fúria com cor e animal próprios: Cygnus (azul-gelo, cisne) e Bennu (laranja-dourado, fênix). As cores e o espírito ficam em `TANATAUS` (data.js); falta apenas o sprite do espírito de cada um (por enquanto todos usam o lobo).

## Habilidades de classe (botão B / tecla F)
Bárbaro: Golpe Brutal. Caçador: Investida. Guardião: Escudo de Guerra. Cacique: Névoa Debilitante. Todas gastam Fôlego. A esquiva é separada e grátis (Shift/L, RT).
