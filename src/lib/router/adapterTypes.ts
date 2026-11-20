import type { ProviderId } from "./providerRegistry";

export type AdapterCapability =
  | "verified_deep_link" | "supplier_search" | "internal_discovery" | "unavailable";

export type AdapterReason =
  | "disabled" | "invalid_context" | "invalid_query" | "unsupported_service"
  | "missing_verified_identifier" | "provider_selection_required"
  | "verified_supplier_identity" | "validated_partner_search" | "unsafe_target"
  | "missing_route" | "invalid_route" | "missing_approved_partner"
  | "validated_route_search";

export type AdapterResult = Readonly<{
  capability: AdapterCapability;
  reason: AdapterReason;
  provider: ProviderId;
  href: string | null;
  /** False when a supplier needs the user to re-enter travel inputs. */
  searchIntentForwarded: boolean;
}>;

export function adapterResult(
  capability: AdapterCapability, reason: AdapterReason,
  provider: ProviderId, href: string | null, searchIntentForwarded = false,
): AdapterResult {
  return { capability, reason, provider, href, searchIntentForwarded };
}
