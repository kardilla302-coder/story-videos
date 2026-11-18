import os, re, sys

name = sys.argv[1]
theme = sys.argv[2] if len(sys.argv) > 2 else None
text = sys.stdin.read().replace('\r', '')
if not text.strip():
    sys.exit('ERROR: nothing was pasted.')

header = {'provider': 'elevenlabs', 'voice': 'George', 'model': 'eleven_multilingual_v2', 'stability': '0.4',
          'style': '0.35', 'speed': '0.92', 'theme': 'dusk', 'sfx': 'off', 'tail': '3.5'}
path = f'script/{name}.txt'
if os.path.exists(path):
    for ln in open(path).read().partition('---')[0].splitlines():
        if ':' in ln and not ln.strip().startswith('#'):
            k, v = ln.split(':', 1)
            header[k.strip()] = v.strip()
if theme:
    if theme not in ('dusk', 'day', 'winter'):
        sys.exit('ERROR: theme must be dusk, day or winter')
    header['theme'] = theme

MARK = '\u0001'
text = text.replace('>>', MARK)
items = []
for para in [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]:
    para = ' '.join(para.split())
    first = True
    for part in re.split(r'(?<=[.!?])\s+(?=[A-Z"\u201c\[' + MARK + r'])', para):
        part = part.strip()
        cut = part.startswith(MARK)
        part = part.replace(MARK, '').strip()
        part = re.sub(r'^(narrator|daniel)\s*:\s*', '', part, flags=re.I)
        part = re.sub(r'^\[.*?\]\s*', '', part)
        if not part:
            continue
        while len(part) > 110:
            cutpoint = part.rfind(', ', 0, 100)
            if cutpoint < 30:
                break
            items.append((part[:cutpoint + 1], False, first))
            part = part[cutpoint + 2:]
            first = False
        items.append((part, cut, first))
        first = False

cut_idx = next((i for i, it in enumerate(items) if it[1]), None)
if cut_idx is None:
    cut_idx = next((i for i, it in enumerate(items) if it[0].lower().startswith('but') and i > 0), None)
if cut_idx is None:
    cut_idx = max(1, int(len(items) * 0.55))

lines = []
prev = ''
for i, (t, _, para_start) in enumerate(items):
    pause = 0.4 if i == 0 else 0.5
    if prev.endswith('...') or (para_start and i > 0):
        pause = 1.0
    if i == cut_idx:
        pause = max(pause, 1.4)
    lines.append(('@cut ' if i == cut_idx else '') + f'{pause} | {t}')
    prev = t

out = [f'{k}: {v}' for k, v in header.items()]
out += ['---', '# theme can be: dusk, day, winter',
        '# format:  pause-before-line-in-seconds | what the narrator says',
        '# @cut = the line where the camera cuts to the car'] + lines
open(path, 'w').write('\n'.join(out) + '\n')

chars = sum(len(it[0]) for it in items)
words = sum(len(it[0].split()) for it in items)
est = words / 2.1 + sum(float(l.replace('@cut ', '').split('|')[0]) for l in lines) + float(header['tail'])
print(f'{len(items)} lines, {chars} characters (= {chars} ElevenLabs credits), about {est:.0f} seconds')
print(f'camera cuts to the car at line {cut_idx + 1}: {items[cut_idx][0][:50]}')
if est > 58:
    print('WARNING: over 58 seconds. YouTube Shorts allow up to 60, so consider trimming.')
