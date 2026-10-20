# Les noms de notes dits par des voix de synthèse (espeak-ng), d'une voix monocorde, comme chantés
# sur une note. Sert aux modèles par défaut de la reconnaissance des noms (outils/voix-modeles.mjs)
# et aux tests (tests/voix/).
#   pip install espeakng-loader
#   python3 outils/voix-corpus.py DOSSIER [taux d'échantillonnage, 22050 par défaut]
import ctypes, os, sys, wave, struct
import espeakng_loader
D = os.path.dirname(espeakng_loader.__file__)
lib = ctypes.CDLL(os.path.join(D, 'libespeak-ng.so'))
SR = lib.espeak_Initialize(1, 0, D.encode(), 0)
buf = []
CB = ctypes.CFUNCTYPE(ctypes.c_int, ctypes.POINTER(ctypes.c_short), ctypes.c_int, ctypes.c_void_p)
cbf = CB(lambda wav, n, ev: (buf.extend(wav[:n]) if n > 0 else None) or 0)
lib.espeak_SetSynthCallback(cbf)

def synth(text, voice, pitch):
    buf.clear()
    lib.espeak_SetVoiceByName(voice.encode())
    lib.espeak_SetParameter(3, pitch, 0)   # hauteur
    lib.espeak_SetParameter(4, 0, 0)       # étendue 0 : voix monocorde
    lib.espeak_SetParameter(1, 110, 0)     # débit
    t = text.encode('utf-8')
    lib.espeak_Synth(t, len(t) + 1, 0, 1, 0, 1, None, None)
    lib.espeak_Synchronize()
    return list(buf)

def save(path, a, rate):
    if rate != SR:  # rééchantillonnage linéaire
        n = int(len(a) * rate / SR); a = [a[min(len(a) - 1, int(i * SR / rate))] for i in range(n)]
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(struct.pack('<%dh' % len(a), *a))

if __name__ == '__main__':
    out = sys.argv[1]; rate = int(sys.argv[2]) if len(sys.argv) > 2 else SR
    os.makedirs(out, exist_ok=True)
    SYL = [('do', 'do'), ('re', 'ré'), ('mi', 'mi'), ('fa', 'fa'), ('sol', 'sol'), ('la', 'la'), ('si', 'si')]
    VOICES = sys.argv[3].split(',') if len(sys.argv) > 3 else ['fr', 'fr+m3', 'fr+f2', 'fr+klatt', 'fr+m6', 'fr+f4']
    PITCHES = [int(p) for p in sys.argv[4].split(',')] if len(sys.argv) > 4 else [30, 80]
    for v in VOICES:
        for p in PITCHES:
            for name, text in SYL:
                a = synth(text, v, p)
                i0 = next((i for i, x in enumerate(a) if abs(x) > 300), 0)
                i1 = len(a) - next((i for i, x in enumerate(reversed(a)) if abs(x) > 300), 0)
                save(os.path.join(out, f"{name}_{v.replace('+', '-')}_{p}.wav"), a[max(0, i0 - int(0.15 * SR)): i1 + int(0.05 * SR)], rate)
    print(len(os.listdir(out)), 'fichiers dans', out)
