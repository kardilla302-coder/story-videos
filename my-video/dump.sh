#!/bin/bash
# usage: ./dump.sh   -> out/project_dump.txt  (all of the project's own code and scripts in ONE file)
mkdir -p out
OUT=out/project_dump.txt
echo "PROJECT DUMP  $(date)" > "$OUT"
echo "--- recent changes ---" >> "$OUT"
git log --oneline 2>/dev/null | head -15 >> "$OUT"
for f in package.json remotion.config.ts tsconfig.json src/studio/index.ts src/studio/Root.tsx src/studio/kit.tsx \
  src/studio/world.tsx src/studio/stalker.tsx src/studio/motion.ts src/studio/captions.tsx src/studio/narration.tsx \
  src/studio/stories/*.tsx tools/*.py script/*.txt *.sh; do
  if [ -f "$f" ]; then
    echo "" >> "$OUT"
    echo "=================== FILE: $f ===================" >> "$OUT"
    cat "$f" >> "$OUT"
  fi
done
echo "Saved $OUT ($(wc -l < "$OUT") lines, $(du -h "$OUT" | cut -f1))"
