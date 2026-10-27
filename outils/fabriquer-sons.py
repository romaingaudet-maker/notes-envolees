#!/usr/bin/env python3
"""Fabrique les sons d'instruments de la page (dossier sons/) à partir
d'enregistrements libres de droits. Pour chaque instrument : quelques notes
enregistrées (une tous les 2 à 5 demi-tons), découpées à l'attaque, mesurées
(hauteur exacte au centième de demi-ton), mises au même volume ; les sons tenus
reçoivent une boucle fondue (pour tenir une note aussi longtemps qu'il faut).
Les notes sont mises bout à bout dans un MP3 mono, glissé en base64 dans
sons/<instrument>.js, que la page charge quand on choisit l'instrument.

Sources (à cloner dans un même dossier, passé en argument) :
  git clone https://github.com/sgossner/VSCO-2-CE vsco               (CC0)
  git clone https://github.com/sgossner/VCSL vcsl                    (CC0)
  git clone https://github.com/sfzinstruments/karoryfer.weresax weresax (CC0)
  git clone https://github.com/peastman/sso sso                      (CC Sampling Plus 1.0)
  git clone https://github.com/sfzinstruments/karoryfer.black-and-green-guitars bgg (CC0)
  musescore/MS Basic.sf3 : la banque de sons de MuseScore (licence MIT), tirée de
    https://github.com/musescore/MuseScore (share/sound/MS Basic.sf3) ; la guitare
    classique en vient (échantillons en Ogg Vorbis, lus ici par sf_sample)

Usage : python3 outils/fabriquer-sons.py DOSSIER_DES_SOURCES [instrument…]
Il faut numpy et ffmpeg (avec libmp3lame).
"""
import base64, json, os, subprocess, sys
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'sons')

VSCO, VCSL, WERESAX, SSO = 'vsco', 'vcsl', 'weresax', 'sso/Sonatina Symphonic Orchestra/Samples'
BGG, MSB = 'bgg/Samples', 'musescore/MS Basic.sf3'

# kind : 'tenu' (boucle) ou 'frappe' (le son s'éteint tout seul)
INSTRUMENTS = {
    'piano': dict(kind='frappe', keep=2.2, files=[
        f'{VCSL}/Chordophones/Zithers/Grand Piano, Steinway B/NoSus/JHPiano_NoSus_Close_{n}_vl3_rr1.wav'
        for n in ['F#3', 'G#3', 'A#3', 'C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5']]),
    'xylo': dict(kind='frappe', keep=1.0, files=[
        f'{VSCO}/Percussion/Xylo/Xylo_Medium_{n}_ff_01_far.wav' for n in ['G3', 'C4', 'G4', 'C5']]),
    'flute': dict(kind='tenu', files=[
        f'{VSCO}/Woodwinds/Flute/susvib/LDFlute_susvib_{n}_v1_1.wav' for n in ['A3', 'C4', 'E4', 'A4', 'C5']]),
    'clarinet': dict(kind='tenu', files=[
        f'{VSCO}/Woodwinds/Clarinet/susLong/DCClar_susLong_{n}_v2_rr1_sum.wav' for n in ['F2', 'A#2', 'D3', 'F3', 'A#3']]),
    'sax': dict(kind='tenu', files=[
        f'{WERESAX}/Samples/alto/{n}_f_rr1_cnd.wav' for n in ['db2', 'e2', 'g2', 'bb2', 'db3', 'e3']]),
    'trumpet': dict(kind='tenu', files=[
        f'{VSCO}/Brass/Trumpet/sus/Sum_SHTrumpet_sus_{n}_v3_rr1.wav' for n in ['F2', 'A2', 'C3', 'D#3', 'G3', 'A#3']]),
    'horn': dict(kind='tenu', files=[
        f'{SSO}/Horn/horn-{n}.wav' for n in ['c#3', 'e3', 'g3', 'a#3', 'c#4', 'e4']]),
    'trombone': dict(kind='tenu', files=[
        f'{SSO}/Tenor Trombone/tenor_trombone-{n}.wav' for n in ['g2', 'a#2', 'c#3', 'e3', 'g3', 'a#3', 'c#4']]),
    'violin': dict(kind='tenu', files=[
        f'{VSCO}/Strings/Solo Violin/Arco Vib/LLVln_ArcoVib_{n}_f.wav' for n in ['G3', 'A3', 'C4', 'E4', 'G4', 'A4', 'C5']]),
    'viola': dict(kind='tenu', files=[
        f'{SSO}/Viola/viola-sus-{n}.flac' for n in ['f#3', 'a3', 'c4', 'd#4', 'f#4', 'a4', 'c5']]),
    'cello': dict(kind='tenu', files=[
        f'{SSO}/Cello/cello-{n}.wav' for n in ['f#2', 'a2', 'c3', 'd#3', 'f#3', 'a3', 'c4']]),
    # guitare classique : les cordes à vide de la « Nylon Guitar » de MS Basic (mi2 la2 ré3 sol3 si3, son réel)
    'guitar': dict(kind='frappe', keep=2.2, files=[
        f'{MSB}#Nylon {n}' for n in ['E3', 'A3', 'D4', 'G4', 'B4']],
        notice='MS Basic (MuseScore), d’après Fluid R3 : © 2000-2002, 2008 Frank Wen ; mono © 2014-2017 Michael Cowgill ; '
               'adaptation © 2018-2020 S. Christian Collins ; licence MIT (texte dans sons/LISEZMOI.md)'),
    # guitare électrique : la verte des Black and Green Guitars (Karoryfer nomme les notes une octave
    # au-dessus : « gb3 » sonne fa♯2)
    'eguitar': dict(kind='frappe', keep=2.2, files=[
        f'{BGG}/green/ord/twang_{n}_mf_rr1.wav' for n in ['gb3', 'a3', 'c4', 'eb4', 'gb4', 'a4', 'c5']]),
}

