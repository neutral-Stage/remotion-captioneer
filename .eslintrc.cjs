/** @type {import("eslint").Linter.Config} */
const base = require("@remotion/eslint-config");

module.exports = {
  ...base,
  ignorePatterns: ["dist/**", "node_modules/**", "docs/**", "tests/**", "playwright.config.ts"],
  overrides: [
    ...(base.overrides ?? []),
    {
      files: [
        "src/cli.ts",
        "src/config.ts",
        "src/node.ts",
        "src/preview-server.ts",
        "src/transcribe-media.ts",
        "src/scaffold.ts",
        "src/whisper.ts",
        "src/providers/**/*.ts",
        "src/sync/audio-analysis.ts",
      ],
      env: { node: true },
    },
    {
      files: ["src/providers/assemblyai.ts"],
      rules: {
        camelcase: "off",
      },
    },
  ],
};
