def alone(tags):
    g = lambda k, d: tags.get(k, d)
    r = lambda x: round(x, 3)
    steps, stop, walk, turn = g('steps', 8.0), g('stop', 11.0), g('walk', 13.0), g('turn', 15.0)
    resume, fast, breath, lastturn = g('resume', 20.0), g('fast', 26.0), g('breath', 31.0), g('lastturn', 50.0)
    rt_start = max(turn + 1.3, resume - 0.9)
    return {
        'walk': [[0.0, r(stop + 0.15)], [r(walk + 0.25), r(turn + 0.05)], [r(resume), r(breath + 0.1)]],
        'boost': [r(fast), 0.4],
        'turn': [r(turn + 0.1), r(turn + 1.1)],
        'returnTurn': [r(rt_start), r(rt_start + 0.8)],
        'lastTurn': [r(lastturn + 0.1), r(lastturn + 1.4)],
        'follower': [[r(steps), r(stop + 0.4)], [r(walk + 0.25), r(turn + 0.05)], [r(resume), r(breath + 0.8)]],
    }
