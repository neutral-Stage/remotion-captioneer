import type { WebpackConfiguration } from "@remotion/bundler";
import { Config } from "@remotion/cli/config";

/**
 * Remotion bundles `src/remotion-entry.tsx` from repo root. Source files use
 * `.js` extensions in imports (valid for TypeScript emit) but on disk files
 * are `.ts`/`.tsx`. Webpack must resolve those requests to the real sources.
 */
Config.overrideWebpackConfig((current: WebpackConfiguration) => {
  return {
    ...current,
    resolve: {
      ...current.resolve,
      extensionAlias: {
        ".js": [".ts", ".tsx", ".js"],
        ".mjs": [".mts", ".mjs"],
      },
    },
  };
});

Config.setEntryPoint("src/studio/remotion-entry.tsx");
