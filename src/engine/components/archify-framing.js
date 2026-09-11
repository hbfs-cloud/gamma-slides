// The upstream SVG stays semantically intact. The slide adapter frames only the
// populated graph, excluding empty bands and the standalone viewer's legend.
export function frameDiagramSVG(svg, type, textSizes = null) {
  const points=[];
  const attr=(tag,name)=>Number(tag.match(new RegExp(`\\b${name}="([^\"]+)"`))?.[1]);
  for(const match of svg.matchAll(/<g\b[^>]*data-node-id="[^"]+"[^>]*>[\s\S]*?<rect\b([^>]+)>/g)) {
    const [x,y,width,height]=['x','y','width','height'].map(name=>attr(match[1],name));
    if([x,y,width,height].every(Number.isFinite))points.push([x,y],[x+width,y+height]);
  }
  for(const match of svg.matchAll(/data-composition-points="([^"]+)"/g))for(const pair of match[1].split(';')) {const xy=pair.split(',').map(Number);if(xy.length===2&&xy.every(Number.isFinite))points.push(xy);}
  if(!points.length)return svg;
  let minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  // Keep populated lane/stage headings; unused lifecycle outcome bands are outside this frame.
  for(const match of svg.matchAll(/<text\b([^>]*class="t-dim"[^>]*)>/g)){const y=attr(match[1],'y');if(Number.isFinite(y)&&y<maxY)minY=Math.min(minY,y-12);}
  const padding=28;
  let result=svg.replace(/viewBox="[^"]+"/,`viewBox="${minX-padding} ${minY-padding} ${maxX-minX+padding*2} ${maxY-minY+padding*2}"`);
  const sizes=textSizes || (type==='architecture'?{node:14,context:10,edge:12}:type==='sequence'?{node:16,context:12,edge:12}:null);
  if(sizes)result=result.replace(/<text\b([^>]*)>/g,(whole,attributes)=>{
    if(attributes.includes('class="t-dim"'))return whole;
    const size=attributes.includes('data-node-label')?sizes.node:attributes.includes('data-detail="context"')?sizes.context:sizes.edge;
    return `<text${attributes.replace(/font-size="[^"]+"/,`font-size="${size}"`)}>`;
  });
  if(type==='workflow' && textSizes)result=result.replace(/(<g\b[^>]*data-node-id="[^"]+"[^>]*>)([\s\S]*?)(<text\b[^>]*data-node-label[^>]*>)/g,(whole,group,body,label)=>{
    const rect=body.match(/<rect\b([^>]+)>/)?.[1];
    if(!rect)return whole;
    const [x,y,width,height]=['x','y','width','height'].map(name=>attr(rect,name));
    if(![x,y,width,height].every(Number.isFinite))return whole;
    return group+body+label.replace(/\bx="[^"]+"/,`x="${x+width/2}"`).replace(/\by="[^"]+"/,`y="${y+height/2+sizes.node*.33}"`);
  });
  // Relationship masks follow the enlarged labels, without changing routes.
  if(sizes)result=result.replace(/(<g\b[^>]*data-edge-from[^>]*>\s*)<rect\b([^>]+)\/>\s*(<text\b[^>]*>)([^<]*)(<\/text>)/g,(whole,group,attributes,text,label,end)=>{
    const x=attr(attributes,'x'),width=attr(attributes,'width'),y=attr(attributes,'y'),height=attr(attributes,'height');
    const nextWidth=Math.max(width,label.replace(/&[^;]+;/g,'x').length*sizes.edge*.62+12),nextHeight=Math.max(height,sizes.edge+8);
    return `${group}<rect${attributes.replace(/\bx="[^"]+"/,`x="${x+(width-nextWidth)/2}"`).replace(/\by="[^"]+"/,`y="${y+(height-nextHeight)/2}"`).replace(/\bwidth="[^"]+"/,`width="${nextWidth}"`).replace(/\bheight="[^"]+"/,`height="${nextHeight}"`)}/>${text}${label}${end}`;
  });
  // Explicitly suppress standalone legend content: SVG letterboxing may paint
  // outside a cropped viewBox. Relationships remain in the accessible menu.
  return result.replace(/<g\b([^>]*\bdata-legend=""[^>]*)>/g,'<g$1 style="display:none">');
}
