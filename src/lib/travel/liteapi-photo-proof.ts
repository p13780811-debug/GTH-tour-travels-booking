import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { safeLiteApiImage } from "./liteapi-view-model";

/** Sign the provider-returned primary image with the server-side credential.
 * Only LiteAPI's authenticated search response may create a card photo proof.
 * No secret or unverified caller-supplied image is persisted.
 */
function signature(hotelId: string, image: string): string | null {
  const key = process.env.LITEAPI_API_KEY;
  if (!key) return null;
  return createHmac("sha256", key)
    .update("gth-liteapi-card-photo-v1\n" + hotelId + "\n" + image).digest("hex");
}
export function signLiteApiPhoto(hotelId: string, image: string | null): string | null {
  return image && safeLiteApiImage(image) ? signature(hotelId, image) : null;
}
export function verifiedLiteApiCardPhoto(hotelId: string, image: string | undefined,
  suppliedProof: string | undefined): string | null {
  const url = safeLiteApiImage(image);
  if (!url || !suppliedProof || !/^[a-f0-9]{64}$/.test(suppliedProof)) return null;
  const expected = signature(hotelId, url);
  if (!expected) return null;
  return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(suppliedProof, "hex")) ? url : null;
}
