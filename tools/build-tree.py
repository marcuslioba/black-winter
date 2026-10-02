"""Gera assets/sprites/arvore.png (Arvore Sagrada: quadro 0 dormente, quadro 1 desperta) a partir de tools/raw/arvore.jpeg.
Uso: python tools/build-tree.py
O raw e um desenho do Gemini com dois paineis sobre fundo roxo/magenta; o fundo e removido por matiz."""
import os
import numpy as np
from PIL import Image

root = os.path.dirname(os.path.abspath(__file__))
src = Image.open(os.path.join(root, 'raw', 'arvore.jpeg')).convert('RGB')
PANELS = [(35, 38, 665, 735), (711, 38, 1341, 735)]   # esquerda dormente, direita desperta
FW, FH = 200, 222                                    # tamanho final de cada quadro

def key_panel(box):
    a = np.asarray(src.crop(box)).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b) - g                           # "magenta-ness": alto no fundo roxo, baixo na arvore
    alpha = 1 - np.clip((m - 14) / 46, 0, 1)
    # remove o roxo que sobra nas bordas semitransparentes
    spill = np.clip(m, 0, None) * (1 - alpha) * 1.0
    a[..., 0] = np.clip(r - spill, 0, 255); a[..., 2] = np.clip(b - spill, 0, 255)
    h, w = alpha.shape
    # a faixa de chao some nas pontas: fica so a base da arvore
    yy, xx = np.mgrid[0:h, 0:w]
    cx = w / 2
    side = np.clip(1 - (np.abs(xx - cx) - 215) / 95, 0, 1)
    ground = np.clip((yy - (h - 95)) / 30, 0, 1)         # 0 acima da faixa, 1 dentro dela
    alpha *= 1 - ground * (1 - side)
    alpha *= np.clip((h - 8 - yy) / 14, 0, 1)            # borda inferior suave
    out = np.dstack([a[..., 0], a[..., 1], a[..., 2], alpha * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

frames = [key_panel(b) for b in PANELS]
# caixa comum, para os dois quadros ficarem alinhados
bb = None
for f in frames:
    box = f.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox()
    bb = box if bb is None else (min(bb[0], box[0]), min(bb[1], box[1]), max(bb[2], box[2]), max(bb[3], box[3]))
sheet = Image.new('RGBA', (FW * 2, FH), (0, 0, 0, 0))
for i, f in enumerate(frames):
    c = f.crop(bb); s = min((FW - 4) / c.width, (FH - 4) / c.height)
    c = c.resize((max(1, round(c.width * s)), max(1, round(c.height * s))), Image.LANCZOS)
    sheet.paste(c, (i * FW + (FW - c.width) // 2, FH - c.height), c)
out = os.path.join(root, '..', 'inverno-sombrio', 'assets', 'sprites', 'arvore.png')
sheet.save(out); print('ok', out, sheet.size)
