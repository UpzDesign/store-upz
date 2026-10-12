import sharp from "sharp";
// Self-contained US Letter PDF invoice renderer. No browser or external font dependencies.
const clean=(s:string)=>String(s).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g," ");
const esc=(s:string)=>clean(s).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
const money=(n:number)=>"$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
export type InvoicePDFData={number:string;date:string;dueDate:string;billTo:string[];title:string;items:{description:string;quantity:number;rate:number}[];scope?:string;notes?:string;terms?:string;sender:{name:string;address:string[];email?:string;phone?:string;website?:string};logoSvg?:string|null;paymentInstructions?:string;footerNote?:string};
export async function renderInvoicePDF(data:InvoicePDFData):Promise<Buffer>{
 const pages:string[][]=[[]];let y=740;
 const page=()=>pages[pages.length-1];
 const cmd=(s:string)=>page().push(s);
 const text=(s:string,x:number,at:number,size=10,bold=false)=>cmd(`BT /F${bold?2:1} ${size} Tf 0 0 0 rg ${x} ${at} Td (${esc(s)}) Tj ET`);
 const rect=(x:number,at:number,w:number,h:number,r:number,g:number,b:number)=>cmd(`${r} ${g} ${b} rg ${x} ${at} ${w} ${h} re f`);
 const line=(x:number,at:number,w:number)=>rect(x,at,w,0.7,.72,.72,.72);
 const newPage=()=>{pages.push([]);y=748;text("UPZ DESIGN  /  INVOICE "+data.number,48,766,10,true);rect(48,754,516,3,1,.84,.32)};
 const ensure=(h:number)=>{if(y-h<85)newPage()};
 const wrap=(value:string,max=88)=>{const result:string[]=[];for(const paragraph of String(value).split(/\r?\n/).map(clean).join("\n").split("\n")){if(!paragraph.trim()){result.push("");continue}let current="";for(const word of paragraph.trim().split(/\s+/)){if((current+" "+word).trim().length>max){if(current)result.push(current);current=word}else current=(current+" "+word).trim()}if(current)result.push(current)}return result};
 const block=(value:string,x:number,max:number,size=10,step=15)=>{for(const row of wrap(value,max)){ensure(step);if(row)text(row,x,y,size);y-=step}};
 // Brand header and yellow accent, inspired by the supplied UPZ invoice.
 if(data.logoSvg){cmd("q 88 0 0 58 48 716 cm /Logo Do Q")}else{text("U P Z",48,748,18,true);text("D E S I G N",48,731,10,true)}
 text("INVOICE",458,738,19,true);rect(48,706,516,5,1,.84,.32);
 y=675;
 text("Billed To",48,y,12,true);text("Date of Issue",248,y,12,true);text("Invoice Number",430,y,12,true);
 y-=23;
 const billed=data.billTo.length?data.billTo:["Billing details not provided"];
 for(let i=0;i<Math.max(4,billed.length);i++){if(billed[i])text(billed[i],48,y-i*15,10)}
 text(data.date,248,y,10);text(data.number,430,y,10);
 text("Due Date",248,y-49,12,true);text("Amount Due (USD)",430,y-49,12,true);
 text(data.dueDate,248,y-70,10);
 const total=data.items.reduce((s,i)=>s+i.quantity*i.rate,0);
 text(money(total),430,y-74,15,true);
 y-=Math.max(4,billed.length)*15+46;
 ensure(60);rect(48,y-12,516,28,0,0,0);cmd("1 1 1 rg");
 // white text explicitly reset after fill
 cmd(`BT /F2 10 Tf 1 1 1 rg 66 ${y-3} Td (Description) Tj ET`);
 cmd(`BT /F2 10 Tf 1 1 1 rg 492 ${y-3} Td (Total) Tj ET`);
 y-=42;
 block(data.title,66,70,11,16);y-=5;
 if(data.scope){for(const row of wrap(data.scope,82)){ensure(16);if(row)text(row,77,y,9);y-=15}y-=9}
 for(const item of data.items){ensure(36);const sum=item.quantity*item.rate;const rows=wrap(item.description,62);for(let i=0;i<rows.length;i++){ensure(16);text(rows[i],66,y,i===0?10:9,i===0);if(i===0)text(money(sum),475,y,10);y-=16}if(item.quantity!==1){text(`Qty ${item.quantity} x ${money(item.rate)}`,77,y,9);y-=16}y-=7}
 ensure(105);y-=12;line(324,y,240);y-=23;text("Total Amount",340,y,11);text(money(total),476,y,11,true);y-=27;rect(324,y-10,240,28,0,0,0);cmd(`BT /F2 11 Tf 1 1 1 rg 340 ${y-1} Td (Amount Due) Tj ET`);cmd(`BT /F2 11 Tf 1 1 1 rg 474 ${y-1} Td (${esc(money(total))}) Tj ET`);y-=44;
 if(data.paymentInstructions){ensure(55);text("Payment Options",48,y,11,true);y-=19;block(data.paymentInstructions,48,83,9,14);y-=12}
 if(data.footerNote){ensure(35);block(data.footerNote,48,84,9,14);y-=10}
 if(data.terms){ensure(45);text("Payment Terms",48,y,11,true);y-=19;block(data.terms,48,82,9,14);y-=12}
 if(data.notes){ensure(45);text("Additional Notes",48,y,11,true);y-=19;block(data.notes,48,82,9,14)}
 // Footer on every page.
 pages.forEach((p,i)=>{p.push("0.7 0.7 0.7 rg 48 54 516 0.7 re f");p.push(`BT /F2 9 Tf 0 0 0 rg 48 38 Td (${esc(data.sender.name+"  -  NEW YORK CITY")}) Tj ET`);p.push(`BT /F1 8 Tf 0 0 0 rg 48 24 Td (${esc([data.sender.phone,data.sender.email,data.sender.website].filter(Boolean).join("  |  "))}) Tj ET`);p.push(`BT /F1 8 Tf 0 0 0 rg 540 24 Td (${i+1}) Tj ET`)});
 const objects:string[]=["","<< /Type /Pages /Kids [] /Count 0 >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>","<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
 let logoId=0;
 if(data.logoSvg){const raster=await sharp(Buffer.from(data.logoSvg)).resize({width:700,fit:"inside",withoutEnlargement:false}).flatten({background:"#ffffff"}).jpeg({quality:92}).toBuffer({resolveWithObject:true});const bytes=raster.data;logoId=objects.push(`<< /Type /XObject /Subtype /Image /Width ${raster.info.width} /Height ${raster.info.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n${bytes.toString("latin1")}\nendstream`)}
 const pageIds:number[]=[];
 for(const cmds of pages){const stream=cmds.join("\n");const contentId=objects.push(`<< /Length ${Buffer.byteLength(stream,"latin1")} >>\nstream\n${stream}\nendstream`);const pageId=objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << ${logoId?`/Logo ${logoId} 0 R`:""} >> >> /Contents ${contentId} 0 R >>`);pageIds.push(pageId)}
 objects[1]=`<< /Type /Pages /Kids [${pageIds.map(id=>id+" 0 R").join(" ")}] /Count ${pageIds.length} >>`;
 objects[0]="<< /Type /Catalog /Pages 2 0 R >>";
 let output="%PDF-1.4\n";const offsets=[0];objects.forEach((obj,i)=>{offsets.push(Buffer.byteLength(output,"latin1"));output+=`${i+1} 0 obj\n${obj}\nendobj\n`});
 const xref=Buffer.byteLength(output,"latin1");output+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(const off of offsets.slice(1))output+=String(off).padStart(10,"0")+" 00000 n \n";output+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return Buffer.from(output,"latin1");
}
