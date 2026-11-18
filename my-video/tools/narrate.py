import asyncio, hashlib, json, math, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eleven
import plans

FPS = 30
name = sys.argv[1]
dry = '--dry' in sys.argv

src = open(f'script/{name}.txt').read()
head, _, body = src.partition('---')
cfg = {'provider': 'elevenlabs', 'voice': 'George', 'model': 'eleven_multilingual_v2',
       'stability': '0.4', 'similarity': '0.8', 'style': '0.35', 'speed': '0.92',
       'rate': '-10%', 'pitch': '-4Hz', 'tail': '3.5', 'theme': 'dusk', 'sfx': 'off',
       'story': '', 'title': '', 'highlight': '', 'subtitle': '', 'endtext': '', 'thing_voice': '',
       'thing_stability': '0.25', 'thing_style': '0.7', 'thing_speed': '0.8'}
for ln in head.splitlines():
    if ':' in ln and not ln.strip().startswith('#'):
        k, v = ln.split(':', 1)
        cfg[k.strip()] = v.strip()

lines = []
for ln in body.splitlines():
    ln = ln.strip()
    if not ln or ln.startswith('#'):
        continue
    tagl = []
    m = re.match(r'((?:@\w+\s+)+)', ln)
    if m:
        tagl = re.findall(r'@(\w+)', m.group(1))
        ln = ln[m.end():]
    pause, _, text = ln.partition('|')
    lines.append({'pause': float(pause), 'text': text.strip(), 'tags': tagl})

adir = f'public/audio/{name}'
os.makedirs(adir, exist_ok=True)
os.makedirs('src/studio/data', exist_ok=True)


def spread(tokens, t0, t1):
    weights = [len(t) + 2 for t in tokens]
    total = float(sum(weights))
    out, cur = [], t0
    for tok, w in zip(tokens, weights):
        d = (t1 - t0) * w / total
        out.append({'w': tok, 's': round(cur, 3), 'e': round(cur + d, 3)})
        cur += d
    return out


async def edge_synth(text, path):
    import edge_tts
    com = edge_tts.Communicate(text, cfg['voice'], rate=cfg['rate'], pitch=cfg['pitch'])
    audio = bytearray()
    async for ch in com.stream():
        if ch['type'] == 'audio':
            audio += ch['data']
    open(path, 'wb').write(bytes(audio))
    return len(audio) * 8 / 48000.0


def main():
    key = vid = tvid = None
    if not dry and cfg['provider'] == 'elevenlabs':
        key = eleven.key()
        vid = cfg.get('voice_id') or eleven.find_voice(cfg['voice'], key)
        tvid = vid
        if cfg['thing_voice']:
            try:
                tvid = eleven.find_voice(cfg['thing_voice'], key)
            except eleven.Fail:
                print('NOTE: creature voice not found on your account, using the narrator voice for it.')
    t = 0.0
    out_lines = []
    tags = {}
    chars = 0
    cache_path = f'{adir}/cache.json'
    cache = json.load(open(cache_path)) if os.path.exists(cache_path) else {}
    for i, l in enumerate(lines):
        t += l['pause']
        tokens = l['text'].split()
        fname = f'line_{i + 1:02d}.mp3'
        path = f'{adir}/{fname}'
        sig = hashlib.md5(json.dumps([cfg['provider'], cfg['voice'], cfg.get('voice_id', ''), cfg['model'],
                                      cfg['stability'], cfg['similarity'], cfg['style'], cfg['speed'],
                                      cfg['rate'], cfg['pitch'], l['text'], 'thing' in l['tags'], cfg['thing_voice'],
                                      cfg['thing_stability'], cfg['thing_style'], cfg['thing_speed']]).encode()).hexdigest()
        if dry:
            dur = max(0.9, len(tokens) / 2.3)
        elif cache.get(fname, {}).get('sig') == sig and os.path.exists(path):
            dur = cache[fname]['dur']
            print(f'line {i + 1}: {dur:.1f}s (reused, no credits)')
        else:
            if cfg['provider'] == 'elevenlabs':
                th = 'thing' in l['tags'] and bool(tvid)
                dur = eleven.speak(l['text'], tvid if th else vid, key, path, model=cfg['model'],
                                   stability=float(cfg['thing_stability' if th else 'stability']),
                                   similarity=float(cfg['similarity']),
                                   style=float(cfg['thing_style' if th else 'style']),
                                   speed=float(cfg['thing_speed' if th else 'speed']))
                chars += len(l['text'])
            else:
                dur = asyncio.run(edge_synth(l['text'], path))
            cache[fname] = {'sig': sig, 'dur': dur}
            json.dump(cache, open(cache_path, 'w'))
            print(f'line {i + 1}: {dur:.1f}s')
        out_lines.append({'text': l['text'], 'start': round(t, 3), 'dur': round(dur, 3), 'file': fname,
                          'tag': (l['tags'] or [None])[0], 'tags': l['tags'], 'thing': 'thing' in l['tags'], 'words': spread(tokens, 0.05, max(0.2, dur - 0.1))})
        for tg in l['tags']:
            if tg not in tags:
                tags[tg] = round(t, 3)
        t += dur
    total = t + float(cfg['tail'])
    cut_start = tags.get('cut', total * 0.6)
    data = {
        'fps': FPS,
        'total': round(total, 3),
        'totalFrames': int(math.ceil(total * FPS)),
        'cutFrame': int(round(cut_start * FPS)),
        'hasAudio': not dry,
        'theme': cfg['theme'],
        'sfx': cfg['sfx'] == 'on',
        'title': cfg['title'],
        'subtitle': cfg['subtitle'],
        'endtext': cfg['endtext'],
        'highlight': [h.strip() for h in cfg['highlight'].split(',') if h.strip()],
        'tags': tags,
        'lines': out_lines,
    }
    if cfg['story'] == 'alone':
        data['plan'] = plans.alone(tags)
    json.dump(data, open(f'src/studio/data/{name}.json', 'w'), indent=1)
    extra = f', {chars} ElevenLabs credits used' if chars else ''
    print(f"{'(dry run) ' if dry else ''}{name}: {total:.1f}s total, theme {cfg['theme']}{extra}")


try:
    main()
except eleven.Fail as e:
    sys.exit('ERROR: ' + str(e))
