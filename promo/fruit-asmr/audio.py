"""Synthesises the ASMR soundtrack from out/events.json (written by render.mjs).

Every sound is generated from noise and sine partials, so the clip has no
third-party audio. Output: out/audio.wav (48 kHz, 16-bit stereo).
"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48_000
HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
rng = np.random.default_rng(20261020)


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def highpass(x):
    return np.diff(x, prepend=0.0)


def lowpass(x, width):
    if width <= 1:
        return x
    k = np.ones(int(width)) / int(width)
    return np.convolve(x, k, mode="same")


def ring(freq, dur, tau, amp):
    n = int(dur * SR)
    t = np.arange(n) / SR
    return amp * np.sin(2 * np.pi * freq * t + rng.uniform(0, 6.28)) * env_exp(n, tau)


def click(amp, ms=1.2):
    n = max(8, int(ms / 1000 * SR))
    return amp * highpass(rng.standard_normal(n)) * env_exp(n, ms / 3000)


def crunch(strength):
    """Brittle sugar-glass crack: a sharp click, granular crackle, glassy ring."""
    dur = 0.22
    out = np.zeros(int(dur * SR))
    c = click(1.2 * strength, 1.6)
    out[: len(c)] += c
    grains = int(30 + 34 * strength)
    for _ in range(grains):
        pos = int(abs(rng.normal(0, 0.035)) * SR)
        n = int(rng.uniform(0.0003, 0.003) * SR)
        if pos + n >= len(out):
            continue
        g = highpass(rng.standard_normal(n)) * env_exp(n, n / SR / 3)
        out[pos : pos + n] += g * rng.uniform(0.35, 1.0) * strength * np.exp(-pos / (0.06 * SR))
    for _ in range(3):
        r = ring(rng.uniform(2200, 6800), dur, rng.uniform(0.03, 0.09), 0.09 * strength)
        out[: len(r)] += r
    body = ring(rng.uniform(130, 240), 0.06, 0.018, 0.25 * strength)
    out[: len(body)] += body
    return out


def board_tock():
    out = ring(205, 0.25, 0.05, 0.32) + ring(410, 0.25, 0.03, 0.12) + ring(1850, 0.25, 0.06, 0.04)
    c = click(0.35, 2.5)
    out[: len(c)] += lowpass(c, 3)
    return out


def land():
    out = ring(rng.uniform(2400, 2900), 0.4, 0.11, 0.16) + ring(rng.uniform(3900, 4700), 0.4, 0.07, 0.1)
    out += ring(320, 0.4, 0.03, 0.25)
    c = click(0.45, 1.5)
    out[: len(c)] += c
    # tiny second bounce
    d = int(0.07 * SR)
    b = ring(rng.uniform(2400, 2900), 0.2, 0.05, 0.06)
    out[d : d + len(b)] += b[: len(out) - d]
    return out


def tink(strength):
    out = ring(rng.uniform(4500, 9500), 0.12, 0.03, 0.12 * strength)
    c = click(0.12 * strength, 0.6)
    out[: len(c)] += c
    return out


def lift():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    e = np.minimum(t / 0.12, 1) * np.exp(-np.maximum(t - 0.12, 0) / 0.09)
    out = highpass(highpass(rng.standard_normal(n))) * e * 0.035
    out += ring(3150, 0.45, 0.18, 0.025)
    return out


def whoosh():
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    e = np.sin(np.pi * np.clip(t / 0.6, 0, 1)) ** 2
    noise = rng.standard_normal(n)
    # sweep: blend progressively less-smoothed noise
    lo, hi = lowpass(noise, 40), lowpass(noise, 6)
    mix = np.clip(t / 0.45, 0, 1)
    return (lo * (1 - mix) + hi * mix) * e * 0.2


def chime():
    notes = [1046.5, 1318.5, 1568.0, 2093.0]
    out = np.zeros(int(1.6 * SR))
    for i, f in enumerate(notes):
        d = int(i * 0.075 * SR)
        tone = ring(f, 1.2, 0.3, 0.06) + ring(f * 2.76, 1.2, 0.1, 0.02)
        out[d : d + len(tone)] += tone[: len(out) - d]
    return out


def main():
    info = json.loads((OUT / "events.json").read_text())
    total = int((info["duration"] + 0.3) * SR)
    left = np.zeros(total)
    right = np.zeros(total)

    # quiet room tone for that close-mic ASMR feel
    room = lowpass(rng.standard_normal(total), 12) * 0.006
    left += room
    right += lowpass(rng.standard_normal(total), 12) * 0.006

    makers = {
        "crack": lambda e: crunch(e.get("strength", 1.0)),
        "board": lambda e: board_tock(),
        "land": lambda e: land(),
        "tink": lambda e: tink(min(1.2, e.get("strength", 0.6))),
        "lift": lambda e: lift(),
        "whoosh": lambda e: whoosh(),
        "chime": lambda e: chime(),
    }
    for e in info["events"]:
        snd = makers[e["type"]](e)
        start = int(e["t"] * SR)
        if start >= total:
            continue
        snd = snd[: total - start]
        pan = rng.uniform(-0.35, 0.35) if e["type"] in ("tink", "crack") else 0.0
        left[start : start + len(snd)] += snd * (1 - pan)
        right[start : start + len(snd)] += snd * (1 + pan)

    stereo = np.stack([left, right], axis=1)
    stereo *= 0.89 / np.max(np.abs(stereo))
    pcm = (stereo * 32767).astype("<i2")
    with wave.open(str(OUT / "audio.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", OUT / "audio.wav", f"{total / SR:.2f}s")


if __name__ == "__main__":
    sys.exit(main())
