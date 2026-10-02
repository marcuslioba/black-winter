"""Gera assets/sprites/cenario.png (8 objetos de cenario em celulas de 96x112, base no centro-baixo) a partir de tools/raw/cenario.jpeg.
Ordem: 0 bau, 1 bau aberto, 2 bau runico, 3 bau runico aberto, 4 altar dormente, 5 altar desperto, 6 placa, 7 lampiao.
Uso: python tools/build-cenario.py"""
import os
import numpy as np
from PIL import Image

root = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(root, 'raw', 'cenario.jpeg')).convert('RGB')
CW, CH = src.width / 4, src.height / 2
SCALE = [0.15, 0.15, 0.15, 0.15, 0.21, 0.21, 0.16, 0.16]     # escala de cada objeto (altar maior)
OUT_W, OUT_H = 96, 112

def key(img):
    a = np.asarray(img).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    alpha = 1 - np.clip((m - 14) / 46, 0, 1)
    spill = np.clip(m, 0, None) * (1 - alpha) * 1.0
    a[..., 0] = np.clip(r - spill, 0, 255); a[..., 2] = np.clip(b - spill, 0, 255)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')

sheet = Image.new('RGBA', (OUT_W * 8, OUT_H), (0, 0, 0, 0))
for i in range(8):
    col, row = i % 4, i // 4
    box = (int(col * CW) + 8, int(row * CH) + 8, int((col + 1) * CW) - 8, int((row + 1) * CH) - 8)   # tira as linhas divisorias
    c = key(src.crop(box))
    A = c.getchannel('A'); bb = A.point(lambda v: 255 if v > 40 else 0).getbbox(); rows = (np.asarray(A) > 200).sum(axis=1); base = int(np.where(rows >= 0.45 * rows.max())[0].max()) + 1   # última linha com massa sólida (ignora pixels soltos)
    c = c.crop((bb[0], bb[1], bb[2], min(bb[3], base))); s = SCALE[i]      # a base é a parte sólida; o brilho que passa dela é cortado
    c = c.resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
    assert c.width <= OUT_W and c.height <= OUT_H, (i, c.size)
    sheet.paste(c, (i * OUT_W + (OUT_W - c.width) // 2, OUT_H - c.height), c)
out = os.path.join(root, '..', 'inverno-sombrio', 'assets', 'sprites', 'cenario.png')
sheet.save(out); print('ok', sheet.size)
