# Guia de sprites (Gemini ou Higgsfield) — Inverno Sombrio

O jogo usa folhas de sprite PNG se elas existirem em `inverno-sombrio/assets/sprites/`. Se faltar algum arquivo, ele usa o desenho feito por código. Dá para trocar um personagem por vez.

## Arquivos (nomes exatos)
`player.png` (ou `player_barbaro.png`, `player_cacador.png`, `player_guardiao.png`, `player_cacique.png` para uma folha por classe), `lobo.png`, `soldado.png`, `besta.png`, `cacador.png` (o chefe), `natalie.png`.

## Formato da folha
- **Células quadradas de 96×96 px.** Cada animação é uma **linha**, e os quadros ficam nas colunas, da esquerda para a direita.
- Personagem **virado para a direita**, de lado, **pés no centro-baixo da célula** (cerca de x=48, y=90). Altura do corpo cerca de 70 px.
- **Fundo transparente** (PNG com alpha). Sem sombra projetada no chão, sem texto, sem moldura.
- Mesmo desenho, mesma escala e mesmas cores em todos os quadros.

## Linhas, de cima para baixo
| Linha | Animação | Quadros |
|---|---|---|
| 0 | parado (idle) | 4 |
| 1 | correndo | 6 |
| 2 | pulo (subindo) | 1 |
| 3 | queda | 1 |
| 4 | golpe 1 (preparação, golpe, recuperação) | 4 |
| 5 | golpe 2 | 4 |
| 6 | golpe 3 (o mais forte) | 5 |
| 7 | esquiva (rolamento ou investida) | 2 |
| 8 | dano | 1 |
| 9 | agarrado na parede | 1 |
| 10 | poder especial (Canis) | 4 |

Os inimigos usam o mesmo formato, mas só precisam das linhas 0 (parado), 1 (andar), 4 (ataque), 8 (dano). O chefe também usa 5, 6, 7 (esquiva/preparação) e 2 (salto).

## Como gerar com IA
1. Gere primeiro **uma imagem de referência** do personagem (prompts do `docs/prompts-gemini-inverno-sombrio.md`).
2. Peça a folha anexando a referência. Prompt base:

```
Use the attached image as the character reference. Create a 2D pixel-art sprite sheet for a side-scrolling action game. Strict grid of square cells, 6 columns by 11 rows, every cell the same size, character always facing right, feet at the bottom center of each cell, same size and same colors in every frame, transparent background (or flat pure magenta #FF00FF background), no shadows, no text, no labels, no grid lines. Rows from top to bottom: 1 idle (4 frames), 2 run (6 frames), 3 jump rising (1), 4 falling (1), 5 sword attack 1 (4 frames), 6 sword attack 2 (4), 7 big sword attack 3 (5), 8 dodge roll (2), 9 hurt (1), 10 clinging to a wall (1), 11 wolf-spirit power dash (4). Dark fantasy winter style, strong rim light, outlined pixel art like Dead Cells.
```
3. IA costuma errar a grade. Se sair torta, gere **uma linha por vez** (ex.: "only the run cycle, 6 frames in one horizontal row") e eu monto a folha.
4. Se o fundo vier magenta ou branco, eu removo.

## Depois de gerar
Salve os PNG em `inverno-sombrio/assets/sprites/` com os nomes acima. Se o personagem aparecer grande ou pequeno demais, o ajuste é o campo `scale` em `inverno-sombrio/js/sprites.js`.
