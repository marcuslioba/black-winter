"""Gera assets/sprites/props.png (16 props em celulas de 96x112, base no centro-baixo) a partir de tools/raw/props.jpeg.
Ordem: 0 barril, 1 caixotes, 2-3 carroca, 4-5 cerca, 6 entulho, 7 vigas queimadas, 8 muro com arco, 9-10 lapide, 11 estandarte, 12 bandeira, 13 sacos, 14 postes queimados, 15 chamine.
Uso: python tools/build-props.py"""
import os
import numpy as np
from PIL import Image

root = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(root, 'raw', 'props.jpeg')).convert('RGB')
# (x0, y0, x1, y1, escala)
BOX = [
    (0, 0, 236, 235, 0.14), (238, 0, 470, 235, 0.14), (472, 0, 704, 235, 0.2), (706, 0, 938, 235, 0.2), (940, 0, 1172, 235, 0.2), (1174, 0, 1408, 235, 0.2),
    (0, 236, 242, 466, 0.2), (244, 236, 566, 466, 0.18), (568, 236, 936, 466, 0.22), (938, 236, 1172, 466, 0.17), (1174, 236, 1408, 466, 0.17),
    (0, 468, 280, 768, 0.22), (282, 468, 566, 768, 0.2), (568, 468, 936, 768, 0.18), (940, 468, 1146, 768, 0.2), (1148, 468, 1408, 768, 0.22)]
OUT_W, OUT_H = 96, 112

def key(img):
    a = np.asarray(img).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g
    alpha = 1 - np.clip((m - 40) / 40, 0, 1)
    spill = np.clip(m, 0, None) * (1 - alpha)
    a[..., 0] = np.clip(r - spill, 0, 255); a[..., 2] = np.clip(b - spill, 0, 255)
    return Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')

sheet = Image.new('RGBA', (OUT_W * len(BOX), OUT_H), (0, 0, 0, 0))
for i, (x0, y0, x1, y1, s) in enumerate(BOX):
    c = key(src.crop((x0 + 6, y0 + 6, x1 - 6, y1 - 6)))      # tira as linhas divisorias
    A = c.getchannel('A'); bb = A.point(lambda v: 255 if v > 40 else 0).getbbox(); rows = (np.asarray(A) > 200).sum(axis=1); base = int(np.where(rows >= 0.45 * rows.max())[0].max()) + 1   # última linha com massa sólida (ignora pixels soltos)
    c = c.crop((bb[0], bb[1], bb[2], min(bb[3], base)))
    c = c.resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
    assert c.width <= OUT_W and c.height <= OUT_H, (i, c.size)
    sheet.paste(c, (i * OUT_W + (OUT_W - c.width) // 2, OUT_H - c.height), c)
out = os.path.join(root, '..', 'inverno-sombrio', 'assets', 'sprites', 'props.png')
sheet.save(out); print('ok', sheet.size)
prev = Image.new('RGBA', sheet.size, (60, 90, 140, 255)); prev.alpha_composite(sheet)
prev.crop((0, 0, 768, 112)).resize((1536, 224), Image.NEAREST).save(os.path.join(root, 'raw', 'props_preview1.png'))
prev.crop((768, 0, 1536, 112)).resize((1536, 224), Image.NEAREST).save(os.path.join(root, 'raw', 'props_preview2.png'))
