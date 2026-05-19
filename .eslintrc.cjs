/** @type {import("eslint").Linter.Config} */
module.exports = {
  ...require("@remotion/eslint-config"),
  ignorePatterns: ["dist/**", "node_modules/**", "docs/**"],
};
