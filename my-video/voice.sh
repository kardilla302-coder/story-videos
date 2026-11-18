#!/bin/bash
# usage: ./voice.sh Alone   -> narration + timing, then a cue sheet for your own audio
mkdir -p out
python3 tools/narrate.py "$1" || exit 1
python3 tools/cues.py "$1"
