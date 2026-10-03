export {
  STYLE_PACKAGE_VERSION,
  isCaptionStyle,
  validateStylePackage,
  type StylePackage,
  type StylePackageMeta,
} from "./schema.js";

export {
  getProjectStylesDir,
  getUserStylesDir,
  installStylePackage,
  listStyleInstallDirs,
  loadInstalledStylePackages,
  loadStylePackageFromFile,
  loadStylePackageFromUrl,
} from "./loader.js";

export {
  getAllPresets,
  getMarketplacePresets,
  getPresetWithMarketplace,
  invalidateMarketplaceCache,
  marketplacePresetKey,
} from "./registry.js";