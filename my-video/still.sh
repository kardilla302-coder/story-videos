#!/bin/bash
# usage: ./still.sh SheetPerson   ->  out/SheetPerson.png
npx remotion still src/studio/index.ts "$1" "out/$1.png" --gl=swangle
