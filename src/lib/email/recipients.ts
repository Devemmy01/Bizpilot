import type { Business } from "@/types/business";

/**
 * Reports may only go to the signed-in user's own address or the notification email
 * they saved in preferences — otherwise the endpoint could be used to email anyone.
 */
export function isAllowedRecipient(
  to: string,
  accountEmail: string | undefined,
  business: Pick<Business, "notifyPreferences"> | null | undefined,
) {
  const target = to.trim().toLowerCase();
  const allowed = [accountEmail, business?.notifyPreferences?.notifyEmail]
    .filter((e): e is string => Boolean(e))
    .map((e) => e.trim().toLowerCase());
  return allowed.includes(target);
}
