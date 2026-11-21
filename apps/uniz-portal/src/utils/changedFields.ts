/** Fields whose values differ. Email is compared case-insensitively. */
export function changedProfileFields<K extends string>(
  current: Partial<Record<K, string>>,
  next: Partial<Record<K, string>>,
  keys: readonly K[],
): Partial<Record<K, string>> {
  const patch: Partial<Record<K, string>> = {};
  for (const key of keys) {
    const before = String(current[key] ?? "").trim();
    const after = String(next[key] ?? "").trim();
    const same =
      key === "email"
        ? before.toLowerCase() === after.toLowerCase()
        : before === after;
    if (!same) patch[key] = next[key] ?? "";
  }
  return patch;
}
