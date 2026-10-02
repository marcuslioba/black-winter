"""Gera assets/sprites/tiles.png (12 tiles de 32x32 em uma faixa) a partir de tools/raw/tiles.jpeg.
Indices (iguais aos do atlas do jogo): 0-3 tijolos, 4-7 neve com pingentes, 8 plataforma (32x12), 9 espinhos, 10 parede quebravel, 11 portao.
Uso: python tools/build-tiles.py"""
import os
import numpy as np
from PIL import Image

root = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(root, 'raw', 'tiles.jpeg')).convert('RGB')
COLS = [(4, 348), (357, 701), (710, 1050), (1060, 1404)]
ROWS = [(4, 346), (356, 522), (534, 764)]

def key(img):
    a = np.asarray(img).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    alpha = 1 - np.clip((m - 40) / 40, 0, 1)
    spill = np.clip(m, 0, None) * (1 - alpha)
    a[..., 0] = np.clip(r - spill, 0, 255); a[..., 2] = np.clip(b - spill, 0, 255)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')

def seamless(img, axes):
    """cross-fade com a imagem deslocada pela metade: as bordas opostas passam a combinar"""
    a = np.asarray(img).astype(np.float32)
    for ax in axes:
        n = a.shape[ax]; pos = np.arange(n) / (n - 1)
        wt = np.clip(np.minimum(pos, 1 - pos) * 4, 0, 1)          # 0 nas bordas, 1 do meio (so a borda de 25% mistura)
        shape = [1, 1, 1]; shape[ax] = n; wt = wt.reshape(shape)
        a = a * wt + np.roll(a, n // 2, axis=ax) * (1 - wt)
    return Image.fromarray(a.astype(np.uint8), 'RGBA')

def cell(r, c, pad=0):
    return (COLS[c][0] + pad, ROWS[r][0] + pad, COLS[c][1] - pad, ROWS[r][1] - pad)

def trim(img, thr=40):
    return img.crop(img.getchannel('A').point(lambda v: 255 if v > thr else 0).getbbox())

strip = Image.new('RGBA', (32 * 12, 32), (0, 0, 0, 0))
# 0-3 tijolos: pedaco quadrado, contínuo nos dois eixos
for c in range(4):
    x0, y0, x1, y1 = cell(0, c, 6); cxm = (x0 + x1) // 2
    t = src.crop((cxm - 128, y0 + 30, cxm + 128, y0 + 30 + 256)).convert('RGBA')
    t = seamless(t, (0, 1)).resize((32, 32), Image.LANCZOS); strip.paste(t, (c * 32, 0))
# 4-7 neve: faixa no topo, continua na horizontal
for c in range(4):
    x0, y0, x1, y1 = cell(1, c, 4); cxm = (x0 + x1) // 2
    t = key(src.crop((cxm - 128, y0 + 20, cxm + 128, y1)))
    t = seamless(t, (1,)); bb = t.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    t = t.crop((0, bb[1], 256, bb[3])); h = max(1, round(t.height / 8))
    t = t.resize((32, h), Image.LANCZOS); strip.paste(t, (4 * 32 + c * 32, 0), t)
# 8 plataforma (32x12)
t = trim(key(src.crop(cell(2, 0, 4)))); s = 32 / t.width; t = t.resize((32, max(1, round(t.height * s))), Image.LANCZOS)
strip.paste(t, (8 * 32, 1), t)
# 9 espinhos (base no chao do tile)
t = trim(key(src.crop(cell(2, 1, 4)))); s = 32 / t.width; t = t.resize((32, min(32, max(1, round(t.height * s)))), Image.LANCZOS)
strip.paste(t, (9 * 32, 32 - t.height), t)
# 10 parede quebravel: o buraco do meio vira escuro
t = key(src.crop(cell(2, 2, 4))); t = trim(t)
base = Image.new('RGBA', t.size, (16, 20, 30, 255)); base.alpha_composite(t)
strip.paste(base.resize((32, 32), Image.LANCZOS), (10 * 32, 0))
# 11 portao: as frestas entre as barras ficam transparentes
t = key(src.crop(cell(2, 3, 4))); t = trim(t)
strip.paste(t.resize((32, 32), Image.LANCZOS), (11 * 32, 0))
out = os.path.join(root, '..', 'inverno-sombrio', 'assets', 'sprites', 'tiles.png')
strip.save(out); print('ok', strip.size)
prev = Image.new('RGBA', strip.size, (60, 90, 140, 255)); prev.alpha_composite(strip)
prev.resize((strip.width * 3, strip.height * 3), Image.NEAREST).save(os.path.join(root, 'raw', 'tiles_preview.png'))
