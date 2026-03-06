import { NextResponse } from "next/server"
import { affiliateLinks } from "@/data/affiliateLinks"

export async function GET(
    req: Request,
    context: { params: Promise<{ slug: string }> }
) {

    const { slug } = await context.params

    const link = affiliateLinks[slug]

    if (!link) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.redirect(link)
}