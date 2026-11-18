import os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import eleven

NAMES = ['George', 'Brian', 'Daniel', 'Callum', 'Harry', 'Will', 'Eric', 'Bill', 'Clyde', 'Roger']
TEXT = "Nobody knew my secret. Everyone in town knew I was a quiet man."

try:
    k = eleven.key()
    os.makedirs('out', exist_ok=True)
    for n in NAMES:
        try:
            vid = eleven.find_voice(n, k)
        except eleven.Fail:
            print('skipped (not on your account):', n)
            continue
        eleven.speak(TEXT, vid, k, f'out/voice_{n}.mp3')
        print('made', n)
except eleven.Fail as e:
    sys.exit('ERROR: ' + str(e))
