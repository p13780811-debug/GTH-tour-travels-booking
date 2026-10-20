import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Use a separate high-entropy preview test token; never a supplier API key. */
export function sandboxAuthorized(request: Request): boolean {
  if (process.env.VERCEL_ENV !== "preview" ||
      process.env.GTH_NUITEE_MODE !== "sandbox" ||
      process.env.GTH_NUITEE_SANDBOX_ENABLED !== "true") return false;
  const expected = process.env.GTH_NUITEE_TEST_ACCESS_TOKEN;
  const supplied = request.headers.get("x-gth-nuitee-test-token");
  if (!expected || expected.length < 32 || !supplied || supplied.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}
