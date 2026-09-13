#!/usr/bin/env python3
"""Create cached Qwen VoiceDesign narration segments for a reviewed market-video deck."""
import argparse
import hashlib
import json
from pathlib import Path


def paragraphs(deck):
    if not isinstance(deck.get("slides"), list) or not deck["slides"]:
        raise ValueError("Deck requires a non-empty slides array")
    rows = []
    for scene, slide in enumerate(deck["slides"]):
        narration = slide.get("narration")
        if not isinstance(narration, str) or not narration.strip():
            raise ValueError(f"Slide {scene} requires reviewed narration")
        for part, text in enumerate(piece.strip() for piece in narration.split("\n\n") if piece.strip()):
            rows.append({"scene": scene, "part": part, "text": text})
    return rows


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--deck", required=True, help="Reviewed JSON deck containing slides[].narration")
    parser.add_argument("--output", required=True)
    parser.add_argument("--model", required=True, help="Local Qwen VoiceDesign model path")
    parser.add_argument("--profile", required=True, help="Approved VoiceDesign JSON profile")
    parser.add_argument("--seed", type=int)
    args = parser.parse_args()

    deck = json.loads(Path(args.deck).read_text())
    profile = json.loads(Path(args.profile).read_text())
    if not isinstance(profile.get("instruct"), str) or not profile["instruct"].strip():
        raise ValueError("Voice profile requires a reviewed instruct string")
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    model_path = str(Path(args.model).resolve())
    seed = args.seed if args.seed is not None else profile.get("seed", 20260914)

    # Keep heavyweight local dependencies out of validation and cache-only paths.
    import mlx.core as mx
    import numpy as np
    import soundfile as sf
    from mlx_audio.tts.utils import load_model

    model = None
    rows = []
    for item in paragraphs(deck):
        fingerprint = hashlib.sha256(json.dumps(
            [item["text"], profile, model_path, seed], sort_keys=True
        ).encode()).hexdigest()
        path = output / f"{fingerprint}.wav"
        if not path.exists():
            if model is None:
                model = load_model(model_path)
            mx.random.seed(seed)
            generated = list(model.generate_voice_design(
                text=item["text"], instruct=profile["instruct"], language="English",
                temperature=.72, top_p=.9, max_tokens=2200, verbose=False,
            ))
            audio = np.concatenate([np.asarray(result.audio) for result in generated if result.audio is not None])
            temporary = path.with_suffix(".partial.wav")
            sf.write(str(temporary), audio, generated[0].sample_rate)
            temporary.replace(path)
            mx.clear_cache()
        rows.append({**item, "path": path.name, "duration": sf.info(path).duration, "fingerprint": fingerprint})
        temporary_manifest = output / "segments.partial.json"
        temporary_manifest.write_text(json.dumps({"items": rows}, indent=2))
        temporary_manifest.replace(output / "segments.json")
        print(json.dumps({"scene": item["scene"], "part": item["part"], "duration": round(rows[-1]["duration"], 2)}), flush=True)


if __name__ == "__main__":
    main()
