#!/bin/bash
# usage: ./make.sh Daniel   ->  out/Daniel.mp4
npx remotion render src/studio/index.ts "$1" "out/$1.mp4" --gl=swangle
