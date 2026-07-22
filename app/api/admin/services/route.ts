import { NextRequest, NextResponse } from "next/server";
import { getServiceLibraryFromDb, replaceServiceLibrary } from "@/lib/service-repository";

export async function GET(){
  try{return NextResponse.json(await getServiceLibraryFromDb());}
  catch(error){console.error("Service library GET error:",error);return NextResponse.json({error:"Unable to load services"},{status:500});}
}

export async function PUT(request:NextRequest){
  try{
    const body=await request.json();
    if(!Array.isArray(body))return NextResponse.json({error:"Service list is required"},{status:400});
    return NextResponse.json(await replaceServiceLibrary(body));
  }catch(error){console.error("Service library PUT error:",error);return NextResponse.json({error:"Unable to save services"},{status:500});}
}
