/**
 * Safe temp upload paths — never embed user-controlled filenames in filesystem paths.
 */
import { randomUUID } from "crypto";
import { join } from "path";
import { tmpdir } from "os";

export function createTempUploadPath(prefix = "captioneer"): string {
  return join(tmpdir(), `${prefix}-${Date.now()}-${randomUUID()}.bin`);
}
