import { cleanSlug } from "@/lib/security/validators"
import { readJson, RequestError, requestError } from "@/lib/security/request"
import { relatedProperties } from "@/lib/real-estate/related-properties"

// Compatibility endpoint; selects related records, not AI-generated claims.
export async function POST(req: Request) {
    try {
        const body = await readJson(req,4096)
        const slug = cleanSlug(body.slug)
        if (!slug) throw new RequestError("Invalid property slug",400)
        return Response.json(await relatedProperties(slug,6),{headers:{"Cache-Control":"no-store"}})
    } catch (error) { return requestError(error) }
}
