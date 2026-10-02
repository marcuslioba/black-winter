"""Monta as folhas de sprite do jogo a partir das imagens cruas do Gemini (tools/raw/).
Uso: python tools/build-sprites.py
Remove o fundo magenta, normaliza a escala e reorganiza os quadros no formato do jogo
(células 96x96, uma animação por linha, ver docs/guia-sprites.md)."""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw')
OUT = os.path.join(ROOT, 'inverno-sombrio', 'assets', 'sprites')
CELL = 96
FOOT = (48, 90)


def key_out(im):
    """Remove o fundo magenta (com tolerância de JPEG) e devolve RGBA."""
    im = im.convert('RGB')
    px = im.load()
    out = Image.new('RGBA', im.size)
    po = out.load()
    for y in range(im.size[1]):
        for x in range(im.size[0]):
            r, g, b = px[x, y]
            m = min(r - g, b - g)
            if m <= 40:
                po[x, y] = (r, g, b, 255)
            elif m >= 95:
                po[x, y] = (0, 0, 0, 0)
            else:
                a = int(255 * (95 - m) / 55)
                po[x, y] = (24, 24, 36, a)
    return out


def cut(sheet, cols, rows):
    w, h = sheet.size
    cw, ch = w // cols, h // rows
    return lambda c, r: sheet.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch)), cw, ch


def build(name, raw, cols, rows, layout, foot_src, char_h, clean=()):
    """layout: lista de linhas; cada linha é uma lista de (coluna, linha) do arquivo cru.
    foot_src: (x, y) dos pés dentro da célula crua. char_h: altura do corpo em px na célula crua."""
    src = Image.open(os.path.join(RAW, raw)).convert('RGB')
    for (x0, y0, x1, y1) in clean:
        src.paste((255, 0, 255), (x0, y0, x1, y1))
    sheet = key_out(src)
    get, cw, ch = cut(sheet, cols, rows)
    s = 72.0 / char_h
    ncol = max(len(r) for r in layout)
    layout = [r or [] for r in layout]
    out = Image.new('RGBA', (ncol * CELL, len(layout) * CELL), (0, 0, 0, 0))
    for ri, row in enumerate(layout):
        for ci, (c, r) in enumerate(row):
            cell = get(c, r)
            sc = cell.resize((round(cw * s), round(ch * s)), Image.LANCZOS)
            ox = round(FOOT[0] - foot_src[0] * s)
            oy = round(FOOT[1] - foot_src[1] * s)
            dest = Image.new('RGBA', (CELL, CELL), (0, 0, 0, 0))
            dest.paste(sc, (ox, oy), sc)
            out.paste(dest, (ci * CELL, ri * CELL))
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, name + '.png'))
    print(name, out.size)


def build_fx(name, raw, rows, size=128):
    """Folha de efeitos: cada linha é um efeito; recorta o quadrado central de cada célula crua."""
    sheet = key_out(Image.open(os.path.join(RAW, raw)))
    get, cw, ch = cut(sheet, 8, 4)
    out = Image.new('RGBA', (8 * size, len(rows) * size), (0, 0, 0, 0))
    for ri, (r, n) in enumerate(rows):
        for c in range(n):
            cell = get(c, r).crop((0, (ch - cw) // 2, cw, (ch - cw) // 2 + cw)).resize((size, size), Image.LANCZOS)
            out.paste(cell, (c * size, ri * size), cell)
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, name + '.png'))
    print(name, out.size)


