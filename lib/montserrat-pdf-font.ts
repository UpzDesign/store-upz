import {readFile} from "node:fs/promises";
import path from "node:path";

/** Embedded Montserrat glyph data for the self-contained invoice PDF. */
export async function loadInvoiceFont(weight:"regular"|"bold"="regular"){
 const fileName=weight==="bold"?"montserrat-bold.ttf.base64":"montserrat.ttf.base64";
 const base64=await readFile(path.join(process.cwd(),"lib/fonts",fileName),"utf8");
 const font=Buffer.from(base64.replace(/\s/g,""),"base64");
 const u16=(p:number)=>font.readUInt16BE(p),i16=(p:number)=>font.readInt16BE(p),u32=(p:number)=>font.readUInt32BE(p);
 const tables=new Map<string,number>();
 const count=u16(4);
 for(let i=0;i<count;i++){const p=12+i*16;tables.set(font.toString("ascii",p,p+4),u32(p+8))}
 const table=(name:string)=>{const v=tables.get(name);if(v===undefined)throw new Error("Montserrat missing "+name);return v};
 const head=table("head"),hhea=table("hhea"),hmtx=table("hmtx"),cmap=table("cmap"),maxp=table("maxp");
 const units=u16(head+18),glyphs=u16(maxp+4),numMetrics=u16(hhea+34);
 const advances=Array.from({length:glyphs},(_,i)=>Math.round(u16(hmtx+Math.min(i,numMetrics-1)*4)*1000/units));
 const cmapCount=u16(cmap+2);let chosen=-1,priority=-1;
 for(let i=0;i<cmapCount;i++){const p=cmap+4+i*8,platform=u16(p),encoding=u16(p+2),offset=cmap+u32(p+4),format=u16(offset);
 const score=format===12?4:format===4?3:0;
 if(score>priority&&(platform===3||platform===0)){chosen=offset;priority=score}
 }
 if(chosen<0)throw new Error("Montserrat cmap not found");
 const format=u16(chosen);
 const glyph=(code:number):number=>{
  if(format===12){const n=u32(chosen+12);let lo=0,hi=n-1;while(lo<=hi){const m=(lo+hi)>>>1,p=chosen+16+m*12,start=u32(p),end=u32(p+4);if(code<start)hi=m-1;else if(code>end)lo=m+1;else return u32(p+8)+code-start}return 0}
  const segments=u16(chosen+6)/2,ends=chosen+14,starts=ends+segments*2+2,deltas=starts+segments*2,ranges=deltas+segments*2;
  for(let i=0;i<segments;i++){const end=u16(ends+i*2);if(code>end)continue;const start=u16(starts+i*2);if(code<start)return 0;const delta=i16(deltas+i*2),range=u16(ranges+i*2);if(!range)return(code+delta)&65535;const p=ranges+i*2+range+2*(code-start);const id=u16(p);return id?(id+delta)&65535:0}return 0;
 };
 const encode=(value:string)=>Array.from(value).map(ch=>glyph(ch.codePointAt(0)??32).toString(16).padStart(4,"0")).join("");
 const bbox=[i16(head+36),i16(head+38),i16(head+40),i16(head+42)].map(v=>Math.round(v*1000/units));
 const ascent=Math.round(i16(hhea+4)*1000/units),descent=Math.round(i16(hhea+6)*1000/units);
 const mappings=Array.from({length:95},(_,i)=>{const code=i+32;return "<"+glyph(code).toString(16).padStart(4,"0")+"> <"+code.toString(16).padStart(4,"0")+">"}).join("\n");
 const toUnicode="/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Montserrat-UCS def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n95 beginbfchar\n"+mappings+"\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend";
 return {font,encode,advances,bbox,ascent,descent,toUnicode};
}
