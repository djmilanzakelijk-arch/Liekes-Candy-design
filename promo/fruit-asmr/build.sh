#!/usr/bin/env bash
# Renders the clip end-to-end: frames → soundtrack → mastered MP4.
set -euo pipefail
cd "$(dirname "$0")"
node render.mjs
python3 audio.py
ffmpeg -y -loglevel error -i out/frames.mp4 -i out/audio.wav \
  -filter:a "acompressor=threshold=-28dB:ratio=4:attack=1:release=60:makeup=8,alimiter=limit=0.8:level=false,volume=3.5dB,aresample=192000,alimiter=limit=0.76:attack=1:release=40:level=false,aresample=48000" \
  -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart glass-candy-fruit-asmr.mp4
echo "wrote $(pwd)/glass-candy-fruit-asmr.mp4"
