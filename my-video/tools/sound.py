import array, json, math, random, sys, wave

name = sys.argv[1]
d = json.load(open(f'src/studio/data/{name}.json'))
SR = 32000
TAU = 2 * math.pi
TOTAL = d['total']
CUT = d['cutFrame'] / d['fps']
N = int(TOTAL * SR)
random.seed(11)

mix = [0.0] * N


def rms(buf):
    return math.sqrt(sum(x * x for x in buf) / max(1, len(buf))) or 1.0


def add(buf, start_sec, samples, gain=1.0):
    i0 = int(start_sec * SR)
    for k, x in enumerate(samples):
        j = i0 + k
        if 0 <= j < len(buf):
            buf[j] += x * gain


def bed_gain(t):
    g = min(1.0, t / 1.5)
    if t > CUT:
        prog = (t - CUT) / max(1.0, TOTAL - CUT)
        g *= 0.7 + 0.3 * prog
    if CUT - 2.2 < t < CUT - 0.18:
        g *= 0.75
    if CUT - 0.18 <= t < CUT + 0.15:
        g *= 0.0
    elif CUT + 0.15 <= t < CUT + 1.2:
        g *= (t - CUT - 0.15) / 1.05
    if t > TOTAL - 0.6:
        g *= max(0.0, (TOTAL - t) / 0.6)
    return g


# --- wind ---
a1 = 1 - math.exp(-TAU * 450 / SR)
l1 = l2 = 0.0
wind = [0.0] * N
for i in range(N):
    t = i / SR
    x = random.uniform(-1, 1)
    l1 += a1 * (x - l1)
    l2 += a1 * (l1 - l2)
    gust = 0.55 + 0.45 * math.sin(TAU * 0.11 * t + 1.3) * math.sin(TAU * 0.23 * t + 0.4)
    wind[i] = l2 * gust
s = 0.16 / rms(wind)
for i in range(N):
    mix[i] += wind[i] * s * bed_gain(i / SR)

# --- low drone (swells toward the end) ---
for i in range(N):
    t = i / SR
    trem = 0.8 + 0.2 * math.sin(TAU * 0.17 * t)
    v = (math.sin(TAU * 55.0 * t) + math.sin(TAU * 55.6 * t) * 0.8
         + math.sin(TAU * 82.4 * t) * 0.35 + math.sin(TAU * 110.3 * t) * 0.2) * trem
    swell = 1.0 + (1.2 * max(0.0, (t - CUT) / max(1.0, TOTAL - CUT)) if t > CUT else 0.0)
    mix[i] += v * 0.05 * swell * bed_gain(t)

# --- crickets (stop dead at the cut) ---
t = 1.0
while t < CUT - 0.4:
    f = random.choice([4100.0, 4350.0, 4600.0])
    for c in range(3):
        n = int(0.03 * SR)
        chirp = [math.sin(TAU * f * k / SR) * math.sin(math.pi * k / n) ** 2 for k in range(n)]
        add(mix, t + c * 0.055, chirp, 0.02 * bed_gain(t))
    t += random.uniform(0.7, 1.5)

# --- footsteps matching the walk cycle (one step every 9.24 frames) ---
k = 0
while True:
    ts = (4.62 + 9.24 * k) / d['fps']
    if ts > CUT - 0.25:
        break
    n = int(0.14 * SR)
    pitch = random.uniform(70, 95)
    amp = random.uniform(0.8, 1.05)
    nz = 0.0
    step = []
    for q in range(n):
        tt = q / SR
        nz += 0.25 * (random.uniform(-1, 1) - nz)
        step.append(math.sin(TAU * pitch * tt) * math.exp(-tt * 40) * 0.5 + nz * math.exp(-tt * 55) * 0.55)
    add(mix, ts, step, 0.9 * amp * min(1.0, ts / 1.0 + 0.2))
    k += 1

# --- riser into the cut, then total silence ---
r0 = CUT - 2.2
rn = int(2.02 * SR)
lp = 0.0
riser = []
for q in range(rn):
    p = q / rn
    a = 0.01 * (60 ** p)
    lp += min(0.9, a) * (random.uniform(-1, 1) - lp)
    riser.append(lp * (p ** 2.2) + math.sin(TAU * (70 + 330 * p) * q / SR) * 0.05 * p)
sc = 0.14 / rms(riser)
add(mix, r0, riser, sc)

# --- boom + reverb tail at the cut ---
bn = int(4.0 * SR)
boom = []
ph = 0.0
nz = 0.0
for q in range(bn):
    tt = q / SR
    f = 38 + 42 * math.exp(-tt * 3.0)
    ph += TAU * f / SR
    nz += 0.08 * (random.uniform(-1, 1) - nz)
    boom.append(math.sin(ph) * math.exp(-tt * 1.1) * 0.95 + nz * math.exp(-tt * 3.0) * 1.6)
wet = boom[:]
for delay, fb in ((0.037, 0.55), (0.053, 0.5), (0.071, 0.45), (0.097, 0.4)):
    dn = int(delay * SR)
    buf = [0.0] * bn
    for q in range(bn):
        buf[q] = boom[q] + (buf[q - dn] * fb if q >= dn else 0.0)
    for q in range(bn):
        wet[q] += buf[q] * 0.3
add(mix, CUT, wet, 0.5)

# --- car engine: arrives, brakes, idles ---
en = N - int(CUT * SR)
lp = 0.0
eng = []
for q in range(max(0, en)):
    tt = q / SR
    lp += 0.02 * (random.uniform(-1, 1) - lp)
    if tt < 2.4:
        env = (tt / 2.4) ** 1.5
    elif tt < 3.4:
        env = 1.0 - 0.65 * (tt - 2.4)
    else:
        env = 0.35
    chug = 0.7 + 0.3 * math.sin(TAU * 11 * tt)
    pitch = 1.0 + 0.25 * (env if tt < 2.4 else 0.0)
    v = (math.sin(TAU * 47 * pitch * tt) + 0.6 * math.sin(TAU * 94 * pitch * tt)) * chug + lp * 9
    eng.append(v * env)
if eng:
    sc = 0.11 / rms(eng)
    for q in range(len(eng)):
        eng[q] *= sc * (max(0.0, min(1.0, (TOTAL - (CUT + q / SR)) / 0.6)))
    add(mix, CUT + 0.2, eng, 1.0)

# --- heartbeat, speeding up ---
tb = CUT + 2.5
while tb < TOTAL - 0.5:
    prog = (tb - (CUT + 2.5)) / max(1.0, TOTAL - CUT - 3.0)
    bpm = 60 + 40 * min(1.0, prog)
    amp = 0.22 + 0.3 * min(1.0, prog)
    for off, a2 in ((0.0, 1.0), (0.23, 0.65)):
        n = int(0.28 * SR)
        beat = [math.sin(TAU * 52 * q / SR) * math.exp(-q / SR * 20) for q in range(n)]
        add(mix, tb + off, beat, amp * a2)
    tb += 60.0 / bpm

# --- master ---
peak = max(abs(x) for x in mix) or 1.0
scale = 0.9 / peak
pcm = array.array('h', [int(max(-1.0, min(1.0, x * scale)) * 32000) for x in mix])
with wave.open(f'public/audio/{name}/sfx.wav', 'wb') as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f'sfx.wav written ({TOTAL:.1f}s)')
