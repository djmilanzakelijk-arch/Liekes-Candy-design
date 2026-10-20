# Glass candy fruit ASMR (TikTok)

A 14-second vertical clip (1080×1920, 30 fps, AAC stereo) for TikTok, Reels and Shorts.
It follows the "AI ASMR glass fruit cutting" trend, but the fruit is made of sugar glass
to fit Lieke's Candy: a glass candy strawberry with a rainbow swirl inside, then a
glass kiwi. It ends on a Lieke's Candy card asking viewers which fruit to do next.

**Result:** [`glass-candy-fruit-asmr.mp4`](glass-candy-fruit-asmr.mp4)

Everything is generated here. There are no stock images, videos or sound effects:

| File | Role |
| --- | --- |
| `scene.js` | Canvas drawing. `render(t)` is a pure function of time and lists every sound cue in `EVENTS` |
| `index.html` | Opens the scene. Without `?capture` it plays a silent live preview |
| `render.mjs` | Captures every frame with headless Chromium (Playwright) and pipes them into ffmpeg |
| `audio.py` | Builds the crunches, board taps, shard tinks, whoosh and chime from noise and sine waves (numpy) |
| `build.sh` | Runs the steps above in order, then masters the audio (about −15.6 LUFS, below −1 dBTP) |

```bash
./promo/fruit-asmr/build.sh          # needs node + playwright, python3 + numpy, ffmpeg
node promo/fruit-asmr/render.mjs --stills 1,3.2,9   # quick PNG previews in out/
```

The text on screen is Dutch and stays within TikTok's safe zones. The hook text is at
the top, and the action sits clear of the right-hand buttons and the caption area.
The font is Baloo 2 (SIL OFL), the same family the game uses.
