import { copyFileSync, mkdirSync } from "fs";
import { execSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

export default async function globalSetup(): Promise<void> {
  const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
  const destDir = join(root, ".captioneer/styles");
  mkdirSync(destDir, { recursive: true });
  copyFileSync(
    join(root, "examples/marketplace/sample-style.json"),
    join(destDir, "sample-neon-pulse.json")
  );
  execSync("node scripts/generate-ui-meta.mjs", { cwd: root, stdio: "inherit" });
}
