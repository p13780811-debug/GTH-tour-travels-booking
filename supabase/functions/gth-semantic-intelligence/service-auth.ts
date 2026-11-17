/** Gateway JWT verification must remain enabled. A rotated service JWT must also
 * prove access to the private embedding table before privileged work starts.
 * Decoding claims alone never authorizes a caller.
 */
export async function isServiceCaller(
  authorization: string | null,
  configuredKey: string,
  probePrivateAccess: (token: string) => Promise<boolean>,
): Promise<boolean> {
  if (!authorization?.startsWith("Bearer ")) return false;
  const token = authorization.slice(7);
  if (!token || token.length > 4096) return false;
  if (token === configuredKey) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const claims = JSON.parse(atob(parts[1].replace(/-/g,"+").replace(/_/g,"/")));
    if (claims.role !== "service_role" || claims.iss !== "supabase" ||
      !Number.isFinite(claims.exp) || claims.exp <= Date.now()/1000) return false;
    // PostgREST verifies the actual signature and private-table capability.
    // An anon/user/forged token cannot pass this database-backed probe.
    return await probePrivateAccess(token);
  } catch { return false; }
}
