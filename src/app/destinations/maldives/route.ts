import {NextResponse,type NextRequest} from "next/server";
/** Editorial destination URL shares one canonical landing, never a duplicate. */
export function GET(request:NextRequest) {
  return NextResponse.redirect(
    new URL("/maldives-elite-escape"+request.nextUrl.search,request.url),301,
  );
}
