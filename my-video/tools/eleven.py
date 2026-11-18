import json, os, sys, urllib.request, urllib.error

BASE = os.environ.get('ELEVEN_BASE', 'https://api.elevenlabs.io')


class Fail(Exception):
    pass


def key():
    k = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not k and os.path.exists('.env'):
        for ln in open('.env'):
            if ln.strip().startswith('ELEVENLABS_API_KEY='):
                k = ln.split('=', 1)[1].strip().strip('"').strip("'")
    if not k or k == 'PASTE_YOUR_KEY_HERE':
        raise Fail('No ElevenLabs key yet. Open the file called .env and put your key after ELEVENLABS_API_KEY=')
    return k


def http(method, url, k, body=None, raw=False):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={'xi-api-key': k, 'Content-Type': 'application/json', 'Accept': '*/*'})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out = r.read()
    except urllib.error.HTTPError as e:
        raise Fail(f'ElevenLabs error {e.code}: ' + e.read().decode('utf-8', 'ignore')[:300])
    except urllib.error.URLError as e:
        raise Fail(f'Could not reach ElevenLabs: {e.reason}')
    return out if raw else json.loads(out)


def find_voice(name, k):
    want = name.lower().strip()
    names = []
    for url in (BASE + '/v1/voices', BASE + '/v2/voices?page_size=100'):
        try:
            voices = http('GET', url, k).get('voices', [])
        except Fail:
            continue
        for v in voices:
            names.append(v['name'])
            if v['name'].lower() == want:
                return v['voice_id']
        for v in voices:
            if v['name'].lower().startswith(want):
                return v['voice_id']
    raise Fail(f'Voice "{name}" not found on your account. Voices I can see: ' + ', '.join(sorted(set(names))[:30]))


def speak(text, voice_id, k, path, model='eleven_multilingual_v2', stability=0.4,
          similarity=0.8, style=0.35, speed=0.92):
    url = f'{BASE}/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128'
    body = {
        'text': text,
        'model_id': model,
        'voice_settings': {'stability': stability, 'similarity_boost': similarity,
                           'style': style, 'use_speaker_boost': True, 'speed': speed},
    }
    audio = http('POST', url, k, body, raw=True)
    if len(audio) < 1000:
        raise Fail('ElevenLabs sent back almost no audio: ' + audio[:200].decode('utf-8', 'ignore'))
    open(path, 'wb').write(audio)
    return len(audio) * 8 / 128000.0
