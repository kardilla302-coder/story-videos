import json, os, sys

name = sys.argv[1]
d = json.load(open(f'src/studio/data/{name}.json'))


def t(sec):
    return f'{int(sec // 60)}:{sec % 60:04.1f}'


out = [f'CUE SHEET for {name}  (total {t(d["total"])})', '', 'NARRATION LINES (* = the creature speaks)']
out += [f'  {t(l["start"])}  {"* " if l.get("thing") else ""}{l["text"][:50]}' for l in d['lines']]
plan = d.get('plan')
if plan:
    out += ['', 'HE WALKS (his footsteps):']
    out += [f'  {t(a)} - {t(b)}' for a, b in plan['walk']]
    out += [f'  from {t(plan["boost"][0])} he walks about 40% faster (quicker steps)']
    out += ['', 'IT FOLLOWS (a second set of footsteps, a beat behind him):']
    out += [f'  {t(a)} - {t(b)}' for a, b in plan['follower']]
    out += ['', 'SILENCE (no footsteps at all):']
    f = plan['follower']
    out += [f'  {t(f[i][1])} - {t(f[i + 1][0])}' for i in range(len(f) - 1)]
    out += [f'  {t(plan["lastTurn"][0])} - end   (he stands frozen, it only breathes)']
tags = d.get('tags', {})
labels = [('tonight', 'mood turns'), ('steps', 'first footsteps behind him'), ('turn', 'close shot: he turns'),
          ('nobody', 'empty street, his point of view'), ('relief', 'he laughs'),
          ('lamps', 'streetlights start going out behind him, one by one'),
          ('fast', 'he speeds up and so does it'), ('near', 'it is right behind him (we see it)'),
          ('breath', 'he freezes, cold breath'), ('lean', 'it bends down to his ear'),
          ('whisper', 'its whisper'), ('name', 'it says his name'), ('lastturn', 'he turns around'),
          ('endline', 'last line over black')]
out += ['', 'BIG MOMENTS']
out += [f'  {t(tags[k])}  {v}' for k, v in labels if k in tags]
text = '\n'.join(out)
print(text)
os.makedirs('out', exist_ok=True)
open(f'out/cues_{name}.txt', 'w').write(text + '\n')
