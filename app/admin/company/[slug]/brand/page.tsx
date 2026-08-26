"use client";

import {useEffect,useMemo,useState} from "react";
import {useParams} from "next/navigation";
import {AdminButton,AdminField,AdminFormGrid,AdminHeader,AdminPage,AdminSection,AdminSectionHeader} from "@/components/admin/AdminUI";
import CompanyLogo from "@/components/CompanyLogo";

type Company={name:string;slug:string;shortName:string;logo?:string|null;logoType:string;logoText?:string|null;logoTextColor?:string|null;logoFontStyle?:string|null;primaryColor:string;secondaryColor:string;heroTitle:string;heroText:string;portalEnabled:boolean};

const FILE_TYPES=["image/svg+xml","image/png","image/webp"];
function luminance(hex:string){const clean=hex.replace("#","");if(clean.length!==6)return .5;const [r,g,b]=[0,2,4].map(i=>parseInt(clean.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4));return .2126*r+.7152*g+.0722*b;}
function autoContrast(hex:string){return luminance(hex)>.45?"#111111":"#ffffff";}
function isUploadedLogo(value?:string|null){return Boolean(value?.startsWith("data:image/"));}

export default function CompanyBrandPage(){
 const params=useParams(),slug=Array.isArray(params.slug)?params.slug[0]:String(params.slug||"");
 const[company,setCompany]=useState<Company|null>(null),[saving,setSaving]=useState(false),[message,setMessage]=useState(""),[uploadError,setUploadError]=useState(""),[logoUrl,setLogoUrl]=useState("");
 useEffect(()=>{fetch(`/api/admin/companies/${slug}`,{cache:"no-store"}).then(r=>r.json()).then(data=>{setCompany(data);setLogoUrl(isUploadedLogo(data?.logo)?"":String(data?.logo||""))})},[slug]);
 const contrastMode=useMemo(()=>{if(!company)return"auto";const color=(company.logoTextColor||"").toLowerCase();if(color==="#ffffff")return"light";if(color==="#111111"||color==="#010101"||color==="#000000")return"dark";return color===autoContrast(company.primaryColor).toLowerCase()?"auto":"custom"},[company]);
 if(!company)return <AdminPage><p>Loading brand settings...</p></AdminPage>;
 const currentCompany=company;
 const set=(key:keyof Company,value:any)=>setCompany(c=>c?{...c,[key]:value}:c);
 function applyContrast(mode:string){if(mode==="auto")set("logoTextColor",autoContrast(currentCompany.primaryColor));if(mode==="light")set("logoTextColor","#ffffff");if(mode==="dark")set("logoTextColor","#111111");}
 function uploadLogo(file?:File){if(!file)return;setUploadError("");if(!FILE_TYPES.includes(file.type)){setUploadError("Use SVG, PNG, or WebP.");return}if(file.size>1.5*1024*1024){setUploadError("Logo must be 1.5 MB or smaller.");return}const reader=new FileReader();reader.onload=()=>{set("logo",String(reader.result||""));set("logoType","image");setLogoUrl("");setMessage("New logo ready. Save Brand Settings to apply it.")};reader.onerror=()=>setUploadError("Unable to read logo file.");reader.readAsDataURL(file)}
 function useLogoUrl(value:string){setLogoUrl(value);set("logo",value.trim());set("logoType","image");}
 function removeLogo(){set("logo",null);setLogoUrl("");setUploadError("");setMessage("Logo removed locally. Save Brand Settings to apply the change.")}
 async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setMessage("");const r=await fetch(`/api/admin/companies/${slug}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(currentCompany)}),d=await r.json();setSaving(false);setMessage(r.ok?"Brand and contrast settings saved.":d?.error||"Unable to save");if(r.ok){setCompany(d);setLogoUrl(isUploadedLogo(d?.logo)?"":String(d?.logo||""))}}
 const preview={...currentCompany,logoText:currentCompany.logoText||currentCompany.shortName};
 const hasLogo=Boolean(currentCompany.logo);
 return <AdminPage className="company-brand-page"><AdminHeader eyebrow="Company Settings" title={`${currentCompany.name} Brand`} description="Use the same logo, colors, and contrast rules that power the client portal and new-client setup." actions={<AdminButton href={`/admin/company/${slug}`}>Back to Company</AdminButton>}/><form onSubmit={save}><AdminSection><AdminSectionHeader eyebrow="Identity" title="Logo, color, and contrast"/><AdminFormGrid>
  <AdminField label="Logo Type"><select value={currentCompany.logoType} onChange={e=>set("logoType",e.target.value)}><option value="image">Image logo</option><option value="text">Text wordmark</option><option value="none">No logo</option></select></AdminField>
  {currentCompany.logoType==="image"&&<><AdminField label={hasLogo?"Replace Logo":"Upload Logo"} className="wide"><input type="file" accept=".svg,.png,.webp,image/svg+xml,image/png,image/webp" onChange={e=>uploadLogo(e.target.files?.[0])}/><small>SVG, PNG, or WebP · max 1.5 MB. Selecting a new file replaces the current logo after you save.</small>{uploadError&&<small className="admin-error">{uploadError}</small>}{hasLogo&&<div style={{marginTop:10}}><AdminButton variant="danger" type="button" onClick={removeLogo}>Remove Current Logo</AdminButton></div>}</AdminField><AdminField label="Logo URL / Path" className="wide"><input value={logoUrl} onChange={e=>useLogoUrl(e.target.value)} placeholder={isUploadedLogo(currentCompany.logo)?"Uploaded logo is currently in use":"Optional hosted logo URL or path"}/><small>{isUploadedLogo(currentCompany.logo)?"An uploaded logo is active. Entering a URL here will replace it.":"Use this only when the logo is hosted elsewhere."}</small></AdminField></>}
  {currentCompany.logoType==="text"&&<><AdminField label="Wordmark Text"><input value={currentCompany.logoText||currentCompany.shortName} onChange={e=>set("logoText",e.target.value)}/></AdminField><AdminField label="Wordmark Style"><select value={currentCompany.logoFontStyle||"sans"} onChange={e=>set("logoFontStyle",e.target.value)}><option value="sans">Sans Bold</option><option value="serif">Serif</option><option value="light">Sans Light</option><option value="condensed">Condensed Bold</option></select></AdminField></>}
  <AdminField label="Primary Brand Color"><input type="color" value={currentCompany.primaryColor} onChange={e=>{set("primaryColor",e.target.value);if(contrastMode==="auto")set("logoTextColor",autoContrast(e.target.value))}}/></AdminField><AdminField label="Secondary Color"><input type="color" value={currentCompany.secondaryColor} onChange={e=>set("secondaryColor",e.target.value)}/></AdminField>
  <AdminField label="On-Brand / Wordmark Color" className="wide"><div className="admin-brand-contrast-actions"><button type="button" className={contrastMode==="auto"?"active":""} onClick={()=>applyContrast("auto")}>Auto Contrast</button><button type="button" className={contrastMode==="light"?"active":""} onClick={()=>applyContrast("light")}>Light</button><button type="button" className={contrastMode==="dark"?"active":""} onClick={()=>applyContrast("dark")}>Dark</button><label>Custom<input type="color" value={currentCompany.logoTextColor||autoContrast(currentCompany.primaryColor)} onChange={e=>set("logoTextColor",e.target.value)}/></label></div><small>Used for buttons, wordmarks, and text placed on the primary brand color.</small></AdminField>
 </AdminFormGrid>
 <div className="admin-brand-preview-shell"><div className="admin-brand-logo-preview"><span>Logo preview</span><div className="admin-brand-logo-stage"><CompanyLogo company={preview}/></div></div><div className="admin-brand-color-preview" style={{background:currentCompany.primaryColor,color:currentCompany.logoTextColor||autoContrast(currentCompany.primaryColor)}}><span>Brand contrast</span><strong>{currentCompany.logoText||currentCompany.shortName}</strong><p>Buttons and text on your primary brand color will use this contrast treatment.</p></div></div>
 {message&&<p className={message.includes("saved")?"admin-inline-success":"admin-error"}>{message}</p>}<div className="admin-settings-actions"><AdminButton type="submit" disabled={saving}>{saving?"Saving...":"Save Brand Settings"}</AdminButton></div>
 </AdminSection></form></AdminPage>;
}
