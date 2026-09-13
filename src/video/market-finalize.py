#!/usr/bin/env python3
"""Encode captured 16:9 market-video scenes to an exact timing plan and mux approved narration."""
import argparse
import json
import subprocess
from pathlib import Path


def source_for(clips, index):
    receipt = clips / f"scene-{index:02d}.json"
    if receipt.exists():
        value = json.loads(receipt.read_text()).get("videoPath")
        if value:
            source = Path(value)
            return source if source.is_absolute() else receipt.parent / source
    for extension in (".mp4", ".webm", ".mkv", ".mov"):
        candidate = clips / f"scene-{index:02d}{extension}"
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Missing captured scene {index:02d}")


def quote_concat(path):
    return str(path).replace("'", "'\\''")


def verify(output, timing, width, height):
    probe = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_streams", "-show_format", "-of", "json", str(output)], check=True, stdout=subprocess.PIPE, text=True)
    payload = json.loads(probe.stdout)
    video = next((stream for stream in payload["streams"] if stream.get("codec_type") == "video"), None)
    audio = next((stream for stream in payload["streams"] if stream.get("codec_type") == "audio"), None)
    expected_frames = sum(scene["frames"] for scene in timing["scenes"])
    duration = float(payload["format"]["duration"])
    if not video or video.get("codec_name") != "h264" or video.get("width") != width or video.get("height") != height:
        raise ValueError("Final video must be H.264 at the requested full-frame dimensions")
    if not audio or audio.get("codec_name") != "aac":
        raise ValueError("Final video requires AAC narration")
    frames = int(video.get("nb_read_frames") or video.get("nb_frames") or 0)
    if frames != expected_frames or abs(duration - timing["total"]) > 1 / timing["fps"]:
        raise ValueError("Final media does not match the timing plan")
    subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(output), "-f", "null", "-"], check=True)
    return {"duration": duration, "frames": frames, "video": video["codec_name"], "audio": audio["codec_name"]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--timing", required=True); parser.add_argument("--clips", required=True)
    parser.add_argument("--audio", required=True); parser.add_argument("--output", required=True)
    parser.add_argument("--width", type=int, default=1920); parser.add_argument("--height", type=int, default=1080)
    args = parser.parse_args()
    timing_path, clips, audio, output = (Path(args.timing).resolve(), Path(args.clips).resolve(),
                                        Path(args.audio).resolve(), Path(args.output).resolve())
    timing = json.loads(timing_path.read_text())
    if timing.get("tempo_modified") is not False or timing.get("fps") != 30:
        raise ValueError("Timing must attest 30fps and no speech-tempo modification")
    if not audio.exists():
        raise FileNotFoundError(f"Missing mixed narration: {audio}")
    encoded = output.parent / f".{output.stem}-encoded"; encoded.mkdir(parents=True, exist_ok=True)
    files = []
    for scene in timing["scenes"]:
        source = source_for(clips, scene["index"])
        if not source.exists(): raise FileNotFoundError(source)
        target = encoded / f"{scene['index']:02d}.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(source), "-an", "-vf",
                        f"fps=30,scale={args.width}:{args.height}:flags=lanczos,setsar=1,tpad=stop_mode=clone:stop_duration={scene['duration']}",
                        "-frames:v", str(scene["frames"]), "-c:v", "libx264", "-preset", "veryfast", "-crf", "18",
                        "-pix_fmt", "yuv420p", "-video_track_timescale", "15360", str(target)], check=True)
        files.append(target)
    concat = encoded / "concat.txt"; concat.write_text("".join(f"file '{quote_concat(path)}'\n" for path in files))
    temporary = output.with_suffix(".partial.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(concat), "-i", str(audio),
                    "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t",
                    str(timing["total"]), "-movflags", "+faststart", str(temporary)], check=True)
    temporary.replace(output)
    receipt = {"output": str(output), "seconds": timing["total"], "scenes": len(files),
               "timing": str(timing_path), "verification": verify(output, timing, args.width, args.height)}
    receipt_path = output.with_suffix(".receipt.json")
    receipt_path.write_text(json.dumps(receipt, indent=2))
    print(json.dumps({**receipt, "receipt": str(receipt_path)}))


if __name__ == "__main__":
    main()
