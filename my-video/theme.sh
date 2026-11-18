#!/bin/bash
# usage: ./theme.sh Daniel winter     (dusk | day | winter) - costs no voice credits
sed -i "s/^theme:.*/theme: $2/" "script/$1.txt"
python3 - "$1" "$2" <<'PY'
import json, sys
p = f'src/studio/data/{sys.argv[1]}.json'
d = json.load(open(p))
d['theme'] = sys.argv[2]
json.dump(d, open(p, 'w'), indent=1)
print('theme set to', sys.argv[2])
PY
