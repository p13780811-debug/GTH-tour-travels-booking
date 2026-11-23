import {NextResponse,type NextRequest} from "next/server";
/** Legacy Google sitelink: preserve the complete query while canonicalizing. */
export function GET(request:NextRequest) {
  return NextResponse.redirect(
    new URL("/maldives-elite-escape"+request.nextUrl.search,request.url),301,
  );
}
