// Lightweight PDF writer for server-side invoice documents. Uses built-in PDF Helvetica fonts.
type Line={text:string;x:number;y:number;size:number;bold?:boolean};
const ascii=(value:string)=>value.normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7e]/g,"?");
const esc=(value:string)=>ascii(value).replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
const usd=(n:number)=>"$"+n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
export type InvoicePDFData={number:string;date:string;dueDate:string;billTo:string[];title:string;items:{description:string;quantity:number;rate:number}[];notes?:string;terms?:string;sender:{name:string;address:string[];email?:string;phone?:string}};
export function renderInvoicePDF(data:InvoicePDFData):Buffer{
 const pages:Line[][]=[[]];let y=750;
 const add=(text:string,x=48,size=11,bold=false)=>{if(y<76){pages.push([]);y=750}pages[pages.length-1].push({text,x,y,size,bold});y-=size+8};
 const wrap=(value:string,width=86)=>{const words=ascii(value).split(/\s+/),out:string[]=[];let line="";for(const word of words){if((line+" "+word).trim().length>width){if(line)out.push(line);line=word}else line=(line+" "+word).trim()}if(line)out.push(line);return out};
 add(data.sender.name,48,20,true);
 for(const row of data.sender.address)if(row) add(row,48,10);
 if(data.sender.email)add(data.sender.email,48,10);
 if(data.sender.phone)add(data.sender.phone,48,10);
 y-=20;add("INVOICE",48,23,true);
 add("Invoice #: "+data.number);add("Issued: "+data.date);add("Due: "+data.dueDate);
 y-=14;add("BILL TO",48,12,true);for(const row of data.billTo)if(row)add(row);
 y-=12;add("PROJECT / SERVICES",48,12,true);for(const row of wrap(data.title))add(row);
 y-=12;add("DESCRIPTION                                                    QTY       RATE        AMOUNT",48,10,true);
 add("________________________________________________________________________________",48,9);
 let subtotal=0;
 for(const item of data.items){const total=Math.round(item.quantity*item.rate*100)/100;subtotal+=total;for(const [index,row] of wrap(item.description,48).entries()){add(index===0?row.padEnd(55).slice(0,55)+String(item.quantity).padStart(5)+usd(item.rate).padStart(14)+usd(total).padStart(14):row,48,10)}y-=5}
 y-=10;add("SUBTOTAL: "+usd(subtotal),330,12,true);add("TOTAL DUE: "+usd(subtotal),330,14,true);
 if(data.terms){y-=12;add("PAYMENT TERMS",48,11,true);for(const row of wrap(data.terms))add(row,48,10)}
 if(data.notes){y-=12;add("NOTES",48,11,true);for(const row of wrap(data.notes))add(row,48,10)}
 const objects:string[]=[];const push=(s:string)=>{objects.push(s);return objects.length};
 const regular=push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),bold=push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
 const pageIds:number[]=[];const pageTreeId=3;
 for(const lines of pages){
  const stream=lines.map(l=>`BT /F${l.bold?2:1} ${l.size} Tf ${l.x} ${l.y} Td (${esc(l.text)}) Tj ET`).join("\n");
  const streamId=push(`<< /Length ${Buffer.byteLength(stream,"latin1")} >>\nstream\n${stream}\nendstream`);
  const pageId=push(`<< /Type /Page /Parent ${pageTreeId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${regular} 0 R /F2 ${bold} 0 R >> >> /Contents ${streamId} 0 R >>`);
  pageIds.push(pageId);
 }
 // Object 3 is the first stream if page content is present; reserve it as the page tree by inserting it before pages.
 const tree=`<< /Type /Pages /Kids [${pageIds.map(id=>id+" 0 R").join(" ")}] /Count ${pageIds.length} >>`;
 objects.splice(2,0,tree);
 // IDs for content and pages shifted by 1 after the insertion.
 const fixed=objects.map((obj,i)=>i===2?obj.replace(/(\d+) 0 R/g,(m,n)=>Number(n)>=3?Number(n)+1+" 0 R":m):i>2?obj.replace(/(\d+) 0 R/g,(m,n)=>Number(n)>=3?Number(n)+1+" 0 R":m):obj);
 const catalogId=fixed.length+1;fixed.push(`<< /Type /Catalog /Pages 3 0 R >>`);
 let pdf="%PDF-1.4\n";const offsets=[0];
 fixed.forEach((obj,i)=>{offsets.push(Buffer.byteLength(pdf,"latin1"));pdf+=`${i+1} 0 obj\n${obj}\nendobj\n`});
 const xref=Buffer.byteLength(pdf,"latin1");pdf+=`xref\n0 ${fixed.length+1}\n0000000000 65535 f \n`;
 for(const offset of offsets.slice(1))pdf+=String(offset).padStart(10,"0")+" 00000 n \n";
 pdf+=`trailer\n<< /Size ${fixed.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return Buffer.from(pdf,"latin1");
}