def build_layer(name, raw):
    """Camada de fundo: remove o magenta e corta o espaço vazio de cima (mantém largura total)."""
    sheet = key_out(Image.open(os.path.join(RAW, raw)))
    a = sheet.split()[3].point(lambda v: 255 if v > 40 else 0)
    # topo = primeira linha com pelo menos 5% de pixels opacos (ignora ruído)
    w, h = sheet.size
    top = 0
    px = a.load()
    for y in range(h):
        if sum(1 for x in range(0, w, 4) if px[x, y]) > (w // 4) * 0.05:
            top = y
            break
    out = sheet.crop((0, top, w, h))
    os.makedirs(os.path.join(os.path.dirname(OUT), 'bg'), exist_ok=True)
    out.save(os.path.join(os.path.dirname(OUT), 'bg', name + '.png'))
    print(name, out.size)


def build_icons(name, raw, size=64):
    """Ícones: 8 colunas x 4 linhas, quadrado central de cada célula crua."""
    sheet = key_out(Image.open(os.path.join(RAW, raw)))
    get, cw, ch = cut(sheet, 8, 4)
    out = Image.new('RGBA', (8 * size, 4 * size), (0, 0, 0, 0))
    for r in range(4):
        for c in range(8):
            cell = get(c, r).crop((0, (ch - cw) // 2, cw, (ch - cw) // 2 + cw)).resize((size, size), Image.LANCZOS)
            out.paste(cell, (c * size, r * size), cell)
    os.makedirs(OUT, exist_ok=True)
    out.save(os.path.join(OUT, name + '.png'))
    print(name, out.size)


if __name__ == '__main__':
    R = lambda r, cs: [(c, r) for c in cs]
    # protagonista (machado). Linhas: idle, run, jump, fall, atk1, atk2, atk3, dodge, hurt, wall, special
    build('player', 'player_sheet_raw.jpeg', 8, 4, [
        R(0, range(8)),                    # idle (8)
        R(1, range(8)),                    # run (8)
        [(2, 1)],                          # jump
        [(5, 1)],                          # fall
        R(2, [0, 1, 2, 3]),                # golpe 1
        R(2, [3, 4, 5, 6]),                # golpe 2
        R(2, [0, 1, 3, 5, 6]),             # golpe 3
        R(3, [0, 1, 2]),                   # esquiva
        [(3, 3)],                          # dano
        [(1, 1)],                          # parede
        R(3, [0, 1, 0, 1]),                # poder especial
    ], foot_src=(88, 183), char_h=170)
    # soldado: linhas 0 idle, 1 andar, 4 ataque, 8 dano (as demais ficam vazias)
    build('soldado', 'soldado_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [], [], R(2, [0, 1, 2, 4, 5, 6]), [], [], [], [(3, 2)],
    ], foot_src=(88, 183), char_h=161)
    # lobo: 0 idle, 1 correr, 3 queda, 4 bote, 8 dano
    build('lobo', 'lobo_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [], [(4, 2)], R(2, range(8)), [], [], [], [(3, 3)],
    ], foot_src=(88, 183), char_h=140)
    # besteiro
    build('besta', 'besta_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [], [], R(2, [0, 1, 2, 3, 4, 5, 6, 7]), [], [], [], [(3, 2)],
    ], foot_src=(88, 183), char_h=165)
    # cacador (chefe): 4 virote, 5 salto, 6 lamina, 7 preparacao
    build('cacador', 'cacador_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [(2, 3)], [(2, 3)], R(3, [4, 5, 6, 7]), R(3, [0, 1, 2, 3]), R(2, range(6)), [(0, 3)], [(3, 3)],
    ], foot_src=(88, 183), char_h=165)
    # natalie: 0 parada, 10 conversa, 11 Elohim
    build('natalie', 'natalie_raw.jpeg', 8, 4, [
        R(0, range(8)), [], [], [], [], [], [], [], [], [], R(2, range(8)), R(3, range(8)),
    ], foot_src=(88, 183), char_h=161)
    # efeitos: linhas = corte, impacto, explosao de fogo, nuvem de veneno (quadros finais muito apagados ficam de fora)
    build_fx('efeitos', 'efeitos_raw.jpeg', [(0, 7), (1, 7), (2, 7), (3, 6)])
    build_icons('icones', 'icones_raw.jpeg')
    # protagonista com espada (legendas escritas pelo Gemini sao apagadas)
    build('player_espada', 'player_espada_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [(6, 3)], [(7, 3)], R(2, [0, 1, 2, 3]), R(2, [4, 5, 6]), R(2, [5, 6, 7]),
        R(3, [0, 1, 2]), [(3, 3)], [(5, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=170, clean=[(0, 580, 352, 622), (0, 738, 1408, 768)])
    # protagonista com lanca
    build('player_lanca', 'player_lanca_raw.jpeg', 8, 4, [
        R(0, [0, 1, 3, 6, 7]), R(1, range(8)), [(6, 3)], [(7, 3)], R(2, [1, 2, 3]), R(2, [4, 5, 6]), R(2, [1, 2, 3, 3]),
        R(3, [0, 1, 2]), [(3, 3)], [(5, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=170, clean=[(0, 580, 352, 622), (0, 738, 1408, 768)])
    # protagonista com manoplas
    build('player_manoplas', 'player_manoplas_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [(4, 3)], [(6, 3)], R(2, [0, 1]), R(2, [2, 3]), R(2, [4, 5, 6]),
        R(3, [0, 1, 2]), [(3, 3)], [(5, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=170)
    build_layer('mid', 'bg_mid_raw.jpeg')
    build_layer('near', 'bg_near_raw.jpeg')
    # classe: Barbaro (machado grande)
    build('cls_barbaro', 'cls_barbaro_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [(4, 3)], [(6, 3)], R(2, [0, 1, 2, 3]), [(3, 2), (4, 2), (5, 2)], [(6, 2), (7, 2), (7, 2)],
        R(3, [0, 1, 2]), [(3, 3)], [(5, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=175)
    # classe: Cacador (espada curta)
    build('cls_cacador', 'cls_cacador_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [(4, 3)], [(6, 3)], R(2, [0, 1, 2]), R(2, [3, 4, 5]), R(2, [5, 6, 6]),
        R(3, [0, 1, 2]), [(3, 3)], [(1, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=170, clean=[(140, 580, 400, 608), (535, 582, 695, 597), (708, 580, 770, 608), (1025, 580, 1085, 608)])
    # classe: Guardiao (espada e escudo)
    build('cls_guardiao', 'cls_guardiao_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(8)), [(5, 3)], [(6, 3)], [(0, 2), (1, 2), (3, 2)], [(4, 2), (5, 2), (5, 2)], [(2, 2), (6, 2), (6, 2)],
        R(3, [0, 1, 2]), [(3, 3)], [(4, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=172, clean=[(140, 580, 400, 608), (535, 582, 695, 598), (1025, 580, 1090, 608)])
    # classe: Cacique (cajado)
    build('cls_cacique', 'cls_cacique_raw.jpeg', 8, 4, [
        R(0, range(8)), R(1, range(1, 8)), [(5, 3)], [(6, 3)], R(2, [0, 1, 2]), [(2, 2), (4, 2), (3, 2)], [(4, 2), (6, 2), (6, 2)],
        R(3, [0, 1, 2]), [(3, 3)], [(2, 1)], R(3, [0, 1, 0, 1]),
    ], foot_src=(88, 183), char_h=172, clean=[(575, 198, 820, 222), (605, 390, 812, 414), (198, 583, 332, 608), (538, 583, 695, 602), (1018, 583, 1092, 608)])

    # ---- variacoes por armadura: mesmas poses das folhas de classe, outra roupa
    R2 = lambda r, cs: [(c, r) for c in cs]
    ARM_LAYOUT = {
        'barbaro': ([R2(0, range(8)), R2(1, range(8)), [(4, 3)], [(6, 3)], R2(2, [0, 1, 2, 3]), [(3, 2), (4, 2), (5, 2)], [(6, 2), (7, 2), (7, 2)],
                     R2(3, [0, 1, 2]), [(3, 3)], [(5, 1)], R2(3, [0, 1, 0, 1])], 175, ()),
        'cacador': ([R2(0, range(8)), R2(1, range(8)), [(4, 3)], [(6, 3)], R2(2, [0, 1, 2]), R2(2, [3, 4, 5]), R2(2, [5, 6, 6]),
                     R2(3, [0, 1, 2]), [(3, 3)], [(1, 1)], R2(3, [0, 1, 0, 1])], 170, [(140, 580, 400, 608), (535, 582, 695, 597), (708, 580, 770, 608), (1025, 580, 1085, 608)]),
        'guardiao': ([R2(0, range(8)), R2(1, range(8)), [(7, 3)], [(7, 3)], [(0, 2), (1, 2), (3, 2)], [(4, 2), (5, 2), (5, 2)], [(2, 2), (6, 2), (6, 2)],
                      R2(3, [0, 1, 2]), [(3, 3)], [(4, 1)], R2(3, [0, 1, 0, 1])], 172, [(198, 583, 332, 608), (540, 583, 690, 600), (1250, 583, 1395, 600)]),
        'cacique': ([R2(0, range(8)), R2(1, range(1, 8)), [(5, 3)], [(6, 3)], R2(2, [0, 1, 2]), [(2, 2), (4, 2), (3, 2)], [(4, 2), (6, 2), (6, 2)],
                     R2(3, [0, 1, 2]), [(3, 3)], [(2, 1)], R2(3, [0, 1, 0, 1])], 172, [(605, 390, 810, 413), (198, 583, 332, 608), (538, 583, 695, 602), (1018, 583, 1092, 608)]),
    }
    for k, (lay, ch, clean) in ARM_LAYOUT.items():
        f = 'arm_lobo_%s_raw.jpeg' % k
        if os.path.exists(os.path.join(RAW, f)):
            build('arm_couro_lobo_' + k, f, 8, 4, lay, foot_src=(88, 183), char_h=ch, clean=clean)
