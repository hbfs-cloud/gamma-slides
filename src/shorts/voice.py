"""Cached Qwen VoiceDesign speech for reviewed market Shorts; no time stretching."""
import argparse, hashlib, json
from pathlib import Path

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--file',required=True);p.add_argument('--output',required=True)
    p.add_argument('--model',required=True);p.add_argument('--profile',required=True)
    p.add_argument('--tickers');a=p.parse_args()
    import mlx.core as mx
    import numpy as np
    import soundfile as sf
    from mlx_audio.tts.utils import load_model
    source=json.loads(Path(a.file).read_text())
    cards=source if isinstance(source,list) else source.get('cards',source.get('items'))
    if a.tickers:cards=[c for c in cards if c['ticker'] in a.tickers.split(',')]
    profile=json.loads(Path(a.profile).read_text());out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
    manifest=out/'manifest.json'
    previous=json.loads(manifest.read_text()).get('items',[]) if manifest.exists() else []
    items={row['ticker']:row for row in previous}
    model=None
    for c in cards:
        text=c['narration'];digest=hashlib.sha256(json.dumps([text,profile,str(Path(a.model).resolve())],sort_keys=True).encode()).hexdigest()
        path=out/(digest+'.wav')
        if not path.exists():
            if model is None:model=load_model(a.model)
            mx.random.seed(profile.get('seed',20260914))
            result=list(model.generate_voice_design(text=text,instruct=profile['instruct'],language='English',temperature=.72,top_p=.9,max_tokens=2200,verbose=False))
            samples=np.concatenate([np.asarray(r.audio) for r in result if r.audio is not None])
            temporary=path.with_suffix('.partial.wav')
            sf.write(str(temporary),samples,result[0].sample_rate);temporary.replace(path);mx.clear_cache()
        duration=sf.info(path).duration
        row={'ticker':c['ticker'],'text':text,'path':path.name,'duration':duration,'fingerprint':digest}
        items[c['ticker']]=row
        temporary_manifest=manifest.with_suffix('.partial.json')
        temporary_manifest.write_text(json.dumps({'items':list(items.values())},indent=2));temporary_manifest.replace(manifest)
        print(json.dumps({'ticker':c['ticker'],'duration':duration,'ready':duration<=27.8}),flush=True)
        if duration>27.8:print('NARRATION_TOO_LONG: shorten the reviewed text. Audio was not accelerated.',flush=True)

if __name__=='__main__':main()
