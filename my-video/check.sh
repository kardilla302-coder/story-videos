#!/bin/bash
cd "$(dirname "$0")"
OUT=$(npx tsc --noEmit 2>&1 | grep "src/studio" | grep -v TS6133)
if [ -z "$OUT" ]; then echo "CHECK_OK"; else echo "$OUT"; exit 1; fi
