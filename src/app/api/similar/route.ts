import { cleanSlug } from "@/lib/security/validators"
import { RequestError, requestError } from "@/lib/security/request"
import { relatedProperties } from "@/lib/real-estate/related-properties"

export async function GET(req: Request) {
    try {
        const slug = cleanSlug(new URL(req.url).searchParams.get("slug"))
        if (!slug) throw new RequestError("Invalid property slug",400)
        return Response.json(await relatedProperties(slug,10),{headers:{"Cache-Control":"no-store"}})
    } catch (error) { return requestError(error) }
}
