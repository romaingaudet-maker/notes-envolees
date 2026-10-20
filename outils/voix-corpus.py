# Les noms de notes chantés par des voix de synthèse : le corpus des modèles par défaut de la voix
# (outils/voix-modeles.mjs) et des tests (tests/voix/).
#  1) Kokoro, une synthèse vocale neuronale (54 voix, femmes et hommes), dit chaque syllabe : do, ré, mi,
#     fa, sol, la, si (phonèmes français, quelle que soit la langue de la voix : des accents variés) ;
#  2) le vocodeur WORLD la « chante » : hauteur constante sur une note, léger vibrato, voyelle tenue
#     (« sooool » et pas « sollll »), en gardant le timbre de la voix.
# Il faut : pip install kokoro-onnx pyworld soundfile numpy scipy, et les deux fichiers du modèle,
# kokoro-v1.0.int8.onnx et voices-v1.0.bin : https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
#   python3 outils/voix-corpus.py DOSSIER_DU_MODELE DOSSIER [--enfant] [--voix v1,v2] [--taux 24000]
# Fichiers : DOSSIER/{syllabe}_{voix}_{note MIDI}.wav. Avec --enfant : conduit vocal plus court (formants
# 18 % plus haut) et notes aiguës, pour vérifier que des voix d'enfant sont reconnues.
import sys, os, argparse, numpy as np, soundfile as sf, pyworld as pw

p = argparse.ArgumentParser()
p.add_argument('modele'); p.add_argument('dossier')
p.add_argument('--enfant', action='store_true'); p.add_argument('--voix', default='')
p.add_argument('--taux', type=int, default=0)
a = p.parse_args()
from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(a.modele, 'kokoro-v1.0.int8.onnx'), os.path.join(a.modele, 'voices-v1.0.bin'))
PH = {'do': 'dˈo', 're': 'ʁˈe', 'mi': 'mˈi', 'fa': 'fˈa', 'sol': 'sˈɔl', 'la': 'lˈa', 'si': 'sˈi'}
os.makedirs(a.dossier, exist_ok=True)

def analyse(x, sr):
    x = x.astype(np.float64)
    f0, t = pw.dio(x, sr, f0_floor=60, f0_ceil=600, frame_period=5)
    f0 = pw.stonemask(x, f0, t, sr)
    return f0, pw.cheaptrick(x, f0, t, sr), pw.d4c(x, f0, t, sr)

def sing(A, sr, midi, hold=0.45, warp=1.0):
    f0, sp, ap = A
    if warp != 1.0:  # conduit vocal plus court : l'enveloppe du spectre monte en fréquence
        n = sp.shape[1]; src = np.arange(n) / warp
        sp = np.array([np.interp(src, np.arange(n), row, right=row[-1]) for row in sp])
    v = np.where(f0 > 0)[0]
    if len(v) < 8: return None
    s0, s1 = v[0], v[-1]
    # la voyelle tenue : on fait durer le milieu de la partie voisée (la voyelle), puis la fin (le « l » de sol)
    m0, m1 = s0 + int(0.4 * (s1 - s0)), s0 + int(0.75 * (s1 - s0)) + 1
    seg = np.arange(m0, m1); loop = np.concatenate([seg, seg[::-1]])
    ext = np.resize(loop, int(hold / 0.005))
    idx = np.concatenate([np.arange(0, m1), ext, np.arange(m1, len(f0))])
    f0n, spn, apn = f0[idx].copy(), sp[idx].copy(), ap[idx]
    # une note tenue garde son volume : chaque trame de la partie tenue ramenée à la puissance moyenne de la voyelle
    # (sans cela, l'aller-retour sur une voyelle parlée, qui décroît, fait onduler le volume de ±10 dB)
    e = sp[seg].sum(axis=1); ref = np.median(e)
    held = np.arange(m0, m1 + len(ext))
    spn[held] *= (ref / spn[held].sum(axis=1))[:, None]
    tt = np.arange(len(idx)) * 0.005
    vib = 1 + 0.012 * np.sin(2 * np.pi * 5.5 * tt) * np.minimum(1, tt / 0.4)  # vibrato de ±20 cents qui s'installe
    f0n[f0n > 0] = 440 * 2 ** ((midi - 69) / 12) * vib[f0n > 0]
    y = pw.synthesize(f0n, np.ascontiguousarray(spn), np.ascontiguousarray(apn), sr, 5)
    return y / (np.max(np.abs(y)) + 1e-9) * 0.5

voices = a.voix.split(',') if a.voix else sorted(k.get_voices())
for vname in voices:
    fem = vname[1] == 'f'
    if a.enfant: pitches, warp = [62, 67, 72], 1.18           # ré4 sol4 do5
    else: pitches, warp = ([57, 64, 69] if fem else [45, 50, 55]), 1.0  # la3 mi4 la4 / la2 ré3 sol3
    for s, ph in PH.items():
        x, sr = k.create(ph, voice=vname, speed=0.85, is_phonemes=True)
        A = analyse(np.asarray(x), sr)
        for m in pitches:
            y = sing(A, sr, m, warp=warp)
            if y is None: print('pas de voyelle', vname, s); continue
            if a.taux and a.taux != sr:
                from math import gcd
                from scipy.signal import resample_poly
                g = gcd(a.taux, sr); y = resample_poly(y, a.taux // g, sr // g)
            sf.write(os.path.join(a.dossier, f'{s}_{vname}_{m}.wav'), (y * 32767).astype(np.int16), a.taux or sr, subtype='PCM_16')
    print(vname, flush=True)
