import {readFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
const types={'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.webp':'image/webp','.avif':'image/avif','.mp4':'video/mp4','.webm':'video/webm','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
/** Local deck assets travel with the generated HTML, including on GitHub Pages. */
export function embedDeckAssets(deck,directory){
 const embed=src=>{if(!src||/^(?:[a-z][\w+.-]*:|\/\/)/i.test(src))return src;const mime=types[extname(src).toLowerCase()];if(!mime)throw Error('Unsupported presentation asset: '+src);const bytes=readFileSync(resolve(directory,src));if(bytes.length>50*1024*1024)throw Error('Asset exceeds 50 MB: '+src);return `data:${mime};base64,${bytes.toString('base64')}`;};
 for(const slide of deck.slides){for(const key of ['image','visual','media'])if(slide[key]){slide[key].src=embed(slide[key].src);if(slide[key].poster)slide[key].poster=embed(slide[key].poster);}if(slide.background?.type==='image')slide.background.value=embed(slide.background.value);}
 return deck;
}
