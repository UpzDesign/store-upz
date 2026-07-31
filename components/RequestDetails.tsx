type Detail={label:string;value:string};

const LABELS=["Property Address","Coverage","Condition","Access Instructions","Attachments","Notes","Property Type","Square Footage","Floors Spaces","Floors / Spaces","Furnished","Staging Required"];

function cleanSource(value?:string|null){
 return String(value||"").split("__UPZ_CONTEXT__")[0].split("__UPZ_DECISION__")[0].trim();
}

export function parseRequestDetails(value?:string|null){
 const source=cleanSource(value);
 if(!source)return{details:[] as Detail[],summary:""};
 const escaped=LABELS.map(label=>label.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|");
 const matches=[...source.matchAll(new RegExp(`(?:^|\\s)(${escaped})\\s*:\\s*`,"gi"))];
 if(!matches.length)return{details:[] as Detail[],summary:source};
 const details=matches.map((match,index)=>{
  const start=(match.index||0)+match[0].length;
  const end=index+1<matches.length?(matches[index+1].index||source.length):source.length;
  return{label:match[1].replace("Floors Spaces","Floors / Spaces"),value:source.slice(start,end).trim()};
 }).filter(item=>item.value&&!["none","n/a","na"].includes(item.value.toLowerCase()));
 const summary=source.slice(0,matches[0].index||0).trim();
 return{details,summary};
}

function DetailValue({value}:{value:string}){
 const urls=value.match(/https?:\/\/[^\s,]+/g)||[];
 if(!urls.length)return <>{value}</>;
 const parts=value.split(/(https?:\/\/[^\s,]+)/g);
 return <>{parts.map((part,index)=>/^https?:\/\//.test(part)?<a key={index} href={part} target="_blank" rel="noreferrer">Open attachment ↗</a>:part)}</>;
}

export default function RequestDetails({value,className=""}:{value?:string|null;className?:string}){
 const{details,summary}=parseRequestDetails(value);
 if(!details.length)return summary?<p className={`request-detail-summary ${className}`.trim()}>{summary}</p>:null;
 return <div className={`request-detail-block ${className}`.trim()}>
  {summary&&<p className="request-detail-summary">{summary}</p>}
  <dl className="request-detail-grid">{details.map((item,index)=><div key={`${item.label}-${index}`}><dt>{item.label}</dt><dd><DetailValue value={item.value}/></dd></div>)}</dl>
 </div>;
}
