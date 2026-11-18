#!/bin/bash
# usage: ./peek.sh Alone 71.5   -> out/peek_71.5.png  (one picture from that second of the video)
mkdir -p out
npx remotion still src/studio/index.ts "$1" "out/peek_$2.png" --frame="$(python3 -c "print(round($2 * 30))")" --gl=swangle
