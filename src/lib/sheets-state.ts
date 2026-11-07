/** Runtime state may legitimately be empty before the first Google setup. */
export function requireSavedRow(result: { data: { id: number } | null; error: { message: string } | null }, label: string) {
  if (result.error) throw new Error(`${label} : ${result.error.message}`);
  if (!result.data) throw new Error(`${label} : aucune configuration enregistrée.`);
}

export const GOOGLE_POPUP_TIMEOUT_MS = 10 * 60 * 1000;

export function syncActivation(enabled: boolean, previous: string | null | undefined, now: string) {
  return enabled ? { enabled: true, enabled_at: previous ?? now, updated_at: now } : { enabled: false, updated_at: now };
}