PRE = 0.004          # silence gardé avant l'attaque
GAP = 0.12           # silence entre deux notes du MP3
L0 = (0.4, 1.2)      # début de la boucle cherché ici (après l'attaque)
LOOP = (0.85, 1.35)  # longueur de boucle cherchée
XF = 0.1             # fondu de la boucle
TARGET = 0.14        # niveau efficace commun (tenu), pleine échelle = 1
TARGET_HIT = 0.2     # niveau des 300 premières ms (piano, xylophone)
MARK = 0.03          # instant du repère de calage dans le MP3


def load(path):
    if '#' in path:
        return sf_sample(*path.split('#', 1))
    out = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).astype(np.float64)


_banks = {}


def sf_sample(bank, name):
    """Un échantillon d'une banque SoundFont, par son nom : SF2 (16 bits) ou SF3 (chaque échantillon en Ogg Vorbis)."""
    if bank not in _banks:
        import struct
        data = open(bank, 'rb').read()
        assert data[:4] == b'RIFF' and data[8:12] == b'sfbk', bank
        parts, off = {}, 12
        while off < len(data):
            cid, size = data[off:off + 4], struct.unpack('<I', data[off + 4:off + 8])[0]
            if cid == b'LIST':
                kind, o = data[off + 8:off + 12], off + 12
                while o < off + 8 + size:
                    c2, s2 = data[o:o + 4], struct.unpack('<I', data[o + 4:o + 8])[0]
                    parts[(kind, c2)] = (o + 8, s2)
                    o += 8 + s2 + (s2 & 1)
            off += 8 + size + (size & 1)
        so, ss = parts[(b'pdta', b'shdr')]
        heads = {}
        for i in range(ss // 46):
            h = struct.unpack('<20sIIIIIBbHH', data[so + 46 * i:so + 46 * (i + 1)])
            heads[h[0].split(b'\0')[0].decode('latin-1')] = h
        _banks[bank] = (data, parts[(b'sdta', b'smpl')][0], heads)
    data, smpl, heads = _banks[bank]
    h = heads[name]
    if h[9] & 0x10:  # SF3 : début et fin en octets, un flux Ogg Vorbis
        blob, fmt = data[smpl + h[1]:smpl + h[2]], ['-f', 'ogg']
    else:            # SF2 : début et fin en échantillons de 16 bits
        blob, fmt = data[smpl + 2 * h[1]:smpl + 2 * h[2]], ['-f', 's16le', '-ar', str(h[5]), '-ac', '1']
    out = subprocess.run(['ffmpeg', '-v', 'error', *fmt, '-i', '-', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         input=blob, capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).astype(np.float64)


def env(x, win):
    n = max(1, int(SR * win))
    return np.sqrt(np.convolve(x * x, np.ones(n) / n, mode='same'))


def onset(x, rel_db=-38):
    e = env(x, 0.003)
    idx = np.nonzero(e > e.max() * 10 ** (rel_db / 20))[0]
    return int(idx[0]) if len(idx) else 0


def yin(frame, fmin=50, fmax=4500, th=0.12):
    N = len(frame); W = N // 2
    tmin = max(2, int(SR / fmax)); tmax = min(W - 2, int(SR / fmin))
    d = np.array([np.dot(frame[:W] - frame[t:t + W], frame[:W] - frame[t:t + W]) for t in range(tmax + 2)])
    cm = np.ones_like(d)
    cs = np.cumsum(d[1:])
    cm[1:] = d[1:] * np.arange(1, len(d)) / np.maximum(cs, 1e-12)
    best = next((t for t in range(tmin, tmax) if cm[t] < th and cm[t] <= cm[t + 1]), -1)
    if best < 0:
        best = tmin + int(np.argmin(cm[tmin:tmax]))
        if cm[best] > 0.3: return None
    a, b, c = cm[best - 1], cm[best], cm[best + 1]
    den = a - 2 * b + c
    return SR / (best + (0.5 * (a - c) / den if den > 1e-12 else 0))


def spectral_pitch(x):
    """Lames frappées (xylophone) : le plus grave des pics marqués du début du son
    (l'harmonique accordée à la douzième est parfois plus forte que la fondamentale)."""
    seg = x[:int(0.12 * SR)]
    n = 1 << 16
    S = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n)); fr = np.fft.rfftfreq(n, 1 / SR)
    S[fr < 150] = 0
    peaks = [i for i in range(1, len(S) - 1) if S[i] >= S[i - 1] and S[i] >= S[i + 1] and S[i] >= 0.3 * S.max()]
    i = min(peaks)
    l, m, r = np.log(S[i - 1] + 1e-12), np.log(S[i] + 1e-12), np.log(S[i + 1] + 1e-12)
    off = 0.5 * (l - r) / (l - 2 * m + r) if (l - 2 * m + r) < 0 else 0
    return 69 + 12 * np.log2((fr[i] + off * (fr[1] - fr[0])) / 440)


