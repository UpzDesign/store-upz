"use client";

import {useEffect} from "react";
import Link from "next/link";

export default function RequestDetailError({error,reset}:{error:Error&{digest?:string};reset:()=>void}){
 useEffect(()=>{console.error("Admin request detail render failed",error)},[error]);
 return <main style={{maxWidth:800,margin:"60px auto",padding:32,background:"#fff",border:"1px solid #ddd",borderRadius:12,color:"#151515"}}>
  <p style={{fontSize:12,fontWeight:800,letterSpacing:1,textTransform:"uppercase"}}>Request Review</p>
  <h1 style={{fontSize:26,margin:"12px 0"}}>Request details could not render</h1>
  <p>The request may exist, but the admin detail screen encountered an error. Do not delete or resubmit the request yet.</p>
  <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",padding:14,background:"#f4f4f4",borderRadius:8,fontSize:12}}>{error.message||"Unknown rendering error"}{error.digest? ` (reference: ${error.digest})`:""}</pre>
  <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:20}}>
   <button type="button" onClick={reset} style={{padding:"11px 18px",background:"#edbf2d",border:0,borderRadius:6,cursor:"pointer"}}>Retry request</button>
   <Link href="/admin" style={{padding:"11px 18px",background:"#111",color:"#fff",borderRadius:6,textDecoration:"none"}}>Back to Admin</Link>
  </div>
 </main>;
}
