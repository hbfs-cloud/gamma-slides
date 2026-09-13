#!/usr/bin/env python3
"""Plan and mix reviewed market-video narration without changing speech tempo."""
import argparse
import array
import json
import math
import subprocess
import wave
from pathlib import Path


def load_json(path):
    return json.loads(Path(path).read_text())


def plan(deck, voice, target_seconds, fps, lead, gap, tail):
    slides = deck.get("slides")
    rows = voice if isinstance(voice, list) else voice.get("items") if isinstance(voice, dict) else None
    if not isinstance(slides, list) or not slides or not isinstance(rows, list):
        raise ValueError("Deck slides and voice items are required")
    expected = [(scene, part, text.strip()) for scene, slide in enumerate(slides)
                for part, text in enumerate(str(slide.get("narration", "")).split("\n\n")) if text.strip()]
    actual = [(row.get("scene"), row.get("part"), str(row.get("text", "")).strip()) for row in rows]
    if actual != expected:
        raise ValueError("Voice segments must exactly match reviewed deck narration")
    for row in rows:
        duration = float(row.get("duration", 0))
        if not math.isfinite(duration) or duration <= 0:
            raise ValueError("Every voice segment requires a positive finite measured duration")
    target_frames = round(target_seconds * fps)
    if not math.isclose(target_frames / fps, target_seconds, abs_tol=1e-9):
        raise ValueError("target-seconds must align to whole video frames")
    grouped = [[row for row in rows if row["scene"] == scene] for scene in range(len(slides))]
    base_frames = []
    for group in grouped:
        spoken = sum(float(row["duration"]) for row in group)
        minimum = lead + spoken + max(0, len(group) - 1) * gap + tail
        base_frames.append(math.ceil(minimum * fps))
    required = sum(base_frames)
    if required > target_frames:
        raise ValueError(f"Narration needs at least {required / fps:.2f}s; shorten the reviewed script, never speed it up")
    extra, remainder = divmod(target_frames - required, len(slides))
    frames = [value + extra + (1 if index < remainder else 0) for index, value in enumerate(base_frames)]
    scenes, segments, cursor = [], [], 0
    for index, (slide, group, scene_frames) in enumerate(zip(slides, grouped, frames)):
        start = cursor / fps
        offset = lead
        for row in group:
            scheduled = {**row, "start": start + offset, "end": start + offset + float(row["duration"])}
            segments.append(scheduled)
            offset += float(row["duration"]) + gap
        scenes.append({"index": index, "title": slide.get("title") or f"Scene {index + 1}",
                       "start": start, "duration": scene_frames / fps, "frames": scene_frames})
        cursor += scene_frames
    return {"total": target_frames / fps, "spoken": sum(float(row["duration"]) for row in rows),
            "tempo_modified": False, "fps": fps, "scenes": scenes, "segments": segments}


def pcm(path, sample_rate):
    result = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "s16le", "-ar",
                             str(sample_rate), "-ac", "1", "pipe:1"], check=True, stdout=subprocess.PIPE)
    data = array.array("h")
    data.frombytes(result.stdout)
    return data


def mix(timing, voice_root, output):
    sample_rate = 48000
    samples = round(timing["total"] * sample_rate)
    result = array.array("h", [0]) * samples
    scenes = {scene["index"]: scene for scene in timing["scenes"]}
    occupied_until = 0
    for row in timing["segments"]:
        source = Path(row["path"])
        if not source.is_absolute():
            source = voice_root / source
        audio = pcm(source, sample_rate)
        start = round(row["start"] * sample_rate)
        planned_samples = round(float(row["duration"]) * sample_rate)
        if abs(len(audio) - planned_samples) > 1:
            raise ValueError(f"Decoded duration differs from approved schedule: {source}")
        scene = scenes[row["scene"]]
        scene_end = round((scene["start"] + scene["duration"]) * sample_rate)
        if start < occupied_until or start + len(audio) > scene_end or start + len(audio) > len(result):
            raise ValueError(f"Narration exceeds its scene: {source}")
        for offset, value in enumerate(audio):
            value = result[start + offset] + value
            result[start + offset] = max(-32768, min(32767, value))
        occupied_until = start + len(audio)
    peak = max((abs(value) for value in result), default=0)
    if peak:
        gain = min(2.5, 32767 * .84 / peak)
        result = array.array("h", (round(value * gain) for value in result))
    temporary = output.with_suffix(".partial.wav")
    with wave.open(str(temporary), "wb") as wav:
        wav.setnchannels(1); wav.setsampwidth(2); wav.setframerate(sample_rate); wav.writeframes(result.tobytes())
    temporary.replace(output)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deck", required=True); parser.add_argument("--voice-manifest", required=True)
    parser.add_argument("--output", required=True); parser.add_argument("--target-seconds", type=float, default=1800)
    parser.add_argument("--fps", type=int, default=30); parser.add_argument("--lead", type=float, default=.8)
    parser.add_argument("--gap", type=float, default=1.1); parser.add_argument("--tail", type=float, default=3)
    parser.add_argument("--plan-only", action="store_true")
    args = parser.parse_args()
    if args.fps <= 0 or min(args.lead, args.gap, args.tail) < 0:
        raise ValueError("fps must be positive and timing values cannot be negative")
    output = Path(args.output); output.mkdir(parents=True, exist_ok=True)
    voice_path = Path(args.voice_manifest)
    timing = plan(load_json(args.deck), load_json(voice_path), args.target_seconds, args.fps, args.lead, args.gap, args.tail)
    temporary = output / "timing.partial.json"; temporary.write_text(json.dumps(timing, indent=2)); temporary.replace(output / "timing.json")
    if not args.plan_only:
        mix(timing, voice_path.parent, output / "voice-full.wav")
    print(json.dumps({"total": timing["total"], "spoken": timing["spoken"], "scenes": len(timing["scenes"]), "tempo_modified": False}))


if __name__ == "__main__":
    main()