def pitch(x, t0, t1):
    fs = []
    t = t0
    while t + 4096 / SR <= min(t1, len(x) / SR):
        i = int(t * SR)
        f = yin(x[i:i + 4096])
        if f: fs.append(69 + 12 * np.log2(f / 440))
        t += 0.04
    if not fs: return None
    fs = np.array(fs)
    med = np.median(fs)
    fs = fs[np.abs(fs - med) < 0.5]  # écarte les octaves mal lues
    return float(np.median(fs))


def rms(x):
    return float(np.sqrt(np.mean(x * x))) if len(x) else 0.0


def best_loop_end(x, a, lo, hi, w=0.015):
    """Fin de boucle dont le voisinage ressemble le plus à celui du début (a)."""
    h = int(w * SR)
    A = x[a - h:a + h]
    seg = x[lo - h:hi + h]
    num = np.correlate(seg, A, mode='valid')
    en = np.sqrt(np.convolve(seg * seg, np.ones(2 * h), mode='valid'))[:len(num)]
    score = num / (np.linalg.norm(A) * np.maximum(en, 1e-9) + 1e-12)
    return lo + int(np.argmax(score)), float(score.max())


def make_zone(path, kind, keep):
    x = load(path)
    o = max(0, onset(x) - int(PRE * SR))
    x = x[o:]
    x[:int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    if kind == 'frappe':
        m = spectral_pitch(x) if 'Xylo' in path else pitch(x, 0.08, 0.6)
        n = min(len(x), int(keep * SR))
        x = x[:n].copy()
        f = int(min(0.4, keep * 0.3) * SR)
        x[-f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
        x *= TARGET_HIT / max(rms(x[:int(0.3 * SR)]), 1e-6)
        loop = None
    else:
        m = pitch(x, 0.12, 0.9)  # la hauteur entendue surtout au début des notes
        # début et fin de boucle : le couple dont les voisinages se ressemblent le plus
        best = None
        e20 = 20 * np.log10(env(x, 0.02) + 1e-9)
        for a in range(int(L0[0] * SR), int(L0[1] * SR) + 1, int(0.02 * SR)):
            lo = a + int(LOOP[0] * SR)
            hi = min(a + int(LOOP[1] * SR), len(x) - int(0.15 * SR))
            if hi <= lo: continue
            b, sc = best_loop_end(x, a, lo, hi)
            # même niveau de part et d'autre de la jointure, et une tenue bien régulière dans la boucle
            la, lb = rms(x[a - 2205:a + 2205]), rms(x[b - 2205:b + 2205])
            steady = float(np.std(e20[a:b:int(0.01 * SR)]))
            sc -= abs(20 * np.log10(max(la, 1e-9) / max(lb, 1e-9))) * 0.05 + steady * 0.12
            # à qualité égale, une boucle qui commence tôt (fichier plus léger)
            sc -= (a / SR) * 0.03
            if best is None or sc > best[2]: best = (a, b, sc, steady)
        if best is None:
            raise SystemExit(f'{path} : trop court pour boucler ({len(x) / SR:.2f} s)')
        a, b, score, steady = best
        xf = int(XF * SR)
        w = np.linspace(0, 1, xf)
        y = x[:b].copy()
        y[b - xf:b] = x[b - xf:b] * (1 - w) + x[a - xf:a] * w   # la fin de boucle glisse vers son début
        # après la fin de boucle, la suite naturelle du début de boucle : si la lecture
        # déborde de quelques échantillons, elle entend exactement ce qui suit le retour
        x = np.concatenate([y, x[a:a + int(0.012 * SR)]])
        x *= TARGET / max(rms(x[int(0.05 * SR):int(0.7 * SR)]), 1e-6)  # niveau du début de note (le plus entendu)
        loop = [round(a / SR, 5), round(b / SR, 5)]
        print(f'      boucle {a / SR:.2f}–{b / SR:.2f} s (note {score:.3f}, tenue ±{steady:.1f} dB)')
    peak = np.abs(x).max()
    if peak > 0.97: x *= 0.97 / peak
    ref = onset(x) / SR
    # attaque perçue : l'enveloppe atteint -15 dB de son maximum (première seconde) ;
    # la page lance la note d'autant plus tôt pour qu'elle tombe sur le temps
    e = env(x[:int(1.0 * SR)], 0.005)
    att = float(np.argmax(e > e.max() * 10 ** (-15 / 20)) / SR)
    return dict(x=x, m=m, loop=loop, ref=ref, att=att)


def build(name, cfg, root):
    print(f'== {name}')
    lead = np.zeros(int(0.1 * SR))
    lead[int(MARK * SR)] = 0.5   # repère de calage (jamais joué) : retrouve le décalage du décodeur MP3
    zones, parts = [], [lead]
    pos = 0.1
    for f in cfg['files']:
        z = make_zone(os.path.join(root, f), cfg['kind'], cfg.get('keep', 0))
        n = len(z['x']) / SR
        print(f'   {os.path.basename(f.split("#")[-1]):40} hauteur {z["m"]:6.2f}  durée {n:4.2f} s  attaque {z["att"] * 1000:3.0f} ms')
        zone = {'m': round(z['m'], 3), 's': round(pos, 5), 'n': round(n, 4), 'r': round(z['ref'], 5), 'a': round(min(z['att'], 0.15), 4)}
        if z['loop']: zone['l'] = z['loop']
        zones.append(zone)
        parts += [z['x'], np.zeros(int(GAP * SR))]
        pos += n + GAP
    zones.sort(key=lambda z: z['m'])
    pcm = np.concatenate(parts).astype(np.float32)
    mp3 = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-',
                          '-codec:a', 'libmp3lame', '-b:a', '80k', '-f', 'mp3', '-'],
                         input=pcm.tobytes(), capture_output=True, check=True).stdout
    data = {'id': name, 'kind': cfg['kind'], 'mark': MARK, 'zones': zones}
    notice = f' — {cfg["notice"]}' if cfg.get('notice') else ''
    js = (f'/* Sons enregistrés : voir sons/LISEZMOI.md (sources et licences){notice} */\n'
          f'(window.NotesSons = window.NotesSons || []).push({json.dumps(data, separators=(",", ":"))[:-1]},'
          f'"mp3":"{base64.b64encode(mp3).decode()}"}});\n')
    with open(os.path.join(OUT, name + '.js'), 'w') as fh:
        fh.write(js)
    print(f'   → sons/{name}.js  {len(js) / 1024:.0f} Ko (MP3 {len(mp3) / 1024:.0f} Ko, {len(pcm) / SR:.1f} s)')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    root = sys.argv[1]
    os.makedirs(OUT, exist_ok=True)
    for name in sys.argv[2:] or INSTRUMENTS:
        build(name, INSTRUMENTS[name], root)
