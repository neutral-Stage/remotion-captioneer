/**
 * Safe package id validation for marketplace installs.
 */

const PACKAGE_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export function assertValidPackageId(id: string): string {
  const trimmed = id.trim();
  if (!PACKAGE_ID_PATTERN.test(trimmed)) {
    throw new Error(
      'Style package meta.id must match ^[a-z0-9][a-z0-9._-]{0,63}$ (lowercase, no path separators)'
    );
  }
  return trimmed;
}
